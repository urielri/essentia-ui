import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: ["../../"], // Permite acceso a la raíz del monorepo
    },
  },
  optimizeDeps: {
    // Excluye tu paquete de UI para que Vite HMR detecte los cambios
    // cuando se reconstruye en el directorio 'dist'.
    exclude: ["@repo/ui-svelte"],
  },
});
