'use client';

import { useState } from 'react';
import type { Section, DesignStyle, BookingService } from '@/lib/builder/types';
import { getOnColor, resolvePalette } from '@/lib/builder/design-styles';
import { useBuilderStore } from '@/lib/builder/store';

interface SectionRendererProps {
  section: Section;
  designStyle: DesignStyle;
  /** Diisi saat render di situs live agar form booking bisa submit. Kosong = mode editor (submit nonaktif). */
  websiteId?: string;
}

export function SectionRenderer({ section, designStyle, websiteId }: SectionRendererProps) {
  // Palet efektif = bawaan style + override warna tema user.
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const palette = resolvePalette(designStyle, paletteOverride);
  const onPrimary = getOnColor(palette.primary);
  const tokens = {
    '--color-primary': palette.primary,
    '--color-secondary': palette.secondary,
    '--color-accent': palette.accent,
    '--color-background': palette.background,
    '--color-surface': palette.surface,
    '--color-text': palette.text,
    '--color-text-muted': palette.textMuted,
    '--color-border': palette.border,
    // Warna teks kontras otomatis di atas primary (ganti teks putih hardcoded
    // yang tenggelam di primary terang seperti retro #e07a5f).
    '--color-on-primary': onPrimary,
    '--font-heading': designStyle.typography.headingFont,
    '--font-body': designStyle.typography.bodyFont,
    '--radius': `${designStyle.components.borderRadius}px`,
  } as React.CSSProperties;

  const sectionStyle: React.CSSProperties = {
    ...tokens,
    padding: `${section.style.padding.top}px ${section.style.padding.right}px ${section.style.padding.bottom}px ${section.style.padding.left}px`,
    background: section.style.background === 'color' ? section.style.backgroundColor : undefined,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
  };

  const renderContent = () => {
    switch (section.type) {
      case 'booking':
        return <BookingSection section={section} websiteId={websiteId} />;
      case 'hero':
        return <HeroSection section={section} tokens={tokens} />;
      case 'features':
        return <FeaturesSection section={section} tokens={tokens} />;
      case 'product_grid':
        return <ProductGridSection section={section} tokens={tokens} />;
      case 'testimonials':
        return <TestimonialsSection section={section} tokens={tokens} />;
      case 'faq':
        return <FaqSection section={section} tokens={tokens} />;
      case 'cta':
        return <CtaSection section={section} tokens={tokens} />;
      case 'contact':
        return <ContactSection section={section} tokens={tokens} />;
      case 'about':
        return <AboutSection section={section} tokens={tokens} />;
      case 'gallery':
        return <GallerySection section={section} tokens={tokens} />;
      case 'video':
        return <VideoSection section={section} tokens={tokens} />;
      case 'team':
        return <TeamSection section={section} tokens={tokens} />;
      case 'pricing':
        return <PricingSection section={section} tokens={tokens} />;
      case 'newsletter':
        return <NewsletterSection section={section} tokens={tokens} />;
      case 'divider':
        return <DividerSection section={section} tokens={tokens} />;
      case 'marquee':
        return <MarqueeSection section={section} />;
      case 'menu_board':
        return <MenuBoardSection section={section} />;
      case 'steps':
        return <StepsSection section={section} />;
      case 'location':
        return <LocationSection section={section} />;
      default:
        return <div className="p-8 text-center text-muted-foreground">Section: {section.type}</div>;
    }
  };

  return (
    <div style={sectionStyle} className="transition-all">
      {renderContent()}
    </div>
  );
}

function HeroSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const align = (config.text_align as string) || 'center';

  return (
    <div className="py-16 px-6" style={{ textAlign: align as 'left' | 'center' | 'right' }}>
      <h1
        className="text-4xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.headline as string) || 'Selamat Datang'}
      </h1>
      <p className="text-lg mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {(config.subheadline as string) || 'Deskripsi singkat'}
      </p>
      {(config.cta_text as string) && (
        <a
          href={(config.cta_link as string) || '#'}
          className="inline-block px-8 py-3 rounded-md font-medium"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
        >
          {config.cta_text as string}
        </a>
      )}
    </div>
  );
}

function FeaturesSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ icon: string; title: string; description: string }>) || [];

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Fitur Kami'}
      </h2>
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg text-center"
            style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductGridSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const columns = (config.columns as number) || 4;

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Produk Kami'}
      </h2>
      <div
        className="pg-grid grid gap-4 max-w-6xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <div className="aspect-square bg-muted rounded mb-3" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; text: string; rating: number }>) || [];

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Testimonials'}
      </h2>
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <p className="mb-4" style={{ color: 'var(--color-text)' }}>&ldquo;{item.text}&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{item.name}</p>
                <div className="text-yellow-500 text-sm">{'★'.repeat(item.rating)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ question: string; answer: string }>) || [];

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'FAQ'}
      </h2>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.question}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  return (
    <div
      className="py-12 px-6 text-center"
      style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius)' }}
    >
      <h2
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-primary)' }}
      >
        {(config.title as string) || 'Siap Memulai?'}
      </h2>
      <p className="mb-6" style={{ color: 'var(--color-on-primary)', opacity: 0.85 }}>
        {(config.subtitle as string) || 'Hubungi kami sekarang'}
      </p>
      <a
        href={(config.button_link as string) || '#'}
        className="inline-block px-8 py-3 rounded-md font-medium"
        // Tombol dibalik: bg = on-primary, teks = primary → rasio selalu ≥4.5
        style={{ background: 'var(--color-on-primary)', color: 'var(--color-primary)', borderRadius: 'var(--radius)' }}
      >
        {config.button_text as string}
      </a>
    </div>
  );
}

function ContactSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Hubungi Kami'}
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
        {(config.subtitle as string) || 'Kirim pesan kepada kami'}
      </p>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nama"
          className="w-full px-4 py-2 border rounded-md"
          style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md"
          style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <textarea
          placeholder="Pesan"
          rows={4}
          className="w-full px-4 py-2 border rounded-md"
          style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <button
          className="w-full py-2 rounded-md font-medium"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
        >
          Kirim Pesan
        </button>
      </div>
    </div>
  );
}
export function BookingSection({
  section,
  websiteId,
}: {
  section: Section;
  websiteId?: string;
}) {
  const config = section.config;
  const services = (config.services as BookingService[]) || [];
  const split = section.variant === 'booking-split';
  const [form, setForm] = useState({ name: '', phone: '', service: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: websiteId,
          customer_name: form.name,
          customer_phone: form.phone,
          service_name: form.service,
          booking_date: form.date,
          booking_time: form.time,
          notes: form.notes,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Gagal mengirim booking');
        return;
      }
      setDone((config.success_message as string) || 'Terima kasih! Booking Anda diterima.');
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border rounded-md text-sm bg-white';
  const inputStyle = { borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' } as React.CSSProperties;

  const formEl = (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
        <input type="text" required placeholder="Nama lengkap" value={form.name} onChange={set('name')} className={inputCls} style={inputStyle} />
        <input type="tel" required placeholder="No. WhatsApp" value={form.phone} onChange={set('phone')} className={inputCls} style={inputStyle} />
      </div>
      <select required value={form.service} onChange={set('service')} className={inputCls} style={inputStyle}>
        <option value="">— Pilih layanan —</option>
        {services.map((s, i) => (
          <option key={i} value={s.name}>
            {s.name}{s.price ? ` • ${s.price}` : ''}{s.duration ? ` (${s.duration})` : ''}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" required value={form.date} onChange={set('date')} className={inputCls} style={inputStyle} />
        <input type="time" required value={form.time} onChange={set('time')} className={inputCls} style={inputStyle} />
      </div>
      <textarea placeholder="Catatan (opsional)" rows={3} value={form.notes} onChange={set('notes')} className={inputCls} style={inputStyle} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done ? (
        <p className="text-sm font-medium p-3 rounded-md" style={{ background: 'var(--color-surface)' }}>
          ✅ {done}
        </p>
      ) : (
        <button
          type="submit"
          disabled={loading || !websiteId}
          title={!websiteId ? 'Form aktif setelah website dipublish' : undefined}
          className="w-full py-3 rounded-md font-semibold disabled:opacity-60"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
        >
          {loading ? 'Mengirim…' : '📅 Booking Sekarang'}
        </button>
      )}
      {!websiteId && !done && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Pratinjau editor — form aktif di situs live setelah publish
        </p>
      )}
    </form>
  );

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        {(config.title as string) || 'Booking Layanan'}
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
        {(config.subtitle as string) || 'Pilih layanan dan jadwal Anda'}
      </p>
      {split ? (
        <div className="grid grid-cols-1 @md:grid-cols-5 gap-6 items-start">
          <div className="@md:col-span-3">{formEl}</div>
          <div className="@md:col-span-2 p-5 rounded-lg space-y-3 text-sm" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {(config.hours as string) && <p>🕘 <span className="font-semibold">Jam buka</span><br />{config.hours as string}</p>}
            {(config.address as string) && <p>📍 <span className="font-semibold">Lokasi</span><br />{config.address as string}</p>}
            {services.length > 0 && (
              <div>
                <p className="font-semibold mb-1">💈 Daftar layanan</p>
                <ul className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                  {services.map((s, i) => (
                    <li key={i}>• {s.name} — {s.price}{s.duration ? ` (${s.duration})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">{formEl}</div>
      )}
    </div>
  );
}

function AboutSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {  const config = section.config;

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-8 items-center">
        <div>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {(config.title as string) || 'Tentang Kami'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {(config.content as string) || 'Deskripsi tentang kami'}
          </p>
        </div>
        <div
          className="aspect-video bg-muted rounded-lg"
          style={{ borderRadius: 'var(--radius)' }}
        />
      </div>
    </div>
  );
}

function GallerySection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const images = (config.images as string[]) || [];

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Galeri'}
      </h2>
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {(images.length > 0 ? images : ['', '', '', '']).map((img, idx) => (
          <div
            key={idx}
            className="aspect-square bg-muted rounded-lg"
            style={{ borderRadius: 'var(--radius)' }}
          />
        ))}
      </div>
    </div>
  );
}

function VideoSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      {(config.title as string) && (
        <h2
          className="text-2xl font-bold text-center mb-8"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {config.title as string}
        </h2>
      )}
      <div
        className="aspect-video bg-muted rounded-lg flex items-center justify-center"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="text-4xl">▶</div>
      </div>
    </div>
  );
}

function TeamSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const members = (config.members as Array<{ name: string; role: string; image: string }>) || [];

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Tim Kami'}
      </h2>
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {members.map((member, idx) => (
          <div key={idx} className="text-center">
            <div
              className="w-20 h-20 rounded-full bg-muted mx-auto mb-3"
              style={{ borderRadius: '50%' }}
            />
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{member.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; price: string; features: string[] }>) || [];

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Harga'}
      </h2>
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg border text-center"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.name}</h3>
            <p className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{item.price}</p>
            <ul className="space-y-2 mb-6">
              {item.features.map((feature, fIdx) => (
                <li key={fIdx} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  ✓ {feature}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2 rounded-md font-medium"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
            >
              Pilih
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  return (
    <div
      className="py-12 px-6 text-center"
      style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
    >
      <h2
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {(config.title as string) || 'Newsletter'}
      </h2>
      <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {(config.subtitle as string) || 'Berlangganan untuk update terbaru'}
      </p>
      <div className="flex flex-col @sm:flex-row gap-2 max-w-md mx-auto">
        <input
          type="email"
          placeholder={(config.placeholder as string) || 'Email Anda'}
          className="flex-1 px-4 py-2 border rounded-md"
          style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <button
          className="px-6 py-2 rounded-md font-medium"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
        >
          {config.button_text as string}
        </button>
      </div>
    </div>
  );
}

function DividerSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  if (config.height) {
    return <div style={{ height: `${config.height}px` }} />;
  }

  return (
    <div className="py-4 px-6">
      <hr
        style={{
          borderStyle: (config.style as string) || 'solid',
          borderColor: (config.color as string) || '#e5e7eb',
        }}
      />
    </div>
  );
}

function MarqueeSection({ section }: { section: Section }) {
  const items = (section.config.items as string[]) || [];
  const list = items.length > 0 ? items : ['Promo spesial', 'Gratis konsultasi', 'Buka setiap hari'];
  const row = [...list, ...list];
  return (
    <div aria-hidden="true" className="bk-marquee" style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
      <div className="bk-marquee-track">
        {[0, 1].map((half) => (
          <div key={half} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {row.map((t, i) => (
              <span key={`${half}-${i}`}>
                <span className="bk-marquee-item">{t}</span>
                <span style={{ margin: '0 26px' }}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MenuBoardItem {
  name?: string;
  desc?: string;
  price?: string;
}

interface MenuBoardGroup {
  key?: string;
  label?: string;
  items?: MenuBoardItem[];
}

function MenuBoardSection({ section }: { section: Section }) {
  const c = section.config;
  const isTabs = section.variant !== 'menu-list';
  const groups = (Array.isArray(c.groups) ? c.groups : []) as MenuBoardGroup[];
  const flatItems = (Array.isArray(c.items) ? c.items : []) as MenuBoardItem[];
  const [active, setActive] = useState<string>(groups[0]?.key || 'menu');
  const current = isTabs ? (groups.find((g) => g.key === active) ?? groups[0]) : undefined;
  const list: MenuBoardItem[] = isTabs ? ((current?.items as MenuBoardItem[]) || []) : flatItems;

  return (
    <div className="py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {(c.title as string) || 'Daftar Harga'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>{c.subtitle as string}</p>
        )}
        {isTabs && groups.length > 0 && (
          <div role="tablist" aria-label="Kategori" className="flex gap-2 flex-wrap justify-center mb-6">
            {groups.map((g) => {
              const key = g.key || g.label || 'menu';
              const selected = key === active;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(key)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={
                    selected
                      ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                      : { background: 'var(--color-surface)', color: 'var(--color-text)' }
                  }
                >
                  {g.label || key}
                </button>
              );
            })}
          </div>
        )}
        <div aria-live="polite">
          {list.length === 0 && (
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              Belum ada item. Tambahkan lewat panel Section Config.
            </p>
          )}
          {list.map((it, i) => (
            <div key={`${active}-${i}`} className="py-3" style={{ borderBottom: '1px dashed var(--color-border)' }}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{it.name || `Item ${i + 1}`}</h3>
                <span className="flex-1" aria-hidden="true" />
                <span className="font-bold whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>{it.price || ''}</span>
              </div>
              {it.desc && <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{it.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepsSection({ section }: { section: Section }) {
  const c = section.config;
  const items = (Array.isArray(c.items) ? c.items : []) as Array<{ title?: string; description?: string }>;
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {(c.title as string) || 'Cara Pesan'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>{c.subtitle as string}</p>
        )}
        <div className="grid grid-cols-1 @md:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-lg" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
              <span
                className="inline-grid place-items-center w-12 h-12 rounded-full text-lg font-bold mb-3"
                style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              >
                {i + 1}
              </span>
              <h3 className="font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>{s.title || `Langkah ${i + 1}`}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{s.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationSection({ section }: { section: Section }) {
  const c = section.config;
  const hours = (Array.isArray(c.hours) ? c.hours : []) as Array<{ days?: string; time?: string }>;
  const buttonLink = (c.button_link as string) || '';
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {(c.title as string) || 'Kunjungi Kami'}
          </h2>
          {(c.address as string) && <p style={{ color: 'var(--color-text)' }}>📍 {c.address as string}</p>}
          {(c.note as string) && <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{c.note as string}</p>}
          {(c.button_text as string) && buttonLink && (
            <a
              href={buttonLink}
              target={buttonLink.startsWith('http') ? '_blank' : undefined}
              rel={buttonLink.startsWith('http') ? 'noopener' : undefined}
              className="inline-block mt-5 px-6 py-2.5 font-semibold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius)' }}
            >
              {c.button_text as string}
            </a>
          )}
        </div>
        {hours.length > 0 && (
          <ul className="rounded-lg p-5" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {hours.map((h, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 py-2.5 text-sm font-medium"
                style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <span>{h.days || `Hari ${i + 1}`}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{h.time || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
