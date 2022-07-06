/* eslint-disable */
import { handler } from '../../event-processor-app';
import { TestHelper } from '../test-helpers/test-helper';
import { IAuditEvent } from '../../models/audit-event';
import { AuditEvent as UnknownAuditEvent } from '../../tests/test-events/unknown-audit-event';
import { SNS } from "aws-sdk";
import {MockedFunction} from "ts-jest";
import { randomUUID } from 'crypto';
import {EventProcessorHelper} from "../test-helpers/event-processor-helper";

jest.mock('aws-sdk', () => {
    const mockSNSInstance = {
        publish: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    const mockSNS = jest.fn(() => mockSNSInstance);

    return {
        SNS: mockSNS,
        config: {
            update: jest.fn()
        }
    };
});

jest.mock('crypto', () => {
    return {
        randomUUID: jest.fn(() => {
            return "58339721-64c9-486b-903f-ad7e63fc45de"
        })
    };
});

describe('Unit test for app eventProcessorHandler', function () {
    let consoleMock: jest.SpyInstance;
    let sns: SNS;

    beforeEach(() => {
        consoleMock = jest.spyOn(global.console, 'log');
        sns = new SNS();

        process.env.topicArn = 'SOME-SNS-TOPIC';
        process.env.defaultComponentId = 'SOME-COMPONENT-ID'
    });

    afterEach(() => {
        consoleMock.mockRestore();
        jest.clearAllMocks();
    });

    it('does not send a message if the Lambda errors', async () => {
        const exampleMessage: IAuditEvent = {
            timestamp: 1609464356546575462861, //Incorrect timestamp value
            event_name: 'AUTHENTICATION_ATTEMPT',
            component_id: '1234'
        };

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toBeCalledTimes(0);
    });

    it('does not send a message if the Lambda only contains invalid messages', async () => {
        const exampleMessage = {
            event_name: 'AUTHENTICATION_ATTEMPT',
        }; //Missing required field

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage as IAuditEvent));

        await handler(sqsEvent);

        expect(sns.publish).toBeCalledTimes(0);
    });

    it('accepts a bare minimum payload and stringifies', async () => {
        const expectedResult =
            '{"event_id":"58339721-64c9-486b-903f-ad7e63fc45de","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"SOME-COMPONENT-ID"}';

        const exampleMessage: IAuditEvent = {
            timestamp: 1609462861,
            timestamp_formatted: '2021-01-23T15:43:21.842',
            event_name: 'AUTHENTICATION_ATTEMPT'
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(2);
        expect(randomUUID).toHaveBeenCalledTimes(1);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
    });

    it('does not add empty fields', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"1234","user":{"transaction_id":"a52f6f87","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = {
            event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
            timestamp: 1609462861,
            timestamp_formatted: '2021-01-23T15:43:21.842',
            event_name: 'AUTHENTICATION_ATTEMPT',
            component_id: '1234',
            user: {
                transaction_id: 'a52f6f87',
                email: 'foo@bar.com',
                phone: '07711223344',
                ip_address: '100.100.100.100',
            },
            platform: {
                xray_trace_id: '24727sda4192',
            },
            restricted: {
                experian_ref: 'DSJJSEE29392',
            },
            extensions: {
                response: 'Authentication successful',
            },
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(2);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
    });

    it('successfully stringifies an SQS event', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = EventProcessorHelper.exampleAuditMessage;

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(2);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
    });

    it('successfully stringifies multiple events', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = EventProcessorHelper.exampleAuditMessage;

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });
        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "2" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage), 2);

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(4);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
        expect(consoleMock).toHaveBeenNthCalledWith(3, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(4, 'MessageID is 2');
    });

    it('successfully removes unrecognised elements from an audit event and user field and then logs to cloudwatch', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: UnknownAuditEvent = {
            event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
            client_id: 'some-client',
            timestamp: 1609462861,
            timestamp_formatted: '2021-01-23T15:43:21.842',
            event_name: 'AUTHENTICATION_ATTEMPT',
            component_id: 'AUTH',
            user: {
                transaction_id: 'a52f6f87',
                user_id: 'some_user_id',
                email: 'foo@bar.com',
                phone: '07711223344',
                ip_address: '100.100.100.100',
                session_id: 'c222c1ec',
                persistent_session_id: 'some session id',
                govuk_signin_journey_id: '43143-233Ds-2823-283-dj299j1',
                unknown_user_field: 'some unknown user field'
            },
            platform: {

                xray_trace_id: '24727sda4192',
            },
            restricted: {
                experian_ref: 'DSJJSEE29392',
            },
            extensions: {
                response: 'Authentication successful',
            },
            new_unknown_field: "an unknown field"
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEventWithUnknownField(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(3);
        expect(consoleMock).toHaveBeenNthCalledWith(1, '[WARN] UNKNOWN FIELDS\n{"sqsResourceName":"arn:aws:sqs:us-west-2:123456789012:SQSQueue","eventId":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","eventName":"AUTHENTICATION_ATTEMPT","timestamp":"1609462861","message":"Unknown fields in message.","unknownFields":[{"key":"new_unknown_field","fieldName":"AuditEvent"},{"key":"unknown_user_field","fieldName":"User"}]}');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(3, 'MessageID is 1');
    });

    it('successfully populates missing formatted timestamp fields', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-01T01:01:01.000Z","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = {
            event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
            client_id: 'some-client',
            timestamp: 1609462861,
            timestamp_formatted: '',
            event_name: 'AUTHENTICATION_ATTEMPT',
            component_id: 'AUTH',
            user: {
                transaction_id: 'a52f6f87',
                user_id: 'some_user_id',
                email: 'foo@bar.com',
                phone: '07711223344',
                ip_address: '100.100.100.100',
                session_id: 'c222c1ec',
                persistent_session_id: 'some session id',
                govuk_signin_journey_id: '43143-233Ds-2823-283-dj299j1',
            },
            platform: {
                xray_trace_id: '24727sda4192',
            },
            restricted: {
                experian_ref: 'DSJJSEE29392',
            },
            extensions: {
                response: 'Authentication successful',
            },
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        await handler(sqsEvent);

        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
        expect(consoleMock).toHaveBeenCalledTimes(2);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
    });

    it('logs an error when validation fails on event name', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = EventProcessorHelper.exampleAuditMessage;

        const exampleInvalidMessage: IAuditEvent = {
            event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
            client_id: 'some-client',
            timestamp: 1609462861,
            timestamp_formatted: '2021-01-23T15:43:21.842',
            event_name: '',
            component_id: '1234',
            user: {
                transaction_id: 'a52f6f87',
                user_id: 'some_user_id',
                email: 'foo@bar.com',
                phone: '07711223344',
                ip_address: '100.100.100.100',
                session_id: 'c222c1ec',
                persistent_session_id: 'some session id',
                govuk_signin_journey_id: '43143-233Ds-2823-283-dj299j1',
            },
            platform: {
                xray_trace_id: '24727sda4192',
            },
            restricted: {
                experian_ref: 'DSJJSEE29392',
            },
            extensions: {
                response: 'Authentication successful',
            },
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });
        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "2" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage), 2);
        const sqsEventWithInvalidMessage = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleInvalidMessage));

        sqsEvent.Records.push(...sqsEventWithInvalidMessage.Records)

        await handler(sqsEvent);

        expect(consoleMock).toHaveBeenCalledTimes(5);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
        expect(consoleMock).toHaveBeenNthCalledWith(3, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(4, 'MessageID is 2');
        expect(consoleMock).toHaveBeenNthCalledWith(5, '[ERROR] VALIDATION ERROR\n{"requireFieldError":{"sqsResourceName":"arn:aws:sqs:us-west-2:123456789012:SQSQueue","eventId":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","eventName":"","timestamp":"1609462861","requiredField":"event_name","message":"event_name is a required field."}}');
        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );

    });

    it('logs an error when validation fails on timestamp', async () => {
        const expectedResult =
            '{"event_id":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","client_id":"some-client","timestamp":1609462861,"timestamp_formatted":"2021-01-23T15:43:21.842","event_name":"AUTHENTICATION_ATTEMPT","component_id":"AUTH","user":{"transaction_id":"a52f6f87","user_id":"some_user_id","email":"foo@bar.com","phone":"07711223344","ip_address":"100.100.100.100","session_id":"c222c1ec","persistent_session_id":"some session id","govuk_signin_journey_id":"43143-233Ds-2823-283-dj299j1"},"platform":{"xray_trace_id":"24727sda4192"},"restricted":{"experian_ref":"DSJJSEE29392"},"extensions":{"response":"Authentication successful"}}';

        const exampleMessage: IAuditEvent = EventProcessorHelper.exampleAuditMessage;

        const exampleInvalidMessage: IAuditEvent = {
            event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
            client_id: 'some-client',
            timestamp: 0,
            timestamp_formatted: '2021-01-23T15:43:21.842',
            event_name: 'AUTHENTICATION_ATTEMPT',
            component_id: '1234',
            user: {
                transaction_id: 'a52f6f87',
                user_id: 'some_user_id',
                email: 'foo@bar.com',
                phone: '07711223344',
                ip_address: '100.100.100.100',
                session_id: 'c222c1ec',
                persistent_session_id: 'some session id',
                govuk_signin_journey_id: '43143-233Ds-2823-283-dj299j1',
            },
            platform: {
                xray_trace_id: '24727sda4192',
            },
            restricted: {
                experian_ref: 'DSJJSEE29392',
            },
            extensions: {
                response: 'Authentication successful',
            },
        };

        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "1" });
        (sns.publish().promise as MockedFunction<any>).mockResolvedValueOnce({Success: 'OK', MessageId: "2" });

        const sqsEvent = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage), 2);
        const sqsEventWithInvalidMessage = TestHelper.createSQSEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleInvalidMessage));

        sqsEvent.Records.push(...sqsEventWithInvalidMessage.Records)

        await handler(sqsEvent);

        expect(consoleMock).toHaveBeenCalledTimes(5);
        expect(consoleMock).toHaveBeenNthCalledWith(1, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(2, 'MessageID is 1');
        expect(consoleMock).toHaveBeenNthCalledWith(3, 'Topic ARN: SOME-SNS-TOPIC');
        expect(consoleMock).toHaveBeenNthCalledWith(4, 'MessageID is 2');
        expect(consoleMock).toHaveBeenNthCalledWith(5, '[ERROR] VALIDATION ERROR\n{"requireFieldError":{"sqsResourceName":"arn:aws:sqs:us-west-2:123456789012:SQSQueue","eventId":"66258f3e-82fc-4f61-9ba0-62424e1f06b4","eventName":"AUTHENTICATION_ATTEMPT","requiredField":"timestamp","message":"timestamp is a required field."}}');
        expect(sns.publish).toHaveBeenCalledWith(
            {
                Message: expectedResult,
                TopicArn: 'SOME-SNS-TOPIC',
                MessageAttributes: {
                    eventName: {
                        DataType: 'String',
                        StringValue: 'AUTHENTICATION_ATTEMPT',
                    },
                },
            }
        );
    });
});
