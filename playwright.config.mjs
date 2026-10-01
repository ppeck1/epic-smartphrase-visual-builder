import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "line",
  use: {
    trace: "retain-on-failure"
  },
  projects: [
    {name: "chromium", use: {...devices["Desktop Chrome"]}}
  ]
});
