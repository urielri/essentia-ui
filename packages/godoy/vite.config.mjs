import { generalConfig } from "@repo/vite-config/general";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...generalConfig,
  test: {
    ...generalConfig.test,
    setupFiles: ["./globalMock.js"],
    environment: "jsdom",
  },
});
