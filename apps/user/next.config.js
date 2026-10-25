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
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com",
      "font-src 'self' https://fonts.gstatic.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${supabaseConnectOrigin()} https://api.emailjs.com https://api.coingecko.com https://min-api.cryptocompare.com https://api.coinbase.com https://api.frankfurter.app https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://www.google-analytics.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com https://smartsupp.com https://*.smartsupp.com wss://www.smartsuppchat.com wss://*.smartsuppchat.com wss://smartsuppcdn.com wss://*.smartsuppcdn.com wss://smartsupp.com wss://*.smartsupp.com`,
      "frame-src https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com",
      "media-src 'self' https://www.smartsuppchat.com https://*.smartsuppchat.com https://smartsuppcdn.com https://*.smartsuppcdn.com",
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
