export interface ILogDetails {
    sqsResourceName: string;
    eventName: string | undefined;
    eventId: string | undefined;
    componentId: string | undefined;
    timestamp: string | undefined;
    message: string;
}
