import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/websites",
        destination: "/dashboard/stores",
        permanent: false,
      },
      {
        source: "/websites/:path*",
        destination: "/dashboard/stores",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;