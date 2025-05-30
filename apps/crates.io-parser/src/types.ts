import type { S3Client } from "@aws-sdk/client-s3";

export type AppState = {
  minioClient: S3Client;
  bucket: string;
};
