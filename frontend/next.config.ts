import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: ['./src/styles'],
    quietDeps: true,
    silenceDeprecations: [
      'import',
      'global-builtin',
      'if-function',
      'color-functions'
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      },
      {
        source: '/auth/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'DENY' }]
      }
    ];
  }
};

export default nextConfig;
