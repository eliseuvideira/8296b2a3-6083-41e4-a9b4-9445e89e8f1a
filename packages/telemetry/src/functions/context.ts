import { context as otelContext, propagation } from "@opentelemetry/api";

export const context = (carrier: Record<string, string> = {}) => {
  return propagation.extract(otelContext.active(), carrier);
};
