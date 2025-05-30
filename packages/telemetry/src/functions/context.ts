import type { Context } from "@opentelemetry/api";
import { context as otelContext, propagation } from "@opentelemetry/api";

export const context = (carrier: Record<string, string> = {}): Context => {
  return propagation.extract(otelContext.active(), carrier);
};
