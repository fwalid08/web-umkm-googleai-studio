import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/websites",
        destination: "/dashboard/websites",
        permanent: false,
      },
      {
        source: "/websites/:path*",
        destination: "/dashboard/websites",
        permanent: false,
      },
      {
        // URL lama halaman billing (pindah ke /dashboard/billing)
        source: "/dashboard/settings/billing",
        destination: "/dashboard/billing",
        permanent: true,
      },
      {
        // URL lama halaman website (pindah ke /dashboard/websites)
        source: "/dashboard/stores",
        destination: "/dashboard/websites",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;