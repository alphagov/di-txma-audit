@build @dev @staging
Feature: IPV event data journey from firehose to S3

  Scenario Outline: Verify the data journey from firehose to S3
    Given the SQS file "FIREHOSE.json" is available for the "<account>" team
    And the expected file "S3_EXPECTED.json" is available for the "<account>" team
    When the message is sent to firehose
    Then the s3 below should have a new event matching the output file

    Examples:
      | account     |
      | IPV         |