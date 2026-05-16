/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Force webpack — Turbopack doesn't support WebGPU/Transformers.js yet
  turbopack: false,
  // Security headers applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // Next.js needs these
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://huggingface.co https://cdn-lfs.huggingface.co https://*.huggingface.co", // Allow local models downloading
              "img-src 'self' data:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    // To support loading the transformer worker
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@huggingface\/transformers/,
      resolve: { fullySpecified: false },
    });
    return config;
  },
};

module.exports = nextConfig;
