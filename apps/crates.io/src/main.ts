import { HttpClient } from "@scrappers/http-client";
import amqplib from "amqplib";
import { Telemetry } from "@scrappers/telemetry";
import { StorageMinio } from "@scrappers/storage-minio";
import type { Storage } from "@scrappers/storage";
import { logger } from "./config/logger";
import { trace } from "@opentelemetry/api";
import dotenv from "dotenv";

const QUEUE = "integration.crates.io";
const tracer = trace.getTracer("crates.io");

const main = async () => {
  dotenv.config();

  const telemetry = Telemetry("crates.io");

  telemetry.init({
    otlpEndpoint:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317",
    serviceName: "crates.io",
  });

  logger.info("Starting crates.io");

  const storage = StorageMinio({
    bucket: "integrations",
    endpoint: process.env.MINIO_ENDPOINT ?? "http://127.0.0.1:9000",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
    },
    region: "us-east-1",
    forcePathStyle: true,
  });

  const connection = await amqplib.connect(
    process.env.RABBITMQ_URL ?? "amqp://127.0.0.1:5672",
  );
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  logger.info("Connected to RabbitMQ");

  const client = HttpClient("https://crates.io");

  await channel.consume(QUEUE, async (message) => {
    if (!message) return;

    const headers = message.properties.headers || {};

    const context = telemetry.context({
      traceparent: headers.traceparent,
      tracestate: headers.tracestate,
    });

    await telemetry.propagate(context, async () => {
      await telemetry.span("start-scraping", async () => {
        await consume(message, channel, client, storage);
      });
    });

    const forwardCarrier = telemetry.carrier(context);

    channel.publish(
      "default_exchange",
      "integration.crates.io.parser",
      message.content,
      {
        headers: {
          traceparent: forwardCarrier.traceparent,
          tracestate: forwardCarrier.tracestate,
        },
        contentType: "application/json",
      },
    );
  });
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

const consume = async (
  message: amqplib.Message,
  channel: amqplib.Channel,
  client: HttpClient,
  storage: Storage,
) => {
  const payload = JSON.parse(message.content.toString());

  try {
    const response = await client.request({
      method: "GET",
      path: `/api/v1/crates/${payload.package_name}`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });

    const content = await response.body.json();

    const span = tracer.startSpan("write-to-storage");
    await storage.put(`crates/${payload.package_name}.json`, content);
    span.end();

    channel.ack(message);
  } catch (error) {
    logger.info("Error consuming message", { error });
    channel.nack(message, false, false);
  }
};
