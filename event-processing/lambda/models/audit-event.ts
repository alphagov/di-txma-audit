import { AuditEventUnknownFields, IAuditEventUnknownFields } from './audit-event-unknown-fields';
import { IUserUnknownFields, UserUnknownFields } from './user-unknown-fields.interface';

export interface IAuditEvent {
    event_id?: string;
    client_id?: string;
    timestamp: number;
    timestamp_formatted?: string;
    event_name: string;
    component_id?: string;
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

function createBaseAuditEvent(): IAuditEvent {
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

export class AuditEvent {
    static fromJSONString(object: string) {
        const event = createBaseAuditEvent();
        const jsonObject = JSON.parse(object);
        const unknown_fields = new Map<string, unknown>();
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
                default:
                    unknown_fields.set(value, jsonObject[value]);
                    break;
            }
        }

        if (unknown_fields.size > 0)
            return AuditEventUnknownFields.fromAuditMessage(event, unknown_fields) as IAuditEventUnknownFields;
        return event;
    }

    static toJSON(message: IAuditEvent): object {
        const obj: any = {};
        message.event_id !== undefined && (obj.event_id = message.event_id);
        message.client_id !== undefined && (obj.client_id = message.client_id);
        message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
        message.timestamp_formatted !== undefined && (obj.timestamp_formatted = message.timestamp_formatted);
        message.event_name !== undefined && (obj.event_name = message.event_name);
        message.component_id !== undefined && (obj.component_id = message.component_id);
        message.user !== undefined &&
            (obj.user = message.user ? AuditEventUserMessage.toJSON(message.user) : undefined);
        message.platform !== undefined && (obj.platform = message.platform ? message.platform : undefined);
        message.restricted !== undefined && (obj.restricted = message.restricted ? message.restricted : undefined);
        message.extensions !== undefined && (obj.extensions = message.extensions ? message.extensions : undefined);
        return obj;
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
        const unknown_fields = new Map<string, any>();
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
                default:
                    unknown_fields.set(value, object[value]);
                    break;
            }
        }
        if (unknown_fields.size > 0) {
            return UserUnknownFields.fromAuditEvent(user, unknown_fields) as IUserUnknownFields;
        }
        return user;
    }

    static toJSON(message: IAuditEventUserMessage): object {
        const obj: any = {};
        message.transaction_id !== undefined && (obj.transaction_id = message.transaction_id);
        message.user_id !== undefined && (obj.user_id = message.user_id);
        message.email !== undefined && (obj.email = message.email);
        message.phone !== undefined && (obj.phone = message.phone);
        message.ip_address !== undefined && (obj.ip_address = message.ip_address);
        message.session_id !== undefined && (obj.session_id = message.session_id);
        message.persistent_session_id !== undefined && (obj.persistent_session_id = message.persistent_session_id);
        message.govuk_signin_journey_id !== undefined &&
            (obj.govuk_signin_journey_id = message.govuk_signin_journey_id);
        return obj;
    }
}
