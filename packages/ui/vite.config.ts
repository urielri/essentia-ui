/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "#components/": "./src/components/",
      "#state": "./src/state/index.ts",
      "#types": "./src/types/index.ts",
      "#hooks": "./src/hooks/index.ts",
    },
  },

  test: {
    css: true,
    environment: "jsdom",
    setupFiles: ["./__mocks__/globals.ts"],
    include: [
      "./__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./src/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
});
