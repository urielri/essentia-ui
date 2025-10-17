import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess({
    postcss: false,
    compilerOptions: {
      dev: true,
    },
  }),
};

export default config;
