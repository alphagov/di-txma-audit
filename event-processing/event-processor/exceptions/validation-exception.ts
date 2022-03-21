import { IRequiredFieldsException } from '../models/required-fields-exception.interface';
import { IRequiredFieldError } from '../models/required-field-error.interface';

export class ValidationException extends Error implements IRequiredFieldsException {
    constructor(message: string, requiredFieldErrors: IRequiredFieldError[] = []) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ValidationException.prototype);

        this.requireFieldErrors = requiredFieldErrors;
    }

    requireFieldErrors: IRequiredFieldError[];
}
