import io.cucumber.java.en.And;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

public class Cleanup {
    public static void main(String[] args) {
        emptyBucket("perf");
        emptyBucket("fraud");
    }

    public static void emptyBucket(String endpoint){
        Region region = Region.EU_WEST_2;
        String bucketName = "event-processing-build-"+endpoint+"-splunk-test";

        try (S3Client s3 = S3Client.builder()
                .region(region)
                .build()){

            ListObjectsV2Request listObjects = ListObjectsV2Request
                    .builder()
                    .bucket(bucketName)
                    .build();

            while (true) {
                ListObjectsV2Response res = s3.listObjectsV2(listObjects);
                for (S3Object object : res.contents()){
                    DeleteObjectRequest request = DeleteObjectRequest.builder()
                            .bucket(bucketName)
                            .key(object.key())
                            .build();
                    s3.deleteObject(request);
                }

                if (res.isTruncated()){
                    listObjects = ListObjectsV2Request
                            .builder()
                            .bucket(bucketName)
                            .continuationToken(res.nextContinuationToken())
                            .build();
                } else {
                    break;
                }
            }
        } catch (SdkClientException e) {
            e.printStackTrace();
        }
    }
}

