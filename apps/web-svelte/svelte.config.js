import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // No se necesita la sección 'alias' aquí.
    // pnpm con "workspace:*" ya se encarga de enlazar los paquetes correctamente.
  },
};

export default config;
