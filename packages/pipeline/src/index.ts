import type { Channel } from "amqplib";
import type { Tracer } from "@opentelemetry/api";
import { context, propagation } from "@opentelemetry/api";

export const pipeline = async ({
  tracer,
  channel,
  queue,
}: {
  tracer: Tracer;
  channel: Channel;
  queue: string;
}) => {
  await channel.assertQueue(queue, {
    durable: true,
  });

  await channel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    const headers: Record<string, string> = message.properties.headers || {};
    const carrier = {
      traceparent: headers.traceparent,
      tracestate: headers.tracestate,
    };

    const extractedContext = propagation.extract(context.active(), carrier);

    await context.with(extractedContext, async () => {
      await tracer.startActiveSpan("start-parsing", async (span) => {
        await consume(channel, message);
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
