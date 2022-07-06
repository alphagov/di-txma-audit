import { ILogDetails } from './log-details.interface';

export interface IRequiredFieldError extends ILogDetails {
    requiredField: string;
}
