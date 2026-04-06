/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.smartsuppchat.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://wlaaasfggwqlbxtefaoq.supabase.co https://api.emailjs.com https://www.google-analytics.com https://www.smartsuppchat.com wss://www.smartsuppchat.com",
      "frame-src https://www.smartsuppchat.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateBuildId: () => {
    const b = crypto.randomBytes ? crypto.randomBytes(8) : require('crypto').randomBytes(8);
    return b.toString('hex');
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Strip all source maps in client bundles
      config.devtool = false;
      // Mangle & compress aggressively — obfuscate variable/function names
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
