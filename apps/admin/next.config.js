/** @type {import('next').NextConfig} */
function supabaseConnectOrigin() {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (u) return new URL(u).origin;
  } catch { /* */ }
  return 'https://wlaaasfggwqlbxtefaoq.supabase.co';
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${supabaseConnectOrigin()} https://api.emailjs.com`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  output: 'export',
  basePath: '/admin',
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateBuildId: () => require('crypto').randomBytes(8).toString('hex'),
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.devtool = false;
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              dead_code: true,
              passes: 3,
              pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.debug'],
            },
            mangle: {
              toplevel: true,
              properties: { regex: /^_(?!_)/ },
            },
            output: {
              comments: false,
              ascii_only: true,
            },
          },
          extractComments: false,
        }),
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
