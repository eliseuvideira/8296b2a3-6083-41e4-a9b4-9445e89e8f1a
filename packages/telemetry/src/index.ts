import { carrier } from "./functions/carrier";
import { context } from "./functions/context";
import { init } from "./functions/init";
import { propagate } from "./functions/propagate";
import { span } from "./functions/span";

export type Telemetry = {
  init: typeof init;
  context: typeof context;
  propagate: typeof propagate;
  span: ReturnType<typeof span>;
  carrier: typeof carrier;
};

export const Telemetry = (serviceName: string): Telemetry => ({
  init,
  context,
  propagate,
  span: span(serviceName),
  carrier,
});
