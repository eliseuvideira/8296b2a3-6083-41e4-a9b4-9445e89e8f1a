import { z } from "zod";

export const ENV_SCHEMA = z.enum(["dev", "production", "staging", "test"]);

export type Env = z.infer<typeof ENV_SCHEMA>;

export const Env = {
  get: (): Env => {
    const env = process.env.NODE_ENV ?? "dev";
    const parse = ENV_SCHEMA.safeParse(env);
    if (!parse.success) {
      throw new Error(`Invalid environment: ${env}`);
    }
    return parse.data;
  },
};
