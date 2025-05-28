import amqplib from "amqplib";
import { initTelemetry } from "./telemetry";
import { StorageMinio } from "@scrappers/storage-minio";
import type { Storage } from "@scrappers/storage";
import { logger } from "./config/logger";
import { trace, context, propagation } from "@opentelemetry/api";
import { z } from "zod";
import dotenv from "dotenv";

const QUEUE = "integration.crates.io.parser";
const tracer = trace.getTracer("crates.io-parser");

const main = async () => {
  dotenv.config();

  initTelemetry();

  logger.info("Starting crates.io-parser");

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

  await channel.consume(QUEUE, async (message) => {
    if (!message) return;

    // Extract trace context from message headers
    const headers = message.properties.headers || {};
    const carrier = {
      traceparent: headers.traceparent,
      tracestate: headers.tracestate,
    };

    const extractedContext = propagation.extract(context.active(), carrier);

    await context.with(extractedContext, async () => {
      await tracer.startActiveSpan("start-parsing", async (span) => {
        await consume(message, channel, storage);
        span.end();
      });
    });

    const forwardCarrier: Record<string, string> = {};
    propagation.inject(extractedContext, forwardCarrier);

    channel.publish("default_exchange", "consumer", message.content, {
      headers: {
        traceparent: forwardCarrier.traceparent,
        tracestate: forwardCarrier.tracestate,
      },
      contentType: "application/json",
    });
  });
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

const SCHEMA = z.object({
  crate: z.object({
    id: z.string(),
    name: z.string(),
    default_version: z.string(),
    downloads: z.number().int(),
  }),
});

const consume = async (
  message: amqplib.Message,
  channel: amqplib.Channel,
  storage: Storage,
) => {
  try {
    const payload = JSON.parse(Buffer.from(message.content).toString());

    const content = await storage.get(`crates/${payload.package_name}.json`);
    const data = SCHEMA.parse(content);

    const output = {
      id: data.crate.id,
      name: data.crate.name,
      version: data.crate.default_version,
      downloads: data.crate.downloads,
    };

    const span = tracer.startSpan("write-to-storage");
    await storage.put(`outputs/${payload.package_name}.json`, output);
    span.end();

    channel.ack(message);
  } catch (error) {
    logger.info("Error consuming message", { error });
    channel.nack(message, false, false);
  }
};
