import { z } from "zod";

export const ENV_SCHEMA = z.enum(["dev", "production", "staging", "test"]);

export type Env = z.infer<typeof ENV_SCHEMA>;

export const env = (): Env => {
  const parse = ENV_SCHEMA.safeParse(process.env.NODE_ENV ?? "dev");
  if (!parse.success) {
    throw new Error(`Invalid environment: ${process.env.NODE_ENV}`);
  }
  return parse.data;
};
