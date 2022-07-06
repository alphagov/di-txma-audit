export class HmacException extends Error {
    constructor(message: string, innerException?: Error) {
        super(message);

        if (innerException !== undefined) {
            HmacException.prototype.toString = function () {
                return `Error: ${this.message}. InnerException: ${innerException}`;
            };
        } else {
            HmacException.prototype.toString = function () {
                return `Error: ${this.message}`;
            };
        }
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HmacException.prototype);

        this.innerException = innerException;
    }

    innerException: Error | undefined;
}
