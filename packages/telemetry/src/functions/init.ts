import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

export const init = ({
  otlpEndpoint,
  serviceName,
}: {
  otlpEndpoint: string;
  serviceName: string;
}): void => {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: otlpEndpoint,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName,
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .catch((error: Error) =>
        console.error("Error terminating tracing", error),
      )
      .finally(() => process.exit(0));
  });
};
