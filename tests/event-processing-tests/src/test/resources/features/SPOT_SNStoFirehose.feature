Feature: SPOT event data journey from SNS to Firehose

  Scenario: Verify the PII data is removed if the event name is anything other than 'auth_create_account' or 'auth_log_in_success'
    Given the event data <SPOT data file with event name not equals 'auth_create_account' or 'auth_log_in_success'> is available in the SNS
    When firehose pulls the event data
    And compare against file <>
    Then both data file should match

  Scenario: Verify the PII data is NOT removed if the event name is 'auth_create_account'
    Given the event data <SPOT data file with event name equals 'auth_create_account'> is available in the SNS
    When firehose pulls the event data
    And compare against file <>
    Then both data file should match

  Scenario: Verify the PII data is NOT removed if the event name is 'auth_log_in_success'
    Given the event data <SPOT data file with event name equals 'auth_log_in_success'> is available in the SNS
    When firehose pulls the event data
    And compare against file <>
    Then both data file should match

