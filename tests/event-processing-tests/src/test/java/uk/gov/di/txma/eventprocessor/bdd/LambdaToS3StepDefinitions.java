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
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;


import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Stack;
import java.util.zip.GZIPInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LambdaToS3StepDefinitions {
    Region region = Region.EU_WEST_2;
    String output = null;
    String input;
    Long timestamp;
    String log;
    String requestID;
    int count = 0;

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
        JSONObject change = addUniqueFields(json, account);
        input = wrapJSON(change);
    }

    /**
     * Checks the expected S3 output file is present
     *
     * @param endpoints     The endpoints we're checking against
     * @throws IOException
     */
    @And("the output file {string} is available")
    public void the_output_file_is_available(String filename,DataTable endpoints) throws IOException{
        // Loops through the possible endpoints
        List<List<String>> data = endpoints.asLists(String.class);
        for (List<String> endpoint : data) {
            Path filePath = Path.of(new File("src/test/resources/Test Data/" + endpoint.get(0) + filename+".json").getAbsolutePath());
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
                    .logType("Tail")
                    .payload(payload)
                    .build();

            // Checks the data is sent, and records the Request ID to track it
            res = awsLambda.invoke(request);
            assertEquals(200, res.sdkHttpResponse().statusCode(), "A problem calling the lambda. HTTP response was incorrect.");
            log = new String (Base64.getDecoder().decode(res.logResult()), StandardCharsets.UTF_8);
            requestID = res.responseMetadata().requestId();


        } catch (LambdaException e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }

    /**
     * Ensures that the provided string does appear in cloudwatch log produced when the lambda was invoked
     */
    @Then("there should be a {string} message in the {string} lambda logs")
    public void there_should_be_a_message_in_the_lambda_cloudwatch(String message, String account) throws InterruptedException {
        if (!log.contains(message)){
            sendEmpty(account);

            String logGroup = "/aws/lambda/EventProcessorFunction-" + account;
            assertTrue(searchCloudwatch(logGroup, requestID, message), "No log from the lambda contained a " + message + " message.");
        }
    }

    /**
     * This searches the S3 bucket and checks that the new data contains the output file
     *
     * @param account       Which account inputted the message
     * @param endpoints     The endpoints we're checking against
     * @throws IOException
     */
    @And("the s3 below should have a new event matching the respective {string} output file {string}")
    public void the_s3_below_should_have_a_new_event_matching_the_respective_output_file(String account, String filename, DataTable endpoints) throws IOException, InterruptedException {
        // Loops through the possible endpoints
        List<List<String>> data = endpoints.asLists(String.class);
        for (List<String> endpoint : data) {
            assertTrue(findInS3(endpoint.get(0), filename, account),  "The message " + filename + " from " + account + " was not found in the " + endpoint.get(0) + " S3 bucket.");
        }
    }

    /**
     * This searches the S3 bucket and checks that any new data does not contain the output file
     *
     * @param account       Which account inputted the message
     * @param endpoints     The endpoints we're checking against
     * @throws IOException
     */
    @And("the  S3 below should not have a new event matching the respective {string} output file {string}")
    public void the_s3_below_should_not_have_a_new_event_matching_the_respective_output_file(String account,String filename, DataTable endpoints) throws IOException, InterruptedException {
        // Loops through the possible outputs
        List<List<String>> data = endpoints.asLists(String.class);
        for (List<String> endpoint : data) {
            assertFalse(findInS3(endpoint.get(0), filename, account), "The message " + filename + " from " + account + " incorrectly made it through to the " + endpoint.get(0) + " S3 bucket.");
        }
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
     * This adds the current timestamp to the nearest millisecond (if timestamp was already present)
     * and adds the component_id (if component_id was already present)
     *
     * @param json      This is the json which is to be changed
     * @param account   This is the account name to be added to the component_id
     * @return          Returns the amended json
     */
    private JSONObject addUniqueFields(JSONObject json, String account){
        if (timestamp == null){
            timestamp = Instant.now().toEpochMilli();
        }
        // Only adds the new component_id if it's already in the file
        if (json.has("component_id")){
            json.put("component_id", account);
        }
        // Only adds the new timestamp if it's already in the file
        if (json.has("timestamp")){
            json.put("timestamp", timestamp);
        }
        return json;
    }

    /**
     * Finds the latest 2 keys in the S3 bucket and saves the contents in the output variable
     *
     * @param endpoint  What S3 bucket to look at
     */
    private void findLatestKeys(String endpoint){
        // The bucket that will be checked
        String bucketName = "event-processing-build-"+endpoint+"-splunk-test";
        // The list of the latest two keys
        List<String> keys = new ArrayList<>();

        // Opens an S3 client
        try (S3Client s3 = S3Client.builder()
                .region(region)
                .build()){

            // This is used to get the current year, so that we can search the correct s3 files
            ZonedDateTime now = Instant.now().atZone(ZoneOffset.UTC);
            // Lists latest 1000 objects
            ListObjectsV2Request listObjects = ListObjectsV2Request
                    .builder()
                    .bucket(bucketName)
                    .prefix("firehose/"+now.getYear()+"/")
                    .build();

            // Stored the objects
            ListObjectsV2Response res = s3.listObjectsV2(listObjects);
            List<S3Object> objects = res.contents();

            // If no objects were found, returns
            if (res.keyCount()==0){
                return;
            }

            // Stores the most recent two keys
            keys.add(objects.get(objects.size() - 1).key());
            if (res.keyCount() > 1){
                keys.add(objects.get(objects.size() - 2).key());
            }

            // If more than 1000 objects, cycles through the rest
            while (res.isTruncated()){
                // Gets the next batch
                listObjects = ListObjectsV2Request
                        .builder()
                        .bucket(bucketName)
                        .prefix("firehose/"+now.getYear()+"/")
                        .continuationToken(res.nextContinuationToken())
                        .build();

                // Stores the batch
                res = s3.listObjectsV2(listObjects);
                objects = res.contents();

                // If there's more than one object, we store the most recent two keys
                // If there is only one object, we keep the latest key from the previous batch,
                // and store the most recent from this one
                if (res.keyCount() > 1){
                    keys.set(0, objects.get(objects.size() - 1).key());
                    keys.set(1, objects.get(objects.size() - 2).key());
                } else {
                    keys.set(1, objects.get(0).key());
                }
            }

            output = "";
            StringBuilder str = new StringBuilder(output);
            // Loops through the latest two keys
            for (String key : keys){
                // Gets the new object
                GetObjectRequest objectRequest = GetObjectRequest
                        .builder()
                        .key(key)
                        .bucket(bucketName)
                        .build();

                // Reads the new object
                GZIPInputStream gzinpstr = new GZIPInputStream(s3.getObject(objectRequest));
                InputStreamReader inpstr = new InputStreamReader(gzinpstr);
                BufferedReader read = new BufferedReader(inpstr);
                str.append(read.readLine());
            }
            // Stores the messages in output
            output = str.toString();

        } catch (S3Exception e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        } catch (IOException e) {
            throw new RuntimeException(e);
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
     * This searches the S3 bucket for the latest objects and compares them to the output file
     *
     * @param endpoint  Which S3 bucket we are searching
     * @param filename  The output file name
     * @param account   The account which sent the message
     * @return          True or false depending on whether the message was found or not
     * @throws IOException
     * @throws InterruptedException
     */
    public boolean findInS3 (String endpoint, String filename, String account) throws IOException, InterruptedException {
        boolean foundInS3 = false;

        // Has a retry loop in case it finds the wrong key on the first try
        // Count < 11 is enough time for it to be processed by the Firehose
        // If it is the first firehose being checked, it will wait the full time (or until it is found)
        // The counter will continue for further checks to ensure messages have enough time to pass through
        while (!foundInS3 && count < 11) {
            if (count > 0){
                Thread.sleep(10000);
            }
            count ++;

            // Checks for latest key and saves the contents in the output variable
            output = null;
            findLatestKeys(endpoint.toLowerCase());

            // If an object was found
            if (output != null) {
                // Splits the batched outputs into individual jsons
                List<JSONObject> array = separate(output);

                // Takes the input file, and adds a timestamp to the component_id
                Path filePath = Path.of(new File("src/test/resources/Test Data/" + endpoint + filename + ".json").getAbsolutePath());
                String file = Files.readString(filePath);
                JSONObject json = new JSONObject(file);
                JSONObject expectedS3 = addUniqueFields(json, account);

                // Compares all individual jsons with our test data
                for (JSONObject object : array) {
                    if (object.similar(expectedS3)) {
                        foundInS3 = true;
                        break;
                    }
                }
            }
        }
        return foundInS3;
    }

    /**
     * This sends an empty payload through the correct lambda to force any cloudwatch logs to be processed if they haven't already
     *
     * @param account   The account which is sending the payload
     */
    public void sendEmpty(String account) {

        JSONObject json = new JSONObject();
        String empty = wrapJSON(json);

        String functionName = "EventProcessorFunction-" + account;

        // Opens the lambda client
        try (LambdaClient awsLambda = LambdaClient.builder()
                .region(region)
                .build()) {
            // Invoke the lambda with the input data
            SdkBytes payload = SdkBytes.fromUtf8String(empty);
            InvokeRequest request = InvokeRequest.builder()
                    .functionName(functionName)
                    .payload(payload)
                    .build();

            awsLambda.invoke(request);

        } catch (LambdaException e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }

    /**
     * This waits for cloudwatch to update and searches the logs for the inputted string
     * Note: it only searches the logs with the correct request id as found before
     *
     * @param logGroupName  The cloudwatch log to search
     * @param toFind        The strings to be found
     * @return              True or False depending on whether the string was found
     * @throws InterruptedException
     */
    public boolean searchCloudwatch(String logGroupName, String... toFind) throws InterruptedException {
        // Gives enough time for the cloudwatch logs to be processed
        Thread.sleep(20000);
        // This will track if the correct log has been found or not
        boolean found;

        // Opens the cloudwatch client
        try (CloudWatchLogsClient cloudWatchLogsClient = CloudWatchLogsClient.builder()
                .region(region)
                .build()){

            // Finds all log streams in Cloudwatch
            DescribeLogStreamsRequest req = DescribeLogStreamsRequest.builder().logGroupName(logGroupName).orderBy("LastEventTime").descending(true).build();
            DescribeLogStreamsResponse res2 = cloudWatchLogsClient.describeLogStreams(req);
            List<LogStream> logStreams = res2.logStreams();

            // Looks through all logs streams in the log group
            for (LogStream logStream : logStreams) {
                String logStreamName = logStream.logStreamName();
                // Get the messages from the latest batch of cloudwatch messages
                GetLogEventsRequest getLogEventsRequest = GetLogEventsRequest.builder()
                        .logGroupName(logGroupName)
                        .logStreamName(logStreamName)
                        .startFromHead(false)
                        .build();

                // Loops through all logs in the stream
                for (OutputLogEvent event : cloudWatchLogsClient.getLogEvents(getLogEventsRequest).events()) {
                    // assumes found until it is not
                    found = true;

                    // the log to be searched
                    String message = event.message();
                    // Loops through the inputs to be found
                    for (String find : toFind){
                        // If the messages does not contain the string, it has not been found
                        if (!message.contains(find)) {
                            found = false;
                            break;
                        }
                    }
                    // If all inputs were found, we return true
                    if (found){
                        return true;
                    }
                }
            }
        } catch (CloudWatchException e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        }

        return false;
    }
}
