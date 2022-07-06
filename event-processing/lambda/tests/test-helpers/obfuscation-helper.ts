/* istanbul ignore file */
import { IAuditEvent } from '../../models/audit-event';
import { ObfuscationService } from '../../services/obfuscation-service';

export class ObfuscationHelper {
    static exampleObfuscatedMessage: IAuditEvent = {
        event_id: '66258f3e-82fc-4f61-9ba0-62424e1f06b4',
        client_id: 'some-client',
        timestamp: 1609462861,
        timestamp_formatted: '2021-01-23T15:43:21.842',
        event_name: 'AUTHENTICATION_ATTEMPT',
        component_id: 'AUTH',
        user: {
            transaction_id: ObfuscationService.obfuscateField('a52f6f87', 'secret-1-value'),
            user_id: 'some_user_id',
            email: ObfuscationService.obfuscateField('foo@bar.com', 'secret-1-value'),
            phone: ObfuscationService.obfuscateField('07711223344', 'secret-1-value'),
            ip_address: '100.100.100.100',
            session_id: 'c222c1ec',
            persistent_session_id: 'some session id',
            govuk_signin_journey_id: '43143-233Ds-2823-283-dj299j1',
        },
        platform: {
            xray_trace_id: '24727sda4192',
        },
        restricted: {
            experian_ref: ObfuscationService.obfuscateField('DSJJSEE29392', 'secret-1-value'),
        },
        extensions: {
            response: 'Authentication successful',
        },
    };
}
