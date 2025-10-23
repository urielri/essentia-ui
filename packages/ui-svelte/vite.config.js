import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte()],

  optimizeDeps: {
    include: ["html2canvas"],
  },
  resolve: {
    alias: {
      "#lib": path.resolve(__dirname, "./src/lib"),
      "#core": path.resolve(__dirname, "./src/lib/core"),
    },
  },
});
