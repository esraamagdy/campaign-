import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const resolve = createRequire(import.meta.url).resolve;
const preload = new URL("../tests/fal-preload.mjs", import.meta.url).href;
console.info(
  "FIXTURE PREVIEW: no FAL calls, no charges. Existing local test images only. Private loopback port 3102.",
);
const child = spawn(
  process.execPath,
  [
    resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3102",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      AI_MODE: "live",
      FAL_KEY: "forma-fixture-placeholder",
      FORMA_TEST_MOCK_FAL: "1",
      AI_IMAGES_PER_HOUR: "12",
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --import=${preload}`,
    },
  },
);
child.on("error", () => {
  console.error(
    "Fixture server could not start. Build the app and check port 3102 is available.",
  );
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
