import amqplib from "amqplib";
import type { Channel } from "amqplib";
import type { Config } from "./config";
import { HttpClient } from "@packages/http-client";
import { Minio } from "./services/minio";
import type { AppState } from "./types";
import { Telemetry } from "@packages/telemetry";
import { z } from "zod";

export class App {
  public static async build(config: Config): Promise<App> {
    const minioClient = Minio.createClient(config.minio);
    const connection = await amqplib.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();

    await channel.assertQueue(config.rabbitmq.queue_name, {
      durable: true,
    });
    await channel.bindQueue(
      config.rabbitmq.queue_name,
      "default_exchange",
      config.rabbitmq.queue_name,
    );

    const bucket = config.minio.bucket_name;
    const appState = {
      minioClient,
      bucket,
    };
    const queue = config.rabbitmq.queue_name;

    const telemetry = Telemetry("crates.io-parser");

    return new App({
      appState,
      channel,
      queue,
      telemetry,
    });
  }

  private readonly appState: AppState;
  private readonly channel: Channel;
  private readonly queue: string;
  private readonly telemetry: Telemetry;

  constructor({
    appState,
    channel,
    queue,
    telemetry,
  }: {
    appState: AppState;
    channel: Channel;
    queue: string;
    telemetry: Telemetry;
  }) {
    this.appState = appState;
    this.channel = channel;
    this.queue = queue;
    this.telemetry = telemetry;
  }

  public async run(): Promise<void> {
    await this.channel.consume(this.queue, async (message) => {
      if (!message) return;

      const headers = message.properties.headers ?? {};
      const context = this.telemetry.context({
        traceparent: headers.traceparent,
        tracestate: headers.tracestate,
      });

      await this.telemetry.propagate(context, async () => {
        await this.telemetry.span("start-scraping", async () => {
          await consumeMessage(message, this.channel, this.appState);
        });
      });

      const forwardCarrier = this.telemetry.carrier(context);

      this.channel.publish("default_exchange", "consumer", message.content, {
        headers: {
          traceparent: forwardCarrier.traceparent,
          tracestate: forwardCarrier.tracestate,
        },
        contentType: "application/json",
      });
    });
  }
}

const SCHEMA = z.object({
  crate: z.object({
    id: z.string(),
    name: z.string(),
    default_version: z.string(),
    downloads: z.number().int(),
  }),
});

const consumeMessage = async (
  message: amqplib.Message,
  channel: amqplib.Channel,
  appState: AppState,
): Promise<void> => {
  try {
    await consume({
      headers: message.properties.headers ?? {},
      content: message.content,
      appState,
    });

    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, false);
  }
};

const consume = async ({
  content,
  appState,
}: {
  headers: Record<string, string>;
  content: Buffer;
  appState: AppState;
}): Promise<void> => {
  const payload = JSON.parse(content.toString());

  const stringified = await Minio.get(
    appState.minioClient,
    appState.bucket,
    `crates/${payload.package_name}.json`,
  );
  const data = SCHEMA.parse(JSON.parse(stringified));

  const output = {
    name: data.crate.name,
    version: data.crate.default_version,
    downloads: data.crate.downloads,
  };

  await Minio.put(
    appState.minioClient,
    appState.bucket,
    `outputs/${payload.package_name}.json`,
    Buffer.from(JSON.stringify(output)),
  );
};
