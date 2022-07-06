export class ObjectHelper {
    public static removeEmpty(obj: any): unknown {
        for (const propName in obj) {
            if (obj[propName] === null || obj[propName] === undefined || obj[propName] == '') {
                delete obj[propName];
            } else if (Array.isArray(obj[propName])) {
                obj[propName].forEach((value: unknown, index: string | number) => {
                    obj[propName][index] = this.removeEmpty(value);
                });
            } else if (typeof obj[propName] === 'object') {
                obj[propName] = this.removeEmpty(obj[propName]);
            }
        }
        return obj;
    }
}
