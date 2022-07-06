export interface IUserUnknownFields {
    transaction_id: string;
    user_id: string;
    email: string;
    phone: string;
    ip_address: string;
    session_id: string;
    persistent_session_id: string;
    govuk_signin_journey_id: string;
    _unknownFields: Map<string, unknown>;
}

export class UserUnknownFields {
    static fromAuditEvent(object: any, unknown_fields: Map<string, unknown>): IUserUnknownFields {
        return {
            transaction_id: isSet(object.transaction_id) ? String(object.transaction_id) : '',
            user_id: isSet(object.user_id) ? String(object.user_id) : '',
            email: isSet(object.email) ? String(object.email) : '',
            phone: isSet(object.phone) ? String(object.phone) : '',
            ip_address: isSet(object.ip_address) ? String(object.ip_address) : '',
            session_id: isSet(object.session_id) ? String(object.session_id) : '',
            persistent_session_id: isSet(object.persistent_session_id) ? String(object.persistent_session_id) : '',
            govuk_signin_journey_id: isSet(object.govuk_signin_journey_id)
                ? String(object.govuk_signin_journey_id)
                : '',
            _unknownFields: unknown_fields,
        };
    }
}

function isSet(value: any): boolean {
    return value !== null && value !== undefined;
}
