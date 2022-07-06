# di-txma-audit
Digital Identity Auditing Services

This project contains source code and supporting files for creating the Event Processor and Audit serverless architecture.

## Event Processing

Event Processing allows for various services to integrate into the TxMA journey. We do this by pulling messages from an SQS queue owned by the various services owners. <br>
These Messages are then asynchronously processed by a Lambda function in order to validate the message body. If a message fails validation it will not be processed. If a message is successfully validated it will be published to an SNS topic in order to fan out to a number of other services:

1. Audit account - Storage for RAW messages in S3.
2. TiCF - Splunk Index containing redacted data.
3. Performance - Splunk Index containing redacted data.

Redaction of the raw data in the case of TiCF and Performance is undertaken by the Obfuscation Lambda. This function runs during the processing step of our
Kinesis FireHose implementation in order to hash any sensitve data before sending to Splunk.

The Event Processing account contains the following AWS Lambda functions:

* Event Processor
* Obfuscation
* Re-Ingest (Not yet implemented)

The remaining infrastructure covers the following AWS services:

* SNS
* KMS
* Kinesis FireHose
* Secret Manager
* S3

see: https://github.com/alphagov/di-txma-audit/tree/main/event-processing

## Audit

The Audit account uses a Kinesis FireHose resource to subscribe to the SNS topic hosted in the Event Processing account. This will batch and store the RAW event messages in an S3 bucket.

Access to this account is restricted in order to prevent access to the sensitive PII data.

Limited access will be granted in order to retrieve records that need to be audited. We will allow these records to be viewed for a limited time frame using the AWS Athena tool.

The Audit account contains the following infrastructure:

* Kinesis FireHose
* KMS
* S3
* Athena (Not yet implemented)

see: https://github.com/alphagov/di-txma-audit/tree/main/audit

## Event Processor Lambda
- event-processing/event-processor - Code for the event processor Lambda function written in TypeScript.
- event-processing/events - Invocation events that you can use to invoke the function using SAM CLI (See below).
- event-processing/event-processor/tests - Unit tests for the application code. 

## Obfuscation Lambda
- event-processing/obfuscation - Code for the obfuscation Lambda function written in TypeScript.
- event-processing/obfuscation/tests - Unit tests for the application code.

## Deploy the sample application

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
* Yarn - [Install Yarn](https://classic.yarnpkg.com/lang/en/docs/install)

To build and deploy your application for the first time, run the following in your shell whilst in either the event-processing or audit folders:

```bash
sam build --template-file <account-name>-template.yml --config-file config/samconfig-<account-name>.toml --config-env "<environment name>"
sam deploy --config-file config/samconfig-<account-name>.toml --config-env "<environment name>"
```
*Note*: When deploying the event processor also include the `--resolve-s3` argument in order to automatically create an s3 bucket of the lambda zip.

*Deploying Locally*: When deploying locally you can specify the profile to be used for deployment by adding the profile argument e.g.

```bash
sam deploy --config-file config/samconfig-<account-name>.toml --config-env "<environment name>" --profile <aws profile name>
```

You can also provide overrides directly when calling sam deploy if you need to provide different parameters to the stacks:

```bash
sam deploy --config-file config/samconfig-event-processing.toml --config-env "develop" --profile di-dev-admin --resolve-s3 --parameter-overrides ParameterKey=AuditAccountARN,ParameterValue=<ARN of account IAM root> ParameterKey=Environment,ParameterValue=<Environment>
```

*Note*: When calling SAM deploy against a template containing a Lambda function make sure to omit the template name argument. If this is not done, the source files will be deployed instead of the compiled files located in .aws-sam.

####Available Environments

- build
- staging
- integration
- production

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
event-processing$ sam build --template-file event-processing-template.yml --config-file config/samconfig-event-processing.toml --config-env "develop"
```

The SAM CLI installs dependencies defined in `package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

The event type we use for the event-processor lambda is an SQSEvent.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
event-processor$ sam local invoke <function name> --event invoke-events/event.json --env-vars invoke-vars/environment-vars.json --profile <dev acccount profile>
```
You can also test against a Lambda deployed into the Dev environment using the AWS CLI:

```bash
event-processor$ aws lambda invoke --function-name <function name> --invocation-type Event --payload "<base64 encoded event json>" outfile.txt --profile <AWSProfileForTheTargetAccount>
```

## Unit tests

Tests are defined in the `<lambda sub folder>/tests` folder in this project. Use yarn to install the [Jest test framework](https://jestjs.io/) and run unit tests.

```bash
event-processor$ cd event-processor
event-processor$ yarn install
event-processor$ yarn run test
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name <stack-name>
```

You can find the stack names defined in the respective config files:

- audit/config/samconfig-audit.toml
- event-processing/config/samconfig-event-processing.toml

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

- [Lambda Destinations](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-destinations/)
- [Testing Lambdas](https://www.trek10.com/blog/lambda-destinations-what-we-learned-the-hard-way)
- [AWS SAM TypeScript](https://aws.amazon.com/blogs/compute/building-typescript-projects-with-aws-sam-cli/)
- [Deploying Lambdas](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html)
