import path from "node:path";
import { z } from "zod";
import { ENV_SCHEMA } from "@packages/env";

export const CONFIG_DIR = path.join(__dirname, "..", "configs");

export const RABBITMQ_CONFIG_SCHEMA = z.object({
  url: z.string(),
  queue_name: z.string(),
});

export const MINIO_CONFIG_SCHEMA = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  bucket_name: z.string(),
  region: z.string(),
  force_path_style: z.boolean().optional(),
});

export const OTEL_CONFIG_SCHEMA = z.object({
  endpoint: z.string(),
});

export const CONFIG_SCHEMA = z.object({
  name: z.string(),
  environment: ENV_SCHEMA,
  rabbitmq: RABBITMQ_CONFIG_SCHEMA,
  minio: MINIO_CONFIG_SCHEMA,
  otel: OTEL_CONFIG_SCHEMA,
});

export type RabbitMQConfig = z.infer<typeof RABBITMQ_CONFIG_SCHEMA>;

export type MinioConfig = z.infer<typeof MINIO_CONFIG_SCHEMA>;

export type OtelConfig = z.infer<typeof OTEL_CONFIG_SCHEMA>;

export type Config = z.infer<typeof CONFIG_SCHEMA>;
