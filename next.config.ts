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
  async redirects() {
    return [
      {
        source: '/practice',
        has: [{ type: 'query', key: 'mode', value: 'kotoba' }],
        destination: '/practice/kotoba',
        permanent: true,
      },
      {
        source: '/practice',
        has: [{ type: 'query', key: 'mode', value: 'kana' }],
        destination: '/practice/kana',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
