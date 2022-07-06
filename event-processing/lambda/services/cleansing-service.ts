import { IEnrichedAuditEvent } from '../models/enriched-audit-event';
import { CleansedEvent, ICleansedEvent } from '../models/cleansed-event';

export class CleansingService {
    static cleanseEvent(auditEvent: IEnrichedAuditEvent): ICleansedEvent {
        return new CleansedEvent(
            auditEvent.event_id,
            auditEvent.event_name,
            auditEvent.component_id,
            auditEvent.timestamp,
            auditEvent.timestamp_formatted,
        );
    }
}
