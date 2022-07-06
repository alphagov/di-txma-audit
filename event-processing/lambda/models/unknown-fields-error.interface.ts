import { ILogDetails } from './log-details.interface';

export interface IUnknownFieldsError extends ILogDetails {
    unknownFields: Array<unknown>;
}
