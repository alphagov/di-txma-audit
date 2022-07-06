import {
    FirehoseRecordTransformationStatus,
    FirehoseTransformationEvent,
    FirehoseTransformationEventRecord,
    FirehoseTransformationResult,
    FirehoseTransformationResultRecord,
} from 'aws-lambda';
import { ICleansedEvent } from './models/cleansed-event';
import { EnrichedAuditEvent, IEnrichedAuditEvent } from './models/enriched-audit-event';
import { CleansingService } from './services/cleansing-service';

export const handler = async (event: FirehoseTransformationEvent): Promise<FirehoseTransformationResult> => {
    /* Process the list of records and transform them */
    const transformationResult: FirehoseRecordTransformationStatus = 'Ok';

    const output = event.records.map((record: FirehoseTransformationEventRecord) => {
        const plaintextData: string = Buffer.from(record.data, 'base64').toString('ascii');
        const events: unknown[] = JSON.parse(plaintextData);
        const cleansedEvents: ICleansedEvent[] = [];
        let data: string;

        if (events.length > 0) {
            for (const k in events) {
                const auditEvent: IEnrichedAuditEvent = EnrichedAuditEvent.fromJSONString(JSON.stringify(events[k]));
                cleansedEvents.push(CleansingService.cleanseEvent(auditEvent));
            }
            data = Buffer.from(JSON.stringify(cleansedEvents)).toString('base64');
        } else {
            const auditEvent: IEnrichedAuditEvent = EnrichedAuditEvent.fromJSONString(plaintextData);
            const cleansedEvent = CleansingService.cleanseEvent(auditEvent);
            data = Buffer.from(JSON.stringify(cleansedEvent)).toString('base64');
        }

        return {
            recordId: record.recordId,
            result: transformationResult,
            data: data,
        } as FirehoseTransformationResultRecord;
    });

    return { records: output };
};
