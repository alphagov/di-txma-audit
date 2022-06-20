package uk.gov.di.txma.eventprocessor.bdd;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.cucumber.datatable.DataTable;
import org.json.JSONArray;
import org.json.JSONObject;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.model.CloudWatchException;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;

import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.LogStream;
import software.amazon.awssdk.services.cloudwatchlogs.model.OutputLogEvent;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LambdaException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;


import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Stack;
import java.util.zip.GZIPInputStream;
import java.util.Objects;

import static java.util.Objects.isNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class LambdaToS3StepDefinitions {
    Region region = Region.EU_WEST_2;
    String output = null;
    String input;
    Instant time;
    String requestid;
    String timestamp;
    Boolean warn;
    JSONObject correctS3;

    /**
     * Checks that the input test data is present. And changes it to look like an SQS message
     *
     * @param filename      The name of the file which act as the SQS input from the service teams' accounts
     * @param account       The name of the team which the event if from
     * @throws IOException
     */
    @Given("the SQS file {string} is available for the {string} team")
    public void the_SQS_file_is_available_for_the_team(String filename, String account) throws IOException {
        Path filePath = Path.of(new File("src/test/resources/Test Data/" + filename).getAbsolutePath());
        String file = Files.readString(filePath);

        JSONObject json = new JSONObject(file);
        JSONObject change = addUniqueComponentID(json, account);
        input = wrapJSON(change);
    }

    /**
     * Checks the expected S3 output file is present
     *
     * @param endpoints     The endpoints we're checking against
     * @throws IOException
     */
    @And("the output file is available")
    public void the_output_file_is_available(DataTable endpoints) throws IOException{
        // Loops through the possible endpoints
        List<List<String>> data = endpoints.asLists(String.class);
        for (List<String> endpoint : data) {
            Path filePath = Path.of(new File("src/test/resources/Test Data/" + endpoint.get(0) + "_S3_EXPECTED.json").getAbsolutePath());
            Files.readString(filePath);
        }
    }

    /**
     * Invokes the initial lambda to start the data flow
     *
     * @param account   The service team account name for their corresponding lambda
     */
    @When("the {string} lambda is invoked")
    public void the_lambda_is_invoked(String account) {
        String functionName = "EventProcessorFunction-" + account;
        InvokeResponse res;

        // Opens the lambda client
        try (LambdaClient awsLambda = LambdaClient.builder()
                .region(region)
                .build()){

            // Invoke the lambda with the input data
            SdkBytes payload = SdkBytes.fromUtf8String(input);
            InvokeRequest request = InvokeRequest.builder()
                    .functionName(functionName)
                    .invocationType("Event")
                    .payload(payload)
                    .build();

            // Checks the data is sent, and records the Request ID to track it
            res = awsLambda.invoke(request);
            assertEquals(202, res.sdkHttpResponse().statusCode());
            requestid = res.responseMetadata().requestId();

        } catch (LambdaException e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }

        // Records the time of when the lambda is sent to only check later objects in the S3
        time = Instant.now();
    }

    /**
     * Ensures that an error does not appear in cloudwatch when the lambda was invoked
     *
     * @param account   The service team account name for the corresponding lambda
     */
    @Then("there shouldn't be an error message in the {string} lambda cloudwatch")
    public void there_shouldnt_be_an_error_message_in_the_lambda_cloudwatch(String account) {
        assertFalse(findCloudWatchError(account));
    }

    /**
     * Ensures that an error does appear in cloudwatch when the lambda was invoked
     *
     * @param account   The service team account name for the corresponding lambda
     */
    @Then("there should be an error message in the {string} lambda cloudwatch")
    public void there_should_be_an_error_message_in_the_lambda_cloudwatch(String account) {
        assertTrue(findCloudWatchError(account));
    }

    /**
     * Ensures that a warn error does appear in cloudwatch when the lambda was invoked
     *
     * @param account   The service team account name for the corresponding lambda
     */
    @Then("there should be a warn message in the {string} lambda cloudwatch")
    public void there_should_be_a_warn_message_in_the_lambda_cloudwatch(String account) {
        assertFalse(findCloudWatchError(account));
        assertTrue(warn);
    }

    /**
     * This searches the S3 bucket and checks that the new data contains the output file
     *
     * @param account       Which account inputted the message
     * @param endpoints     The endpoints we're checking against
     * @throws IOException
     */
    @And("the s3 below should have a new event matching the respective {string} output file")
    public void the_s3_below_should_have_a_new_event_matching_the_respective_output_file(String account, DataTable endpoints) throws IOException {

        // Loops through the possible outputs
        List<List<String>> data = endpoints.asLists(String.class);
        for (List<String> endpoint : data) {
            output = null;

            // Checks for a new key
            checkForNewKey(endpoint.get(0).toLowerCase());

            assertNotNull(output);

            // Takes the input file, and adds a timestamp to the component_id
            Path filePath = Path.of(new File("src/test/resources/Test Data/" + endpoint.get(0) + "_S3_EXPECTED.json").getAbsolutePath());
            String file = Files.readString(filePath);
            JSONObject json = new JSONObject(file);
            JSONObject expectedS3 = addUniqueComponentID(json, account);

            // Splits the batched outputs into individual jsons
            List<JSONObject> array = separate(output);

            // Compares all individual jsons with our test data
            boolean foundInS3 = false;
            for (JSONObject object: array){
                if (compareOutput(object, expectedS3)){
                    foundInS3 = true;
                    break;
                }
            }

            assertTrue(foundInS3);
        }

    }

    /**
     * This checks that any additional fields are not in the S3 message found
     *
     * @param field     The name of the field which shouldn't be present
     */
    @And("this s3 event should not contain the {string} field")
    public void the_s3_below_should_have_a_new_event_matching_the_respective_output_files(String field) {
        assertFalse(correctS3.has(field));
    }

    /**
     * Wraps the input json to look like an SQS message
     *
     * @param json  The json to be wrapped
     * @return      The wrapped json
     */
    private String wrapJSON(JSONObject json){
        JSONObject record = new JSONObject();
        record.put("messageId", "059f36b4-87a3-44ab-83d2-661975830a7d");

        record.put("body", json.toString());

        JSONArray array = new JSONArray();
        array.put(record);

        JSONObject wrapped = new JSONObject();
        wrapped.put("Records", array);

        return wrapped.toString();
    }

    /**
     * Searches the Cloudwatch Logs for the request id, and returns if an error was found
     *
     * @param account   The service team account name for the corresponding lambda
     * @return          True if an error is found, false if not
     */
    private Boolean findCloudWatchError(String account){
        String logGroupName = "/aws/lambda/EventProcessorFunction-" + account;
        // noEvent ensures we wait for cloudwatch to be updated
        boolean noEvent = true;
        // errorFound tracks if we find an error or not
        boolean errorFound = false;
        // This will return true if a warning is found, but won't fail any tests
        warn = false;
        // count will prevent an infinite loop if the event is not found
        int count = 0;

        // Opens the cloudwatch client
        try (CloudWatchLogsClient cloudWatchLogsClient = CloudWatchLogsClient.builder()
                .region(region)
                .build()){
            while (noEvent){
                // Gives the cloudwatch time to update
                Thread.sleep(60000);

                // Finds all log streams in Cloudwatch
                DescribeLogStreamsRequest req = DescribeLogStreamsRequest.builder().logGroupName(logGroupName).orderBy("LastEventTime").descending(true).build();
                DescribeLogStreamsResponse res2 = cloudWatchLogsClient.describeLogStreams(req);
                List<LogStream> logStreams = res2.logStreams();

                for (LogStream logStream : logStreams) {
                    if (logStream.lastEventTimestamp() > time.getEpochSecond()) {
                        String logStreamName = logStream.logStreamName();
                        // Get the messages from the latest batch of cloudwatch messages
                        GetLogEventsRequest getLogEventsRequest = GetLogEventsRequest.builder()
                                .logGroupName(logGroupName)
                                .logStreamName(logStreamName)
                                .startFromHead(false)
                                .build();

                        // Checks the logs don't contain an 'ERROR'
                        for (OutputLogEvent event : cloudWatchLogsClient.getLogEvents(getLogEventsRequest).events()) {
                            String message = event.message();
                            if (message.contains(requestid)) {
                                if (message.contains("ERROR")) {
                                    errorFound = true;
                                }
                                if (message.contains("WARN")) {
                                    warn = true;
                                }
                                noEvent = false;
                            }
                        }
                    }
                }

                count ++;
                if (count == 30){
                    System.err.println("No corresponding event found");
                    System.exit(1);
                }
            }
        } catch (CloudWatchException e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        return errorFound;
    }

    /**
     * This adds the current timestamp to a component_id for each team to ensure the message is unique
     *
     * @param json      This is the json which the component_id is being amended
     * @param account   This is the account name to be added to the component_id
     * @return          Returns the amended json
     */
    private JSONObject addUniqueComponentID(JSONObject json, String account){
        // Only adds the new component_id if it's already in the file
        if (json.has("component_id")){
            if (timestamp == null){
                timestamp = Instant.now().toString();
            }
            json.put("component_id", account + " " + timestamp);
        }
        return json;
    }

    /**
     * This checks for a new key
     *
     * @param endpoint  What S3 bucket to look at
     */
    private void checkForNewKey(String endpoint){
        String newkey = null;

        String bucketName = "event-processing-build-"+endpoint+"-splunk-test";
        // This ensures that the test will eventually fail, even if a new message is not found
        int timer = 0;


        while (timer < 5 && newkey == null){
            timer ++;

            // Opens an S3 client
            try (S3Client s3 = S3Client.builder()
                    .region(region)
                    .build()){

                ZonedDateTime now = Instant.now().atZone(ZoneOffset.UTC);
                // Lists all objects
                ListObjectsRequest listObjects = ListObjectsRequest
                        .builder()
                        .bucket(bucketName)
                        .prefix("firehose/"+now.getYear()+"/")
                        .build();

                // Finds the latest object
                ListObjectsResponse res = s3.listObjects(listObjects);
                List<S3Object> objects = res.contents();
                if (objects.size() > 0) {
                    S3Object latest = objects.get(objects.size() - 1);

                    // Checks it has been created past the time the test started and stored the corresponding key
                    if (latest.lastModified().compareTo(time) > 0) {
                        newkey = latest.key();
                    } else {
                        // Gives the message time to pass through Firehose
                        Thread.sleep(30000);
                    }
                }

            } catch (S3Exception e) {
                System.err.println(e.awsErrorDetails().errorMessage());
                System.exit(1);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }

        if (newkey != null){
            // Opens S3 client
            try (S3Client s3 = S3Client.builder()
                    .region(region)
                    .build()){

                // Gets the new object
                GetObjectRequest objectRequest = GetObjectRequest
                        .builder()
                        .key(newkey)
                        .bucket(bucketName)
                        .build();

                // Reads the new object
                GZIPInputStream gzinpstr = new GZIPInputStream(s3.getObject(objectRequest));
                InputStreamReader inpstr = new InputStreamReader(gzinpstr);
                BufferedReader read = new BufferedReader(inpstr);
                output = read.readLine();

            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * This separates the batched jsons into a json array
     *
     * @param input The batched jsons
     * @return      The array of jsons
     */
    private List<JSONObject> separate(String input){
        List<JSONObject> output = new ArrayList<>();
        for (int index = 0; index < input.length(); ) {
            if (input.charAt(index) == '{') {
                int close = findBracket(input, index);
                output.add(new JSONObject(input.substring(index, close + 1)));
                index = close + 1;
            } else {
                index++;
            }
        }
        return output;
    }

    /**
     * This find where the corresponding `}` bracket is for the current json
     *
     * @param input The batch of jsons to be separated
     * @param start The index of the opening `{` for the current within the batched jsons
     * @return      The index of the corresponding `}` bracket
     */
    private static int findBracket(String input, int start) {
        Stack<Integer> stack = new Stack<>();
        for (int index = start; index < input.length(); index++) {
            if (input.charAt(index) == '{') {
                stack.push(index);
            } else if (input.charAt(index) == '}') {
                stack.pop();
                if (stack.isEmpty()) {
                    return index;
                }
            }
        }
        return 0;
    }

    /**
     * This compares a message in S3 to the expected S3 output
     *
     * @param S3            The S3 message to be compared
     * @param expectedS3    The expected message
     * @return              True or false depending on if the S3 message contains the expected S3
     */
    private boolean compareOutput(JSONObject S3, JSONObject expectedS3){
        // If not already found
        if (isNull(correctS3)) {
            // This will hold the correct message if all elements match
            correctS3 = S3;

            // Loops through the keys of the expected result
            Iterator<String> keys = expectedS3.keys();
            keys.forEachRemaining(key -> {
                if (!S3.has(key) || !Objects.equals(S3.get(key).toString(), expectedS3.get(key).toString())) {
                    // removes the message if found to not be the right one
                    correctS3 = null;
                }
            });
        }
        return !isNull(correctS3);
    }
}
