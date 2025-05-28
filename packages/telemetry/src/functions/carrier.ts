import type { Context } from "@opentelemetry/api";
import { propagation } from "@opentelemetry/api";

export const carrier = (context: Context): Record<string, string> => {
  const carrier: Record<string, string> = {};

  propagation.inject(context, carrier);

  return carrier;
};
