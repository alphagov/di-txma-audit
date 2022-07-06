import AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { HmacException } from '../exceptions/hmac-exception';

export class KeyService {
    static async getHmacKey(): Promise<string> {
        // Load the AWS SDK
        const region = 'eu-west-2';
        const secretArn: string | undefined = process.env.SECRET_ARN;
        let secret: string;
        let data: PromiseResult<GetSecretValueResponse, AWSError>;

        if (secretArn == undefined) throw new HmacException('Unable to load secret ARN from environment');

        const secretManager = new AWS.SecretsManager({ region: region });

        try {
            data = await secretManager.getSecretValue({ SecretId: secretArn }).promise();
        } catch (e) {
            throw new HmacException('Unable to load secret from secret manager', e as Error);
        }

        if (data.SecretBinary) {
            secret = Buffer.from(data.SecretBinary.toString(), 'base64').toString('ascii');
        } else if (data.SecretString) {
            secret = data.SecretString;
        } else {
            throw new HmacException('Secret does not contain a secret value');
        }

        return secret;
    }
}
