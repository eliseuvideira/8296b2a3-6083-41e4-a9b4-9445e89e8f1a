import type { Context } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";

export const propagate = async <T>(
  extract: Context,
  fn: () => Promise<T>,
): Promise<T> => {
  const result = await context.with(extract, fn);

  return result;
};
