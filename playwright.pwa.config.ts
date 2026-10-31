import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/pwa",
  outputDir: "test-results/pwa",
  use: {
    baseURL: "http://127.0.0.1:3100",
    timezoneId: "Asia/Tokyo",
    serviceWorkers: "allow",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
  },
  webServer: {
    command: "python3 -m http.server 3100 --bind 127.0.0.1 --directory out",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "iphone-15-pro-max",
      use: { ...devices["iPhone 15 Pro Max"], defaultBrowserType: "chromium" },
    },
  ],
});
