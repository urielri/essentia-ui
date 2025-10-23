import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "url"; // 💡 AGREGAR ESTO

// --- DEFINICIÓN DE __dirname PARA ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),
    alias: {
      "@repo/ui-svelte": path.resolve(
        __dirname,
        "../../packages/ui-svelte/src/index.ts",
      ),

      "#core/*": path.resolve(
        __dirname,
        "../../packages/ui-svelte/src/lib/core/*",
      ),
    },
  },
};

export default config;
