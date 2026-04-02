import { sveltekit } from "@sveltejs/kit/vite";
import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    alias: {
      // Acceso directo a los archivos HDR/EXR del paquete ui
      "#hdr": path.resolve(__dirname, "../../packages/ui/src/hdr_envs"),
    },
  },
});
