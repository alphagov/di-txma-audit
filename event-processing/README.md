# event-processor

This project contains source code and supporting files for creating the Event Processor and Audit serverless architecture.

###Event Processor
- event-processing/event-processor - Code for the application's Lambda function written in TypeScript.
- event-processing/events - Invocation events that you can use to invoke the function using SAM CLI (See below).
- event-processing/event-processor/tests - Unit tests for the application code. 
- event-processing/event-processor-template.yaml - A template that defines the Event Processor AWS resources.

###Audit
- audit/audit-template.yaml - A template that defines the Audit AWS resources.

The application uses several AWS resources, including Lambda functions, SNS, Kinesis FireHose and S3. These resources are defined in the template files located in the event-processing and audit sub-folders. You can update the template to add AWS resources through the same deployment process that updates your application code.

##Protocol Buffers

To use protocol buffers in typescript we are using the following package:

[ts-proto](https://github.com/stephenh/ts-proto)

Make sure you also have protoc installed:

- [Linux/Mac Install Protoc](https://formulae.brew.sh/formula/protobuf)
- [Windows Install Protoc](https://community.chocolatey.org/packages/protoc)

In order to generate the typescript needed to serialize messages to the protobuf message we need to run the following command in the event-processor directory:

###Linux/Mac:
```bash
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto -ts_proto_opt=useDate=true,esModuleInterop=true,snakeToCamel=false,useExactTypes=false,unknownFields=true --ts_proto_out=. ./protobuf/audit-event.proto
```

###Windows:
```bash
 protoc --plugin=protoc-gen-ts_proto=.\node_modules\.bin\protoc-gen-ts_proto.cmd --ts_proto_opt=useDate=true,esModuleInterop=true,snakeToCamel=false,useExactTypes=false,unknownFields=true --ts_proto_out=. ./protobuf/audit-event.proto
```

This will generate a number of typescript classes and interfaces that can be used to encode and decode buffer arrays and methods to help with JSON conversion.

## Deploy the sample application

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

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

The SAM CLI installs dependencies defined in `event-processor/package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

The event type we use for the event-processor lambda is an SQSEvent.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
event-processor$ sam local invoke EventProcessorFunction --event events/event.json
```
You can also test against a Lambda deployed into the Dev environment using the AWS CLI:

```bash
event-processor$ aws lambda invoke --function-name EventProcessorFunction --invocation-type Event --payload "<base64 encoded event json>" outfile.txt --profile <AWSProfileForTheTargetAccount>
```

## Unit tests

Tests are defined in the `event-processor/tests` folder in this project. Use NPM to install the [Jest test framework](https://jestjs.io/) and run unit tests.

```bash
event-processor$ cd event-processor
event-processor$ npm install
event-processor$ npm run test
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