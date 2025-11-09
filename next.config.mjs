/** @type {import('next').NextConfig} */

// Define a permissive Content Security Policy to ensure ad networks can load all necessary resources.
const csp = [
  // Fallback for directives not explicitly set. Allows loading resources from any source (*).
  // 'unsafe-inline' and 'unsafe-eval' are often required by ad and analytics scripts.
  "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:",
  // Allow scripts from any source, plus inline scripts and dynamic execution.
  "script-src 'self' * 'unsafe-inline' 'unsafe-eval'",
  // Allow iframes from any source.
  "frame-src 'self' *",
  // Allow network connections (fetch, XHR, etc.) to any source.
  "connect-src 'self' *",
  // Allow images from any source, including data URIs and blobs.
  "img-src 'self' * data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "media-src 'self' https://www.w3schools.com",
  // Lock down other directives for better security.
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Use a less strict policy that is the browser default and more compatible with ad networks.
    key: 'Referrer-Policy',
    value: 'no-referrer-when-downgrade'
  },
  {
    // Apply the Content Security Policy to allow external ad scripts to load.
    key: 'Content-Security-Policy',
    value: csp.replace(/\s{2,}/g, ' ').trim()
  }
];


const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Cache pour les API publiques (tout sauf admin, auth, etc.)
        source: '/api/((?!admin|auth|migrate-data|test-db).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Désactivation du cache pour les API sensibles
        source: '/api/(admin|auth|migrate-data|test-db)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;