import { generalConfig } from "./general.js";

// https://vitejs.dev/config/
export const nextjsConfig = {
  ...generalConfig,
  css: true,
  resolve: {
    alias: {
      "#pages/": "/components/pages/",
      "#components/": "/components/",
      "#services/": "/services/",
      "#utils/": "/components/utils/",
      "#state/": "/state/",
      "#app/": "/app/",
      "#hooks/": "/hooks/",
      "#icons": "/icons/index.ts",
      "#types": "/types/index.ts",
      "#functions": "/functions/index.ts",
      "#utils": "/components/utils/index.ts",
      "#mocks": "/mocks/",
      "#actions/": "/app/actions/",
    },
  },
};
