import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' https://images.unsplash.com https://www.google-analytics.com https://www.facebook.com https://tradefrog.in data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : ""} https://checkout.razorpay.com https://sdk.cashfree.com https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://www.google-analytics.com https://ssl.google-analytics.com; connect-src 'self' https://api.razorpay.com https://sandbox.cashfree.com https://api.cashfree.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms; frame-src https://api.razorpay.com https://checkout.razorpay.com https://sdk.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com https://www.youtube.com https://player.vimeo.com` },
      { key: "Accept-Ranges", value: "bytes" },
    ] }];
  },
  async redirects() {
    return [
      { source: "/employees", destination: "/employee", permanent: true },
      { source: "/our-team", destination: "/employee", permanent: true },
      { source: "/team", destination: "/employee", permanent: true },
      { source: "/partners", destination: "/b2b", permanent: true },
      { source: "/partner", destination: "/b2b", permanent: true },
      { source: "/distributor", destination: "/store-locator", permanent: true },
      { source: "/distributors", destination: "/store-locator", permanent: true },
      { source: "/locator", destination: "/store-locator", permanent: true },
    ];
  },
};

export default nextConfig;