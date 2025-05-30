import type { S3Client } from "@aws-sdk/client-s3";
import type { HttpClient } from "@packages/http-client";

export type AppState = {
  minioClient: S3Client;
  client: HttpClient;
  bucket: string;
};
