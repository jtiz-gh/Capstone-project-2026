import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingIncludes: {
    '*': ['public/**/*', '.next/static/**/*'],
  },
}

export default nextConfig