import { generalConfig } from "@repo/vite-config/general";
import { defineConfig } from "vitest/config";
import path from "path"; // 👈 Necesitas importar 'path'

const rootDir = path.resolve(__dirname, "./");

export default defineConfig({
  ...generalConfig,
  build: {
    lib: {
      entry: ["./components/index.ts"],
      name: "@repo/ui",
      cssCodeSplit: true,
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
      "#components/": path.resolve(rootDir, "components/"),
      "#icons": path.resolve(rootDir, "components/icons/index.ts"),
    },
  },
  test: {
    ...generalConfig.test,
    setupFiles: ["./globalMock.js"],
    environment: "jsdom",
  },
});
