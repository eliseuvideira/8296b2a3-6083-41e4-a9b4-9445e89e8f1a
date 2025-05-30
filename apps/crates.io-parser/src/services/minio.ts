import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  NoSuchBucket,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { MinioConfig } from "../config";

const createClient = (config: MinioConfig): S3Client => {
  const client = new S3Client({
    endpoint: config.url,
    region: config.region,
    credentials: {
      accessKeyId: config.username,
      secretAccessKey: config.password,
    },
    forcePathStyle: config.force_path_style ?? true,
  });

  return client;
};

const listBuckets = async (client: S3Client): Promise<string[]> => {
  const response = await client.send(new ListBucketsCommand({}));
  return (
    response.Buckets?.map((bucket) => bucket.Name ?? "").filter(Boolean) ?? []
  );
};

const createBucket = (client: S3Client, bucket: string): void => {
  client.send(
    new CreateBucketCommand({
      Bucket: bucket,
    }),
  );
};

const ensureBucket = async (
  client: S3Client,
  bucket: string,
): Promise<void> => {
  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: bucket,
      }),
    );
  } catch (error) {
    if (error instanceof NoSuchBucket) {
      await client.send(
        new CreateBucketCommand({
          Bucket: bucket,
        }),
      );

      return;
    }

    throw error;
  }
};

const put = async (
  client: S3Client,
  bucket: string,
  key: string,
  content: Buffer,
): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
    }),
  );
};

const get = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<string> => {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!response.Body) {
    throw new Error("No body in response");
  }

  return response.Body.transformToString();
};

export const Minio = {
  createClient,
  listBuckets,
  createBucket,
  ensureBucket,
  get,
  put,
};
