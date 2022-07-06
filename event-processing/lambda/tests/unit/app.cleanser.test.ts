/* eslint-disable */
import {handler} from '../../cleanser-app';
import { FirehoseTransformationResult } from 'aws-lambda';
import { IEnrichedAuditEvent, IAuditEventUserMessage } from '../../models/enriched-audit-event';
import { ICleansedEvent } from "../../models/cleansed-event";
import {TestHelper} from "../test-helpers/test-helper";
import { CleanserHelper} from "../test-helpers/cleanser-helper";

jest.mock("aws-sdk");

jest.mock("aws-sdk", () => {
    return {
      config: {
        update() {
          return {};
        },
      },
    };
  });

describe('Unit test for app handler', function () {
    let consoleWarningMock: jest.SpyInstance;
    
    beforeEach(() => {
        consoleWarningMock = jest.spyOn(global.console, 'log');
    });

    afterEach(() => {
       consoleWarningMock.mockRestore();
    });

    it('cleanses a simple event without user object', async () => {
        const exampleMessage: IEnrichedAuditEvent = {
            event_id: "123456789",
            client_id: "My-client-id",
            timestamp: 1609462861,
            timestamp_formatted: "2021-01-23T15:43:21.842",
            event_name: "AUTHENTICATION_ATTEMPT",
            component_id: "AUTH"
        }

        const outputMessage: ICleansedEvent = {
            event_id: "123456789",
            event_name: "AUTHENTICATION_ATTEMPT",
            component_id: "AUTH",
            timestamp: 1609462861,
            timestamp_formatted: "2021-01-23T15:43:21.842",
        }

        const data : string = Buffer.from(TestHelper.encodeAuditEvent(outputMessage)).toString('base64')
        const expectedResult : FirehoseTransformationResult = {
            records: [{
                data: data,
                recordId: "7041e12f-c772-41e4-a05f-8bf25cc6f4bb",
                result: "Ok"
            }]
        }
        
        const firehoseEvent = TestHelper.createFirehoseEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));
        
        const result = await handler(firehoseEvent);
        expect(result).toEqual(expectedResult);
    });

    it('cleanses a complex event with a user object', async () => {

        const user: IAuditEventUserMessage = {
            transaction_id: "aaaa-bbbb-cccc-dddd-1234",
            user_id: "some_user_id",
            email: "user@test.com",
            phone: "020 8888 8888",
            ip_address: "192.168.0.1",
            session_id: "aaaa-bbbb-cccc-dddd-1234",
            persistent_session_id: "aaaa-bbbb-cccc-dddd-1234",
            govuk_signin_journey_id: "aaaa-bbbb-cccc-dddd-1234"
        }

        const exampleMessage: IEnrichedAuditEvent = {
            event_id: "123456789",
            client_id: "My-Client-Id",
            timestamp: 1609462861,
            timestamp_formatted: "2021-01-23T15:43:21.842",
            event_name: "AUTHENTICATION_ATTEMPT",
            component_id: "AUTH",
            user
        }

        const outputMessage: ICleansedEvent = {
            event_id: "123456789",
            event_name: "AUTHENTICATION_ATTEMPT",
            component_id: "AUTH",
            timestamp: 1609462861,
            timestamp_formatted: "2021-01-23T15:43:21.842"
        }

        const data : string = Buffer.from(TestHelper.encodeAuditEvent(outputMessage)).toString('base64')
        const expectedResult : FirehoseTransformationResult = {
            records: [{
                data: data,
                recordId: "7041e12f-c772-41e4-a05f-8bf25cc6f4bb",
                result: "Ok"
            }]
        }

        const firehoseEvent = TestHelper.createFirehoseEventWithEncodedMessage(TestHelper.encodeAuditEvent(exampleMessage));

        const result = await handler(firehoseEvent);
        expect(result).toEqual(expectedResult);
    });

    it('cleanses all messages when receiving an array', async () => {

        const expectedData : string = Buffer.from(TestHelper.encodeAuditEventArray(CleanserHelper.exampleCleansedMessage)).toString('base64')
        const expectedResult : FirehoseTransformationResult = {
            records: [{
                data: expectedData,
                recordId: "7041e12f-c772-41e4-a05f-8bf25cc6f4bb",
                result: "Ok"
            }]
        }

        const firehoseEvent = TestHelper.createFirehoseEventWithEncodedMessage(TestHelper.encodeAuditEventArray(CleanserHelper.exampleEnrichedMessage));

        const result = await handler(firehoseEvent);

        expect(result).toEqual(expectedResult);
    });
});