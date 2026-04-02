import { sveltekit } from "@sveltejs/kit/vite";
import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    glsl({
      include: ["**/*.glsl", "**/*.vert", "**/*.frag"],
      compress: false,
    }),
  ],
  server: {
    fs: {
      allow: ["../../"],
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    exclude: ["essentia"],
  },
  resolve: {
    dedupe: ["svelte", "three", "@threlte/core"],
  },
});
