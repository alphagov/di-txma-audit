/* eslint-disable */
import { CleansingService } from "../../../services/cleansing-service";
import { IEnrichedAuditEvent } from '../../../models/enriched-audit-event';
import { ICleansedEvent } from "../../../models/cleansed-event";

describe('Unit test for cleansing-service', function () {

  it('returns a cleansed event', async () => {

    const inputMessage: IEnrichedAuditEvent = {
      timestamp: 1609462861,
      timestamp_formatted: "2021-01-23T15:43:21.842",
      event_name: 'AUTHENTICATION_ATTEMPT',
      event_id: '123456789',
      component_id: '1234',
      client_id: 'An Example Client'
    };

    const expectedMessage: ICleansedEvent = {
      timestamp: 1609462861,
      timestamp_formatted: "2021-01-23T15:43:21.842",
      event_name: 'AUTHENTICATION_ATTEMPT',
      event_id: '123456789',
      component_id: '1234',
    };

    expect(CleansingService.cleanseEvent(inputMessage)).toEqual(expectedMessage);

  });

});