/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "#components/": "/components/",
      "#state": "./state/index.ts",
      "#types": "./types/index.ts",
      "#hooks": "./hooks/index.ts",
      "#utils": "./components/utils/index.ts",
    },
  },
  test: {
    css: true,
    environment: "jsdom",
    include: [
      "./__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
});
