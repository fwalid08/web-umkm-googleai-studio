import type { ReactNode } from "react";
import { Clock, MapPin, MessageCircle, Phone, Tag, Truck, Package, XCircle } from "lucide-react";
import type { PublicSiteData } from "@/lib/builder/public";
import type { MergedSection } from "@/lib/builder/validation";
import { OrderForm } from "@/components/website/order-form";
import { tenantDisplay } from "@/lib/urls";

/**
 * Sprint 01 US-04 — Renderer website publik tenant (server component).
 * Layout FIXED per template: urutan section ikut config, tanpa drag & drop.
 * Auto-info badge (Epic 3 seed): jam, lokasi, ongkir tampil dari konten.
 */

function rp(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  if (Number.isNaN(v)) return "Rp 0";
  return `Rp ${v.toLocaleString("id-ID")}`;
}

function waLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v ? v : fallback;
}

function AutoBadges({ content }: { content: Record<string, unknown> }) {
  const badges: { icon: ReactNode; label: string }[] = [];
  if (content.hours) badges.push({ icon: <Clock className="h-3.5 w-3.5" />, label: str(content.hours) });
  if (content.address) badges.push({ icon: <MapPin className="h-3.5 w-3.5" />, label: "Lokasi tersedia" });
  if (content.delivery_info)
    badges.push({ icon: <Truck className="h-3.5 w-3.5" />, label: str(content.delivery_info) });
  if (content.return_policy || content.cod === true)
    badges.push({ icon: <Tag className="h-3.5 w-3.5" />, label: str(content.return_policy, "COD Tersedia") });
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-black/5"
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  );
}

function HeroSection({ s, primary }: { s: MergedSection; primary: string }) {
  const c = s.content as Record<string, unknown>;
  const bg = (s.style as Record<string, unknown>).background as string | undefined;
  return (
    <section className="px-4 sm:px-6 py-14 sm:py-20 text-center" style={bg ? { background: bg } : undefined}>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
        {str(c.headline, "Selamat Datang")}
      </h1>
      {c.subheadline ? <p className="mt-4 text-base sm:text-lg opacity-70 max-w-xl mx-auto">{str(c.subheadline)}</p> : null}
      {c.cta_text ? (
        <a
          href={str(c.cta_link, "#products")}
          className="inline-block mt-8 px-8 py-3 rounded-xl font-medium text-white"
          style={{ background: primary }}
        >
          {str(c.cta_text)}
        </a>
      ) : null}
    </section>
  );
}

function ProductGridSection({
  s,
  primary,
  subdomain,
  sellerPhone,
}: {
  s: MergedSection;
  primary: string;
  subdomain: string;
  sellerPhone?: string;
}) {
  const c = s.content as Record<string, unknown>;
  const items = (Array.isArray(c.items) ? c.items : []) as Record<string, unknown>[];
  const columns = Math.min(Math.max(Number(c.columns ?? 3) || 3, 1), 4);
  function priceNum(p: Record<string, unknown>): number {
    const v = typeof p.price === "number" ? p.price : Number(p.price ?? 0);
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  }
  function getStock(p: Record<string, unknown>): number {
    const v = typeof p.stock === "number" ? p.stock : Number(p.stock ?? -1);
    return Number.isFinite(v) ? Math.floor(v) : -1;
  }
  function getLowThreshold(p: Record<string, unknown>): number {
    const v = typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : Number(p.low_stock_threshold ?? 5);
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 5;
  }
  function isActive(p: Record<string, unknown>): boolean {
    return p.is_active !== false;
  }
  return (
    <section id={s.id} className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
      {c.title ? <h2 className="text-2xl font-bold text-center">{str(c.title)}</h2> : null}
      {c.subtitle ? <p className="mt-2 text-center opacity-60">{str(c.subtitle)}</p> : null}
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm opacity-50">Katalog segera hadir. Hubungi kami via WhatsApp.</p>
      ) : (
        <div
          className="mt-8 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {items.map((p, i) => {
            const stock = getStock(p);
            const active = isActive(p);
            const isOutOfStock = stock === 0;
            const isLowStock = stock > 0 && stock <= getLowThreshold(p);
            const disabled = !active || isOutOfStock;

            return (
              <div key={i} className="border rounded-xl overflow-hidden bg-white relative">
                {typeof p.image === "string" && p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={str(p.name, "Produk")} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-4xl bg-black/5">🛍️</div>
                )}
                {/* Stock Badge */}
                {(!active || isOutOfStock || isLowStock) && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {!active && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        <XCircle className="h-3 w-3" /> Nonaktif
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        <Package className="h-3 w-3" /> Habis
                      </span>
                    )}
                    {isLowStock && active && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <Package className="h-3 w-3" /> Sisa {stock}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm">{str(p.name, "Produk")}</p>
                  {"price" in p && p.price !== "" ? (
                    <p className="mt-1 font-bold" style={{ color: primary }}>
                      {rp(p.price)}
                    </p>
                  ) : null}
                  {typeof p.description === "string" && p.description ? (
                    <p className="mt-1 text-xs opacity-60 line-clamp-2">{p.description}</p>
                  ) : null}
                  {subdomain ? (
                    <OrderForm
                      subdomain={subdomain}
                      productId={typeof p.id === "string" ? p.id : undefined}
                      productName={str(p.name, "Produk")}
                      productPrice={priceNum(p)}
                      primary={primary}
                      sellerPhone={sellerPhone}
                      disabled={disabled}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function GallerySection({ s }: { s: MergedSection }) {
  const c = s.content as Record<string, unknown>;
  const images = (Array.isArray(c.images) ? c.images : []) as (string | Record<string, unknown>)[];
  if (images.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
      {c.title ? <h2 className="text-2xl font-bold text-center">{str(c.title)}</h2> : null}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => {
          const src = typeof img === "string" ? img : str((img as Record<string, unknown>).src);
          if (!src) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Galeri ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
          );
        })}
      </div>
    </section>
  );
}

function ContactSection({ s, primary }: { s: MergedSection; primary: string }) {
  const c = s.content as Record<string, unknown>;
  const wa = str(c.whatsapp || c.phone);
  return (
    <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center">{str(c.title, "Hubungi Kami")}</h2>
      <div className="mt-6 flex justify-center">
        <AutoBadges content={c} />
      </div>
      <div className="mt-6 space-y-2 text-center text-sm">
        {c.address ? <p>📍 {str(c.address)}</p> : null}
        {c.hours ? <p>🕘 {str(c.hours)}</p> : null}
        {c.phone ? <p>📞 {str(c.phone)}</p> : null}
        {c.email ? <p>✉️ {str(c.email)}</p> : null}
        {c.instagram ? <p>📸 {str(c.instagram)}</p> : null}
      </div>
      {wa ? (
        <div className="mt-6 text-center">
          <a
            href={waLink(wa, str(c.message, "Halo, saya ingin memesan..."))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
            style={{ background: primary }}
          >
            <MessageCircle className="h-5 w-5" /> Chat WhatsApp
          </a>
        </div>
      ) : null}
    </section>
  );
}

function TestimonialsSection({ s }: { s: MergedSection }) {
  const c = s.content as Record<string, unknown>;
  const items = (Array.isArray(c.items) ? c.items : []) as Record<string, unknown>[];
  if (items.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center">{str(c.title, "Testimoni")}</h2>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t, i) => (
          <figure key={i} className="border rounded-xl p-5 bg-white">
            <blockquote className="text-sm">“{str(t.text)}”</blockquote>
            <figcaption className="mt-3 text-sm font-semibold">
              {str(t.name, "Pelanggan")}
              {typeof t.rating === "number" ? <span className="ml-2 text-amber-500">{"★".repeat(Math.min(t.rating, 5))}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function AboutSection({ s }: { s: MergedSection }) {
  const c = s.content as Record<string, unknown>;
  const features = (Array.isArray(c.features) ? c.features : []) as unknown[];
  return (
    <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-bold">{str(c.title, "Tentang Kami")}</h2>
      {c.content ? <p className="mt-4 opacity-70">{str(c.content)}</p> : null}
      {features.length > 0 ? (
        <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-left">
          {features.map((f, i) => (
            <li key={i} className="border rounded-lg px-3 py-2 bg-white">
              ✅ {String(f)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function FaqSection({ s }: { s: MergedSection }) {
  const c = s.content as Record<string, unknown>;
  const items = (Array.isArray(c.items) ? c.items : []) as Record<string, unknown>[];
  if (items.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center">{str(c.title, "Pertanyaan Umum")}</h2>
      <div className="mt-6 space-y-3">
        {items.map((f, i) => (
          <details key={i} className="border rounded-xl px-4 py-3 bg-white">
            <summary className="font-medium cursor-pointer">{str(f.question)}</summary>
            <p className="mt-2 text-sm opacity-70">{str(f.answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function PromoSection({ s, primary }: { s: MergedSection; primary: string }) {
  const c = s.content as Record<string, unknown>;
  const items = (Array.isArray(c.items) ? c.items : []) as Record<string, unknown>[];
  if (items.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center">{str(c.title, "Promo")}</h2>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {items.map((p, i) => (
          <div key={i} className="rounded-xl p-5 text-white" style={{ background: primary }}>
            <p className="font-bold text-lg">{str(p.title)}</p>
            <p className="mt-1">
              {str(p.price) ? <span className="font-bold">{str(p.price)}</span> : null}{" "}
              {str(p.original_price) ? <s className="opacity-70 text-sm">{str(p.original_price)}</s> : null}{" "}
              {str(p.discount) ? <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">-{str(p.discount)}</span> : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LocationSection({ s }: { s: MergedSection }) {
  const c = s.content as Record<string, unknown>;
  const address = str(c.address || c.content);
  if (!address) return null;
  return (
    <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-bold">{str(c.title, "Lokasi")}</h2>
      <p className="mt-4 opacity-70">📍 {address}</p>
      <a
        className="inline-block mt-4 text-sm underline"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      >
        Buka di Google Maps
      </a>
    </section>
  );
}

function SectionSwitch({
  s,
  primary,
  subdomain,
  sellerPhone,
}: {
  s: MergedSection;
  primary: string;
  subdomain: string;
  sellerPhone?: string;
}) {
  if (!s.enabled) return null;
  switch (s.type) {
    case "hero":
      return <HeroSection s={s} primary={primary} />;
    case "product_grid":
      return <ProductGridSection s={s} primary={primary} subdomain={subdomain} sellerPhone={sellerPhone} />;
    case "image_gallery":
      return <GallerySection s={s} />;
    case "contact_info":
      return <ContactSection s={s} primary={primary} />;
    case "testimonials":
      return <TestimonialsSection s={s} />;
    case "about":
      return <AboutSection s={s} />;
    case "faq":
      return <FaqSection s={s} />;
    case "promo_banner":
      return <PromoSection s={s} primary={primary} />;
    case "location_map":
      return <LocationSection s={s} />;
    case "whatsapp_button":
      return null; // dirender sebagai tombol mengambang
    default:
      return null;
  }
}

export function PublicWebsite({ site }: { site: PublicSiteData }) {
  const primary = site.palette.primary || "#15803D";
  const waText =
    (site.sections.find((s) => s.type === "whatsapp_button" && s.enabled)?.content as
      | Record<string, unknown>
      | undefined)?.message ?? "Halo, saya ingin memesan...";
  const showWaFloat =
    site.whatsapp !== "" &&
    site.sections.some((s) => s.type === "whatsapp_button" && s.enabled);

  return (
    <div
      className="min-h-screen"
      style={{
        background: site.palette.background || "#fff",
        color: site.palette.text || "#1C1917",
        fontFamily: site.typography.body_font || "Inter, sans-serif",
      }}
    >
      <header
        className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur px-4 sm:px-6 h-14 flex items-center justify-between"
        style={{ borderColor: site.palette.border }}
      >
        <span className="font-bold" style={{ fontFamily: site.typography.heading_font }}>
          {site.name}
        </span>
        {site.whatsapp ? (
          <a
            href={waLink(site.whatsapp, "Halo, saya ingin bertanya...")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-4 py-1.5 rounded-lg"
            style={{ background: primary }}
          >
            <Phone className="h-4 w-4" /> Hubungi
          </a>
        ) : null}
      </header>

      <main>
        {[...site.sections]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <SectionSwitch
              key={s.id}
              s={s}
              primary={primary}
              subdomain={site.subdomain}
              sellerPhone={site.whatsapp}
            />
          ))}
      </main>

      <footer className="border-t px-4 py-8 text-center text-sm opacity-60">
        <p className="font-semibold opacity-100">{site.name}</p>
        <p className="mt-1">
          {site.subdomain ? `${tenantDisplay(site.subdomain)}` : ""} • Dibuat dengan UMKM SaaS
        </p>
      </footer>

      {showWaFloat ? (
        <a
          href={waLink(site.whatsapp, String(waText))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat WhatsApp"
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ background: "#22C55E" }}
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      ) : null}
    </div>
  );
}
