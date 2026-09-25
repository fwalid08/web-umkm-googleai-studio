import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { appBase } from "@/lib/urls";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "UMKM SaaS - Website Toko Online Gratis untuk UMKM",
  description:
    "Bangun website toko online profesional untuk UMKM dalam menit. Template siap pakai, order 24/7, gratis 14 hari. Mulai sekarang!",
  keywords: [
    "UMKM",
    "website toko online",
    "website builder",
    "toko online gratis",
    "saas indonesia",
    "website umkm",
  ],
  authors: [{ name: "UMKM SaaS Team" }],
  creator: "UMKM SaaS",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appBase(),
    title: "UMKM SaaS - Website Toko Online Gratis untuk UMKM",
    description:
      "Bangun website toko online profesional untuk UMKM dalam menit. Template siap pakai, order 24/7, gratis 14 hari.",
    siteName: "UMKM SaaS",
  },
  twitter: {
    card: "summary_large_image",
    title: "UMKM SaaS - Website Toko Online Gratis",
    description: "Bangun website toko online profesional untuk UMKM dalam menit.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} font-sans antialiased`}>
      <body className="bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}