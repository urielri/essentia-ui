// vite.config.js
import { defineConfig } from "file:///home/flow/projects/personal/essentia/essentia-ui/node_modules/.pnpm/vite@5.4.20_@types+node@24.8.1/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///home/flow/projects/personal/essentia/essentia-ui/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.2_svelte@5.40.2_vite@5.4.20_@types+node@24.8.1_/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/flow/projects/personal/essentia/essentia-ui/packages/ui-svelte";
var vite_config_default = defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: false
        // Cambiar a false para producción
      },
      emitCss: true
    })
  ],
  resolve: {
    alias: {
      "#lib": path.resolve(__vite_injected_original_dirname, "./src/lib"),
      "#core": path.resolve(__vite_injected_original_dirname, "./src/lib/core")
    }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: "UiSvelte",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["svelte", /^svelte\//, /^\$app\//],
      output: {
        // CRÍTICO: Preservar la estructura de módulos de Svelte
        preserveModules: false,
        exports: "named"
      }
    }
  },
  optimizeDeps: {
    include: ["@threlte/core", "three"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9mbG93L3Byb2plY3RzL3BlcnNvbmFsL2Vzc2VudGlhL2Vzc2VudGlhLXVpL3BhY2thZ2VzL3VpLXN2ZWx0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvZmxvdy9wcm9qZWN0cy9wZXJzb25hbC9lc3NlbnRpYS9lc3NlbnRpYS11aS9wYWNrYWdlcy91aS1zdmVsdGUvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvZmxvdy9wcm9qZWN0cy9wZXJzb25hbC9lc3NlbnRpYS9lc3NlbnRpYS11aS9wYWNrYWdlcy91aS1zdmVsdGUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGUoe1xuICAgICAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgICAgIGRldjogZmFsc2UsIC8vIENhbWJpYXIgYSBmYWxzZSBwYXJhIHByb2R1Y2NpXHUwMEYzblxuICAgICAgfSxcbiAgICAgIGVtaXRDc3M6IHRydWUsXG4gICAgfSksXG4gIF0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIiNsaWJcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9saWJcIiksXG4gICAgICBcIiNjb3JlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvbGliL2NvcmVcIiksXG4gICAgfSxcbiAgfSxcblxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiBcIi4vc3JjL2luZGV4LnRzXCIsXG4gICAgICBuYW1lOiBcIlVpU3ZlbHRlXCIsXG4gICAgICBmaWxlTmFtZTogXCJpbmRleFwiLFxuICAgICAgZm9ybWF0czogW1wiZXNcIl0sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW1wic3ZlbHRlXCIsIC9ec3ZlbHRlXFwvLywgL15cXCRhcHBcXC8vXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBDUlx1MDBDRFRJQ086IFByZXNlcnZhciBsYSBlc3RydWN0dXJhIGRlIG1cdTAwRjNkdWxvcyBkZSBTdmVsdGVcbiAgICAgICAgcHJlc2VydmVNb2R1bGVzOiBmYWxzZSxcbiAgICAgICAgZXhwb3J0czogXCJuYW1lZFwiLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcIkB0aHJlbHRlL2NvcmVcIiwgXCJ0aHJlZVwiXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4WCxTQUFTLG9CQUFvQjtBQUMzWixTQUFTLGNBQWM7QUFDdkIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGlCQUFpQjtBQUFBLFFBQ2YsS0FBSztBQUFBO0FBQUEsTUFDUDtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLFFBQVEsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxNQUMzQyxTQUFTLEtBQUssUUFBUSxrQ0FBVyxnQkFBZ0I7QUFBQSxJQUNuRDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxVQUFVLGFBQWEsVUFBVTtBQUFBLE1BQzVDLFFBQVE7QUFBQTtBQUFBLFFBRU4saUJBQWlCO0FBQUEsUUFDakIsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGlCQUFpQixPQUFPO0FBQUEsRUFDcEM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
