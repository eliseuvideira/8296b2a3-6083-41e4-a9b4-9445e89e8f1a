import { carrier } from "./functions/carrier";
import { context } from "./functions/context";
import { init } from "./functions/init";
import { propagate } from "./functions/propagate";
import { span } from "./functions/span";

export const Telemetry = (serviceName: string) => ({
  init,
  context,
  propagate,
  span: span(serviceName),
  carrier,
});
