import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import svelteConfig from "./svelte.config.js";

export default defineConfig({
  plugins: [svelte(svelteConfig)],

  resolve: {
    alias: {
      "#lib": path.resolve(__dirname, "./src/lib"),
      "#core": path.resolve(__dirname, "./src/lib/core"),
    },
  },

  build: {
    sourcemap: true,
    // Añade esto para mejorar el watch
    watch: {
      include: "src/**",
    },
    lib: {
      entry: "./src/index.ts",
      name: "UiSvelte",
      fileName: "index",
      formats: ["es"], // Solo ES modules para mejor HMR
    },
    rollupOptions: {
      external: ["svelte", /^svelte\/.*/, /^\$app\/.*/],
      output: {
        globals: { svelte: "Svelte" },
      },
    },
  },
});
