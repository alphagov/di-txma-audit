export interface ICleansedEvent {
    event_id: string;
    event_name: string;
    component_id: string;
    timestamp: number;
    timestamp_formatted: string;
}

export class CleansedEvent implements ICleansedEvent {
    readonly event_id: string;
    readonly event_name: string;
    readonly component_id: string;
    readonly timestamp: number;
    readonly timestamp_formatted: string;

    constructor(
        event_id: string,
        event_name: string,
        component_id: string,
        timestamp: number,
        timestamp_formatted: string,
    ) {
        this.event_id = event_id;
        this.event_name = event_name;
        this.component_id = component_id;
        this.timestamp = timestamp;
        this.timestamp_formatted = timestamp_formatted;
    }
}
