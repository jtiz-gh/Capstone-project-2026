import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === "true" ? "standalone" : undefined,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingIncludes: {
    "*": ["public/**/*", ".next/static/**/*"],
  },
  devIndicators: false,
}

export default nextConfig
