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
        // Halaman legacy (localStorage, tidak terhubung DB) — alihkan ke
        // pengelola halaman resmi di tab Halaman.
        source: "/dashboard/pages",
        destination: "/dashboard/websites/customize?tab=halaman",
        permanent: true,
      },
      {
        source: "/dashboard/stores",
        destination: "/dashboard/websites",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;