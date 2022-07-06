export interface IEnrichedAuditEvent {
    event_id: string;
    client_id?: string;
    timestamp: number;
    timestamp_formatted: string;
    event_name: string;
    component_id: string;
    user?: IAuditEventUserMessage | undefined;
    platform?: unknown | undefined;
    restricted?: unknown | undefined;
    extensions?: unknown | undefined;
}

export interface IAuditEventUserMessage {
    transaction_id?: string;
    user_id?: string;
    email?: string;
    phone?: string;
    ip_address?: string;
    session_id?: string;
    persistent_session_id?: string;
    govuk_signin_journey_id?: string;
}

function createBaseAuditEvent(): IEnrichedAuditEvent {
    return {
        event_id: '',
        client_id: '',
        timestamp: 0,
        timestamp_formatted: '',
        event_name: '',
        component_id: '',
        user: undefined,
        platform: undefined,
        restricted: undefined,
        extensions: undefined,
    };
}

export class EnrichedAuditEvent {
    static fromJSONString(object: string): IEnrichedAuditEvent {
        const event = createBaseAuditEvent();
        const jsonObject = JSON.parse(object);
        for (const value in jsonObject) {
            switch (value) {
                case 'event_id':
                    event.event_id = jsonObject[value];
                    break;
                case 'client_id':
                    event.client_id = jsonObject[value];
                    break;
                case 'timestamp':
                    event.timestamp = jsonObject[value];
                    break;
                case 'timestamp_formatted':
                    event.timestamp_formatted = jsonObject[value];
                    break;
                case 'event_name':
                    event.event_name = jsonObject[value];
                    break;
                case 'component_id':
                    event.component_id = jsonObject[value];
                    break;
                case 'user':
                    event.user = AuditEventUserMessage.fromObject(jsonObject[value]);
                    break;
                case 'platform':
                    event.platform = jsonObject[value];
                    break;
                case 'restricted':
                    event.restricted = jsonObject[value];
                    break;
                case 'extensions':
                    event.extensions = jsonObject[value];
                    break;
            }
        }
        return event;
    }
}

function createBaseAuditEventUserMessage(): IAuditEventUserMessage {
    return {
        transaction_id: '',
        user_id: '',
        email: '',
        phone: '',
        ip_address: '',
        session_id: '',
        persistent_session_id: '',
        govuk_signin_journey_id: '',
    };
}

export class AuditEventUserMessage {
    static fromObject(object: any): IAuditEventUserMessage {
        const user = createBaseAuditEventUserMessage();
        for (const value in object) {
            switch (value) {
                case 'transaction_id':
                    user.transaction_id = object.transaction_id;
                    break;
                case 'user_id':
                    user.user_id = object.user_id;
                    break;
                case 'email':
                    user.email = object.email;
                    break;
                case 'phone':
                    user.phone = object.phone;
                    break;
                case 'ip_address':
                    user.ip_address = object.ip_address;
                    break;
                case 'session_id':
                    user.session_id = object.session_id;
                    break;
                case 'persistent_session_id':
                    user.persistent_session_id = object.persistent_session_id;
                    break;
                case 'govuk_signin_journey_id':
                    user.govuk_signin_journey_id = object.govuk_signin_journey_id;
                    break;
            }
        }
        return user;
    }
}
