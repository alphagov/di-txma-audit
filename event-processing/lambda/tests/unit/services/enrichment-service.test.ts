/* eslint-disable */
import {IValidationResponse} from "../../../models/validation-response.interface";
import {EnrichmentService} from "../../../services/enrichment-service";
import {IAuditEvent} from "../../../models/audit-event";

describe('Unit test for enrichment-service', function () {
  let consoleMock: jest.SpyInstance;

  beforeEach(() => {
    consoleMock = jest.spyOn(global.console, 'log');

    process.env.defaultComponentId = 'SOME-COMPONENT-ID';
  });

  afterEach(() => {
    consoleMock.mockRestore();
    jest.clearAllMocks();
  });

  it('enriches all fields when none are present', async () => {

    const inputMessage: IValidationResponse = {
      isValid: true,
      message: {
        timestamp: 1656425916,
        event_name: 'AUTHENTICATION_ATTEMPT',
      }
    }

    const expectedMessage: IAuditEvent = {
        timestamp: 1656425916,
        timestamp_formatted: "2022-06-28T14:18:36.000Z",
        event_name: 'AUTHENTICATION_ATTEMPT',
        event_id: '123456789',
        component_id: 'SOME-COMPONENT-ID'
    }

    const result = await EnrichmentService.enrichValidationResponse(inputMessage)

    expect(result.timestamp).toEqual(expectedMessage.timestamp)
    expect(result.timestamp_formatted).toEqual(expectedMessage.timestamp_formatted)
    expect(result.event_name).toEqual(expectedMessage.event_name)
    expect(result.component_id).toEqual(expectedMessage.component_id)
    expect(result.event_id).toBeDefined()

  });

  it('performs no enrichment when all fields are present', async () => {

    const fullMessage: IAuditEvent = {
      timestamp: 1656425916,
      timestamp_formatted: "2022-06-28T14:18:36.000Z",
      event_name: 'AUTHENTICATION_ATTEMPT',
      event_id: '1234-5678-abc9-defg',
      component_id: 'SOME-COMPONENT-ID'
    }

    const inputMessage: IValidationResponse = {
      isValid: true,
      message: fullMessage
    }

    const expectedMessage = fullMessage
    const result = await EnrichmentService.enrichValidationResponse(inputMessage)

    expect(result).toEqual(expectedMessage)

  });

});