import path from "node:path";
import fs from "node:fs/promises";
import toml from "toml";
import type { ZodSchema } from "zod";
import { Env } from "@packages/env";

const fromFile = async (filepath: string): Promise<Record<string, unknown>> => {
  const contents = await fs.readFile(filepath, "utf8");

  return toml.parse(contents);
};

export const Config = {
  build: async <T>(directory: string, schema: ZodSchema<T>): Promise<T> => {
    const env = Env.get();
    const base = await fromFile(path.join(directory, "base.toml"));
    const environment = await fromFile(path.join(directory, `${env}.toml`));

    return schema.parse({
      ...base,
      ...environment,
    });
  },
};
