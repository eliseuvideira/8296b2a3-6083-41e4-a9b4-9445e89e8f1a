import path from "node:path";
import fs from "node:fs/promises";
import toml from "toml";
import { z } from "zod";
import { ENV_SCHEMA, type Env } from "../types/env";

const CONFIG_DIR = path.join(__dirname, "..", "..", "configs");

const fromFile = async (filepath: string): Promise<Record<string, unknown>> => {
  const contents = await fs.readFile(filepath, "utf8");

  return toml.parse(contents);
};

const CONFIG_SCHEMA = z.object({
  name: z.string(),
  environment: ENV_SCHEMA,
  rabbitmq: z.object({
    url: z.string(),
  }),
  minio: z.object({
    url: z.string(),
    username: z.string(),
    password: z.string(),
    bucket_name: z.string(),
    region: z.string(),
    force_path_style: z.boolean(),
  }),
  otel: z.object({
    endpoint: z.string(),
  }),
});

export type Config = z.infer<typeof CONFIG_SCHEMA>;

export const Config = async (env: Env): Promise<Config> => {
  const base = await fromFile(path.join(CONFIG_DIR, "base.toml"));
  const environment = await fromFile(path.join(CONFIG_DIR, `${env}.toml`));

  return CONFIG_SCHEMA.parse({
    ...base,
    ...environment,
  });
};
