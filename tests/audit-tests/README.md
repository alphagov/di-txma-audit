# di-txma-audit Audit Tests

## In this directory

This directory contains the automation tests for the Audit side of the TxMA service.
The tests have been written to ensure that all the components within the TxMA Audit account are connected and any messages which pass through are manipulated as expected.

The tests will test the configuration in the `dev`, `build`, and `staging` environments.

## Prerequisites

### GDS use

1. [A GDS AWS account](https://gds-request-an-aws-account.cloudapps.digital/)
2. [The GDS CLI configured](https://github.com/alphagov/gds-cli)

### Private use

1. [An AWS account](https://portal.aws.amazon.com/billing/signup?nc2=h_ct&src=header_signup&redirect_url=https%3A%2F%2Faws.amazon.com%2Fregistration-confirmation#/start/email)

## Running locally

### Create your project

Firstly, clone the `di-txma-audit` repository.

After this, navigate to the `di-txma-audit/tests/audit-tests`.

### Setting up your temporary credentials

Then, you need to set your environment variables to match temporary credentials for your AWS account.

#### Using the GDS CLI
You can generate your temporary credentials for the build environment by using the following command:
```bash
gds aws di-txma-audit-build -e
```
and setting the access key, secret access key, and session token in the terminal. <br>
For Mac, simply copy the final three lines produced by the previous command and run them. <br>
For Windows, [set the environment variables](https://phoenixnap.com/kb/windows-set-environment-variable) to the values produced.

Our other event-processing accounts for these tests are:
`di-txma-audit-dev`
`di-txma-audit-staging`

#### Private use
For a private account, follow these [steps to set up temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html).

## Running the script
Then, use the following gradle command to run the tests in the build environment.
The `TEST_ENVIRONMENT` is the environment you are running the test in.
The `TEST_REPORT_DIR` is the location to output the report

Mac:
```bash
export TEST_ENVIRONMENT="build"
export TEST_REPORT_DIR="report"
./gradlew clean test
```
Windows:
```bash
set TEST_ENVIRONMENT="build"
set TEST_REPORT_DIR="report"
gradlew.bat clean
```

To view the report produced, run the following command:
``` bash
open build/reports/tests/test/index.html
```
Or view one of the other produced reports in the `TEST_REPORT_DIR` directory.
