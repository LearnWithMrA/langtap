import type { NextConfig } from 'next'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
  generateEtags: true,
  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
}

export default nextConfig
