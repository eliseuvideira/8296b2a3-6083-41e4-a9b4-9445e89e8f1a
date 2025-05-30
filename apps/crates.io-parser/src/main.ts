import { Telemetry } from "@packages/telemetry";
import dotenv from "dotenv";
import { Config } from "@packages/config";
import { CONFIG_DIR, CONFIG_SCHEMA } from "./config";
import { App } from "./app";

const main = async (): Promise<void> => {
  dotenv.config();

  const config = await Config.build(CONFIG_DIR, CONFIG_SCHEMA);

  const telemetry = Telemetry("crates.io.parser");

  telemetry.init({
    otlpEndpoint: config.otel.endpoint,
    serviceName: config.name,
  });

  const app = await App.build(config);

  await app.run();
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
