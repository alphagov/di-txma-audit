# di-txma-audit Tests

## In this directory

This directory contains two sets of automation tests for the di-txma-audit project. One for the event-processing service, and another for the audit service.
The tests have been written to ensure that all the components within the TxMA service are connected and any messages which pass through are manipulated as expected. i.e. that the [Event Processing service](https://github.com/alphagov/di-txma-audit/tree/main/event-processing) and [Audit service](https://github.com/alphagov/di-txma-audit/tree/main/audit) pass messages through as expected.

These tests do not cover what the unit tests cover. See the [the unit tests](https://github.com/alphagov/di-txma-audit/tree/main/event-processing/lambda/tests/unit) to see what is covered there.

The tests will test the configuration in the `dev`, `build`, and `staging` environments.

## Running the tests

The tests run on an individual basis. So steps will need to be followed to test each side of the service individually. These steps are located at the directory level of the test.

For [Audit tests](https://github.com/alphagov/di-txma-audit/tree/main/tests/audit-tests)

For [Event Processing tests](https://github.com/alphagov/di-txma-audit/tree/main/tests/event-processing-tests)
