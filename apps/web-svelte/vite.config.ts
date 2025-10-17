import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: ["../../"], // Permite acceso a la raíz del monorepo
    },
    watch: {
      // Añade esto para forzar el polling en monorepos
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    exclude: ["@repo/ui-svelte"],
  },
  // CRÍTICO: Esto hace que Vite observe cambios en tu paquete
  resolve: {
    dedupe: ["svelte"],
  },
});
