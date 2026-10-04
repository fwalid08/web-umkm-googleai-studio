import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com").replace(/:\d+$/, "");
    const adminHost = `admin.${rootHost}`;
    return [
      {
        source: "/websites",
        destination: "/dashboard/websites",
        missing: [{ type: "host", value: adminHost }],
        permanent: false,
      },
      {
        source: "/websites/:path*",
        destination: "/dashboard/websites",
        missing: [{ type: "host", value: adminHost }],
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
  async rewrites() {
    const adminHost = `admin.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com"}`;
    return [
      // Tenant dashboard at root on admin subdomain
      { source: "/", has: [{ type: "host", value: adminHost }], destination: "/dashboard" },
      { source: "/admin/:path*", has: [{ type: "host", value: adminHost }], destination: "/admin/:path*" },
      // Tenant dashboard routes on admin subdomain
      { source: "/dashboard/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/:path*" },
      { source: "/settings/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/settings/:path*" },
      { source: "/billing/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/billing/:path*" },
      { source: "/products/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/products/:path*" },
      { source: "/orders/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/orders/:path*" },
      { source: "/customers/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/customers/:path*" },
      { source: "/analytics/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/analytics/:path*" },
      { source: "/websites/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/websites/:path*" },
      { source: "/domain/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/domain/:path*" },
      { source: "/themes/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/themes/:path*" },
      { source: "/announcement/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/announcement/:path*" },
      // Auth on admin subdomain
      { source: "/signin", has: [{ type: "host", value: adminHost }], destination: "/signin" },
      { source: "/signup", has: [{ type: "host", value: adminHost }], destination: "/signup" },
    ];
  },
};

export default nextConfig;