import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

export const initTelemetry = (): void => {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://127.0.0.1:4317",
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: "crates.io-parser",
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error: Error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
};
