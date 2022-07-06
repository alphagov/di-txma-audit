export interface ILogDetails {
    sqsResourceName: string;
    eventName: string;
    eventId: string | undefined;
    timestamp: string | undefined;
    message: string;
}
