import { svelte } from '@sveltejs/vite-plugin-svelte'
import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    svelte(),
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      compress: false,
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
