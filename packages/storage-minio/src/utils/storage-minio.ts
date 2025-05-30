import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Storage } from "@packages/storage";

export interface StorageMinioConfig {
  bucket: string;
  endpoint: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
}

export const StorageMinio = (config: StorageMinioConfig): Storage => {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.credentials.accessKeyId,
      secretAccessKey: config.credentials.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle ?? true,
  });

  const get = async <T>(key: string): Promise<T | null> => {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      return null;
    }

    const body = await response.Body.transformToString();

    const result: T = JSON.parse(body) as T;

    return result;
  };

  const put = async <T>(key: string, value: T): Promise<void> => {
    const body = JSON.stringify(value);

    const result = await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
      }),
    );

    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to put object");
    }
  };

  return {
    get,
    put,
  };
};
