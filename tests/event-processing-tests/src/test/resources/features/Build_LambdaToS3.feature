@build @dev
Feature: Raw event data journey from the lambda to S3 for build (and dev) environment

  Scenario Outline: Check messages pass through lambda to S3
    Given the SQS file "LAMBDA_THROUGH_TO_S3.json" is available for the "<account>" team
    And the output file "_S3_EXPECTED" is available
      | FRAUD    |
      | PERF     |
    When the "<account>" lambda is invoked
    And the s3 below should have a new event matching the respective "<account>" output file "_S3_EXPECTED"
      | FRAUD    |
      | PERF     |

    Examples:
    | account     |
    | IPV         |
    | IPVPass     |
    | KBV         |
    | KBVAddress  |
    | KBVFraud    |
    | SPOT        |


  Scenario Outline: Check messages don't pass through lambda if missing event_name
    Given the SQS file "LAMBDA_MISSING_EVENT_NAME.json" is available for the "<account>" team
    When the "<account>" lambda is invoked
    Then there should be a "[ERROR]" message in the "<account>" lambda logs

    Examples:
      | account     |
      | IPV         |
      | IPVPass     |
      | KBV         |
      | KBVAddress  |
      | KBVFraud    |
      | SPOT        |

  Scenario Outline: Check messages don't pass through lambda if missing timestamp
    Given the SQS file "LAMBDA_MISSING_TIMESTAMP.json" is available for the "<account>" team
    When the "<account>" lambda is invoked
    Then there should be a "[ERROR]" message in the "<account>" lambda logs

    Examples:
      | account     |
      | IPV         |
      | IPVPass     |
      | KBV         |
      | KBVAddress  |
      | KBVFraud    |
      | SPOT        |

  Scenario Outline: Check messages receive a warning in Cloudwatch if addition fields are present
    Given the SQS file "LAMBDA_ADDITIONAL_FIELD.json" is available for the "<account>" team
    And the output file "_S3_EXPECTED" is available
      | FRAUD    |
    When the "<account>" lambda is invoked
    Then there should be a "[WARN]" message in the "<account>" lambda logs
    And the s3 below should have a new event matching the respective "<account>" output file "_S3_EXPECTED"
      | FRAUD    |

    Examples:
      | account     |
      | IPV         |
      | IPVPass     |
      | KBV         |
      | KBVAddress  |
      | KBVFraud    |
      | SPOT        |


  Scenario Outline: Checking the filter sends "AUTH_UPDATE_CLIENT_REQUEST_ERROR" only to Fraud
    Given the SQS file "auth_update_client_request_error.json" is available for the "<account>" team
    And the output file "_expected" is available
      | FRAUD    |
      | PERF     |
    When the "<account>" lambda is invoked
    And the s3 below should have a new event matching the respective "<account>" output file "_expected"
      | FRAUD    |
    And the  S3 below should not have a new event matching the respective "<account>" output file "_expected"
      | PERF |

    Examples:
      | account     |
      | IPV         |


  Scenario Outline: Checking the filter sends "RANDOM_EVENT" to neither Fraud, nor Performance
    Given the SQS file "random_event.json" is available for the "<account>" team
    And the output file "_expected_random" is available
      | FRAUD    |
      | PERF     |
    When the "<account>" lambda is invoked
    And the  S3 below should not have a new event matching the respective "<account>" output file "_expected_random"
      | FRAUD    |
      | PERF     |

    Examples:
      | account     |
      | IPV         |
