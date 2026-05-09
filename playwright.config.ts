import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3200";
const isExternalBaseUrl = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: isExternalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: `${baseURL}/privacy`,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          PORT: "3200",
          NUTRI_ALLOW_TEST_AUTH_OVERRIDE: "1",
          NUTRI_TEST_CLERK_USER_ID: "e2e-user-a",
          NUTRI_TEST_USER_EMAIL: "e2e-user-a@test.local",
          NUTRI_TEST_USER_NAME: "E2E User A",
          OPENAI_API_KEY: ""
        }
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
