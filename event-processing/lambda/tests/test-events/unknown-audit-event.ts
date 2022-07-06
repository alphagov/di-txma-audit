/* eslint-disable */
/* istanbul ignore file */ 
export interface AuditEvent {
    event_id: string;
    client_id: string;
    timestamp: number;
    timestamp_formatted: string;
    event_name: string;
    component_id: string;
    user: IAuditEventUserMessage | undefined;
    platform: unknown | undefined;
    restricted: unknown | undefined;
    extensions: unknown | undefined;
    new_unknown_field: string;
}

export interface IAuditEventUserMessage {
    transaction_id: string;
    user_id: string;
    email: string;
    phone: string;
    ip_address: string;
    session_id: string;
    persistent_session_id: string;
    govuk_signin_journey_id: string;
    unknown_user_field: string;
}

export class AuditEvent {
    static fromJSON(object: any): AuditEvent {
        return {
            event_id: isSet(object.event_id) ? String(object.event_id) : '',
            client_id: isSet(object.client_id) ? String(object.client_id) : '',
            timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
            timestamp_formatted: isSet(object.timestamp_formatted) ? String(object.timestamp_formatted) : '',
            event_name: isSet(object.event_name) ? String(object.event_name) : '',
            component_id: isSet(object.component_id) ? String(object.component_id) : '',
            user: isSet(object.user) ? AuditEventUserMessage.fromJSON(object.user) : undefined,
            platform: isSet(object.platform) ? object.platform : undefined,
            restricted: isSet(object.restricted) ? object.restricted : undefined,
            extensions: isSet(object.extensions) ? object.extensions : undefined,
            new_unknown_field: isSet(object.new_unknown_field) ? String(object.new_unknown_field) : '',
        };
    }

    static toJSON(message: AuditEvent): unknown {
        const obj: any = {};
        message.event_id !== undefined && (obj.event_id = message.event_id);
        message.client_id !== undefined && (obj.client_id = message.client_id);
        message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
        message.timestamp_formatted !== undefined && (obj.timestamp_formatted = message.timestamp_formatted);
        message.event_name !== undefined && (obj.event_name = message.event_name);
        message.component_id !== undefined && (obj.component_id = message.component_id);
        message.user !== undefined &&
            (obj.user = message.user ? AuditEventUserMessage.toJSON(message.user) : undefined);
        message.platform !== undefined &&
            (obj.platform = message.platform ? message.platform : undefined);
        message.restricted !== undefined &&
            (obj.restricted = message.restricted ? message.restricted : undefined);
        message.extensions !== undefined &&
            (obj.extensions = message.extensions ? message.extensions : undefined);
        message.new_unknown_field !== undefined && (obj.new_unknown_field = message.new_unknown_field);
        return obj;
    }
}

export class AuditEventUserMessage {
    static fromJSON(object: any): IAuditEventUserMessage {
        return {
            transaction_id: isSet(object.transaction_id) ? String(object.transaction_id) : '',
            user_id: isSet(object.user_id) ? String(object.user_id) : '',
            email: isSet(object.email) ? String(object.email) : '',
            phone: isSet(object.phone) ? String(object.phone) : '',
            ip_address: isSet(object.ip_address) ? String(object.ip_address) : '',
            session_id: isSet(object.session_id) ? String(object.session_id) : '',
            persistent_session_id: isSet(object.persistent_session_id) ? String(object.persistent_session_id) : '',
            govuk_signin_journey_id: isSet(object.govuk_signin_journey_id) ? String(object.govuk_signin_journey_id) : '',
            unknown_user_field: isSet(object.unknown_user_field) ? String(object.unknown_user_field) : '',
        };
    }

    static toJSON(message: IAuditEventUserMessage): unknown {
        const obj: any = {};
        message.transaction_id !== undefined && (obj.transaction_id = message.transaction_id);
        message.user_id !== undefined && (obj.user_id = message.user_id);
        message.email !== undefined && (obj.email = message.email);
        message.phone !== undefined && (obj.phone = message.phone);
        message.ip_address !== undefined && (obj.ip_address = message.ip_address);
        message.session_id !== undefined && (obj.session_id = message.session_id);
        message.persistent_session_id !== undefined && (obj.persistent_session_id = message.persistent_session_id);
        message.govuk_signin_journey_id !== undefined && (obj.govuk_signin_journey_id = message.govuk_signin_journey_id);
        message.unknown_user_field !== undefined && (obj.unknown_user_field = message.unknown_user_field);
        return obj;
    }
}

function isSet(value: any): boolean {
    return value !== null && value !== undefined;
}
