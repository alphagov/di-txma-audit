import {
    FirehoseRecordTransformationStatus,
    FirehoseTransformationEvent,
    FirehoseTransformationEventRecord,
    FirehoseTransformationResult,
    FirehoseTransformationResultRecord,
} from 'aws-lambda';
import { KeyService } from './services/key-service';
import { AuditEvent, IAuditEvent } from './models/audit-event';
import { ObfuscationService } from './services/obfuscation-service';
import { ObjectHelper } from './utilities/object-helper';

export const handler = async (event: FirehoseTransformationEvent): Promise<FirehoseTransformationResult> => {
    /* Process the list of records and transform them */
    let transformationResult: FirehoseRecordTransformationStatus = 'Ok';
    let hmacKey = '';

    try {
        hmacKey = await KeyService.getHmacKey();
    } catch (e) {
        transformationResult = 'ProcessingFailed';
        console.log('An error occurred getting the hmac key.  Failed with ' + e);
    }

    const output = event.records.map((record: FirehoseTransformationEventRecord) => {
        const plaintextData: string = Buffer.from(record.data, 'base64').toString('ascii');
        const events: unknown[] = JSON.parse(plaintextData);
        const obfuscatedEvents: unknown[] = [];
        let data: string;

        if (transformationResult === 'ProcessingFailed')
            return {
                recordId: record.recordId,
                result: transformationResult,
                data: record.data,
            } as FirehoseTransformationResultRecord;

        if (events.length > 0) {
            for (let i = 0; i < events.length; i++) {
                const auditEvent: IAuditEvent = AuditEvent.fromJSONString(JSON.stringify(events[i]));
                ObfuscationService.obfuscateEvent(auditEvent, hmacKey);
                const cleanedEvent = ObjectHelper.removeEmpty(auditEvent);
                obfuscatedEvents.push(cleanedEvent);
            }
            data = Buffer.from(JSON.stringify(obfuscatedEvents)).toString('base64');
        } else {
            const auditEvent: IAuditEvent = AuditEvent.fromJSONString(plaintextData);
            ObfuscationService.obfuscateEvent(auditEvent, hmacKey);
            const cleanedEvent = ObjectHelper.removeEmpty(auditEvent);
            data = Buffer.from(JSON.stringify(cleanedEvent)).toString('base64');
        }

        return {
            recordId: record.recordId,
            result: transformationResult,
            data: data,
        } as FirehoseTransformationResultRecord;
    });

    if (transformationResult === 'ProcessingFailed') {
        console.log(`Processing completed. Failed records ${output.length}.`);
    } else {
        console.log(`Processing completed. Successful records ${output.length}.`);
    }

    return { records: output };
};
