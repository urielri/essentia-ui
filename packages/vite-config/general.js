import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export const generalConfig = {
  root: ".",
  plugins: [react()],
  test: {
    reporters: ["verbose"],
    coverage: {
      enabled: true,
      provider: "v8",
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/.eslintrc.js",
        "**/*.config.ts",
        "**/*.module.ts",
        "**/*.config.*",
        "**/*.setup.*",
        "**/app/**",
        "**/*/**/index.ts",
        "**/icons/**",
        "**/state/**",
        "**/types/**",
        "**/docs/**",
        "**/e2e/**",
        "**/task-definition/**",
        "**/middleware.ts",
      ],
    },
    include: [
      "./__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["./e2e", "node_modules"],
  },
};
