import { defineConfig } from "@playwright/test";
const live = process.env.FORMA_LIVE_TESTS === "1";
const port = live ? 3101 : 3100;
export default defineConfig({
  testDir: "./e2e",
  testMatch: live ? "live.spec.ts" : "campaign.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60000,
    env: live
      ? {
          AI_MODE: "live",
          FAL_KEY: "forma-integration-test-placeholder",
          FORMA_TEST_MOCK_FAL: "1",
          AI_IMAGES_PER_HOUR: "4",
          AI_TEXT_REQUESTS_PER_HOUR: "20",
          NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --import=${process.cwd()}/tests/fal-preload.mjs`,
        }
      : { AI_MODE: "demo" },
  },
  reporter: "list",
});
