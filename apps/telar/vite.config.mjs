import { nextjsConfig } from "@repo/vite-config/next";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...nextjsConfig,
  test: {
    ...nextjsConfig.test,
    setupFiles: ["./__tests__/globalMock.ts"],
    environment: "jsdom",
  },
});
