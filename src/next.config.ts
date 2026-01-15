import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === "true" ? "standalone" : undefined,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingIncludes: {
    "*": ["public/**/*", ".next/static/**/*"],
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
