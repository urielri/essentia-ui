import { generalConfig } from "@repo/vite-config/general";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...generalConfig,
  build: {
    lib: {
      entry: ["./components/index.ts"],
      name: "essentia-ui",
      rollupOptions: {
        external: ["react", "react-dom"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      },
      sourcemap: true,
    },
  },
  resolve: {
    alias: {
      "#components/": "/components/",
      "#icons": "/components/icons/index.ts",
    },
  },
  test: {
    ...generalConfig.test,
    setupFiles: ["./globalMock.js"],
    environment: "jsdom",
  },
});
