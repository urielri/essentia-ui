import path from 'path'

const TELAR_DOCS_DIR = path.resolve(new URL('.', import.meta.url).pathname, '../../packages/telar')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/telar'],
  env: {
    TELAR_DOCS_DIR,
  },
}

export default nextConfig
