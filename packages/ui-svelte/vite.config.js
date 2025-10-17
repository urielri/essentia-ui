import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
// Importa la configuración del preprocesador Svelte (si tienes svelte.config.js)
// Si no tienes svelte.config.js, puedes usar svelte() directamente.
import svelteConfig from "./svelte.config.js";

export default defineConfig({
  plugins: [
    // Usamos el plugin de Svelte con la configuración del preprocesador
    svelte(svelteConfig),
  ],

  resolve: {
    alias: {
      "#lib": path.resolve(__dirname, "./src/lib"), // <-- AGREGAR ESTO
      "#core": path.resolve(__dirname, "./src/lib/core"),
    },
  },
  // --- Configuraciones de Prueba (Opcional, si usas Vitest) ---
  test: {
    reporters: ["verbose"],
    coverage: {
      enabled: true,
      provider: "v8",
      // Excluye archivos que no deberían ser cubiertos en tests
      exclude: [
        "**/node_modules/**",
        "**/*.config.*",
        "**/docs/**",
        "**/e2e/**",
      ],
    },
    // Incluye archivos de prueba estándar
    include: [
      "./__tests__/**/*.{test,spec}.{ts,mts,cts,jsx,tsx}",
      "./**/*.{test,spec}.{ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["./e2e", "node_modules"],
  },
  optimizeDeps: {
    include: [
      "@threlte/core",
      "three",
      // Agrega cualquier otra dependencia que te de problemas, como '@threlte/extras'
    ],
  },
  // --- Configuraciones de Compilación como Librería ---
  build: {
    // Genera un archivo de mapa de código fuente para facilitar la depuración
    sourcemap: true,

    lib: {
      // El punto de entrada para la compilación de la librería
      entry: "./src/index.ts",
      name: "UiSvelte",
      // Nombre del archivo de salida (ej. index.js)
      fileName: "index",
    },

    // Opciones para Rollup (el motor de bundling de Vite)
    rollupOptions: {
      // **CRUCIAL:** Externaliza Svelte para que no se incluya en el bundle.
      // La aplicación que consuma tu librería ya debe tener Svelte instalado.
      external: ["svelte", /^$app\/.*/],
      output: {
        // Asegura que el componente se pueda importar
        globals: { svelte: "Svelte" },
        // Define formatos de módulo estándar para librerías
        format: ["es", "cjs"],
      },
    },
  },
});
