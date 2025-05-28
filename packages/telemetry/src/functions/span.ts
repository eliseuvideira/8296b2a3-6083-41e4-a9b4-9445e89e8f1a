import { trace } from "@opentelemetry/api";

export const span =
  (serviceName: string) =>
  <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const tracer = trace.getTracer(serviceName);

    return tracer.startActiveSpan(name, async (span) => {
      const result = await fn();

      span.end();

      return result;
    });
  };
