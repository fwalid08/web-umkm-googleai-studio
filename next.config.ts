import type { NextConfig } from "next";

const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com").replace(/:\d+$/, "");
const adminHost = `admin.${rootHost}`;
// Tenant subdomain (mis. tenant-kopibutoni.rabasha.id) harus diizinkan di dev server,
// kalau tidak aset/Server Action dari host tenant diblokir cross-origin.
const tenantWildcard = `*.${rootHost}`;

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [rootHost, adminHost, tenantWildcard],
  async redirects() {
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
        // halaman Desain Website.
        source: "/dashboard/pages",
        destination: "/dashboard/customize",
        permanent: true,
      },
      {
        source: "/dashboard/stores",
        destination: "/dashboard/websites",
        permanent: true,
      },
      {
        // Editor single-page pindah ke /dashboard/web-design/customize
        // (lihat 044_single_page_user_templates.sql). URL lama yang masih
        // membawa pageId store_pages ikut dialihkan ke editor — baris
        // halamannya sudah dihapus, jadi tidak ada lagi tujuan per-id.
        source: "/dashboard/websites/page-builder/:path*",
        destination: "/dashboard/web-design/customize",
        permanent: false,
      },
      {
        source: "/dashboard/customize",
        destination: "/dashboard/web-design",
        permanent: false,
      },
      {
        // Rute lama halaman Desain Website (pindah dari /dashboard/websites).
        source: "/dashboard/websites/customize/:path*",
        destination: "/dashboard/web-design",
        permanent: true,
      },
    ];
  },
  async rewrites() {
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
      // Halaman Desain Website (/dashboard/web-design → kanonik /web-design di admin host)
      { source: "/web-design/:path*", has: [{ type: "host", value: adminHost }], destination: "/dashboard/web-design/:path*" },
      // Auth on admin subdomain
      { source: "/signin", has: [{ type: "host", value: adminHost }], destination: "/signin" },
      { source: "/signup", has: [{ type: "host", value: adminHost }], destination: "/signup" },
    ];
  },
};

export default nextConfig;