# Spec Template Unik — Hapus Generik, Wajib Unik per Template

> **Status**: Tahap 2 SELESAI (2026-10-05) — paritas kanvas-vs-live
> (`buildThemeTokens` bersama), `customCss` sampai ke kanvas, foto diganti ke
> ID Pexels terverifikasi (19/19 HTTP 200), fallback-merge anti-konten-kosong,
> payload Tayangkan pakai chrome template, indikator "Belum ditayangkan".
> Penghapusan fisik sistem generik + rebuild `food.ts` menunggu migrasi data
> (§18.7).
> **Versi**: 1.2 — 2026-10-05.

---

## 1. Tujuan

1. Setiap template punya UI/UX **unik miliknya sendiri** — dilarang tampil sebagai
   "template lama yang hanya diganti warna + border-radius".
2. Menghapus sumber UI generik dari kode agar keunikan **dipaksa oleh arsitektur**,
   bukan sekadar imbauan di guide.
3. Semua template tetap **adaptif penuh** terhadap skema warna dan font bawaan:
   nol warna hardcoded, nol font hardcoded, di header + section + footer.

## 2. Ruang lingkup penghapusan

### 2.1 Template yang dihapus

| Artefak | Lokasi | Aksi |
|---|---|---|
| Template `laundry-fresh` | `src/lib/builder/templates/laundry.ts` | **Hapus file** + hapus dari `BUILT_IN_CATALOG` di `templates/catalog.ts` |
| Test khusus laundry | `templates/catalog.test.ts` (whitelist `hero-split-arch`, `pricing-spa-card`, `stats-band-oval`, `articles-grid`) | Hapus whitelist, ganti dengan guard unik (lihat §8) |
| Seed/demo laundry | Migrasi/seed yang merujuk `laundry-fresh` (bila ada) | Hapus atau arahkan ke template baru |

`food.ts` **tidak dihapus pada tahap ini**, tetapi wajib dibangun ulang mengikuti
kontrak unik yang sama pada tahap berikutnya (dilarang menambah varian generik baru).

### 2.2 Sistem UI generik yang dihapus (bertahap, karena ada data existing)

| Artefak | Lokasi | Ukuran | Aksi |
|---|---|---|---|
| `SECTION_REGISTRY` (~47 varian) | `src/lib/builder/sections/registry.ts` | 688 baris | Hapus file + `registry.test.ts` |
| `registrySections()` / `inferConfigFields()` | `src/lib/builder/templates/compose.ts` | 90 baris | Hapus file; template mendeklarasikan variannya sendiri |
| 15 subkomponen generik (`Hero/Features/Pricing/Testimonials/Gallery/Contact/About/Steps/Location/Faq/Cta/...`) | `src/components/builder/section-renderer.tsx` | ±1400 dari 1856 baris | Hapus semua branch generik; sisakan token + dispatch `variant.html` + `return null` |
| 7 layout header generik | `src/components/builder/site-header-shared.tsx` | ±400 dari 518 baris | Hapus; sisakan cabang `variant.html` |
| 7 layout footer generik | `src/components/builder/site-footer-shared.tsx` | ±380 dari 446 baris | Hapus; sisakan cabang `variant.html` |
| `HEADER_VARIANTS` / `FOOTER_VARIANTS`, `getHeaderVariant`, `getFooterVariant`, `isKnown*`, `DEFAULT_*` | `src/lib/builder/chrome.ts` | 155 baris | Hapus kecuali `resolveContentWidthClass` (utilitas, bukan UI) |
| Renderer legacy generik | `src/components/website/renderer.tsx` | audit dulu | Hapus bila tidak dipakai live site |
| Fallback diam-diam `variants[0]` / `'hero-full'` | `migration.ts:206,277`, `apply-template.ts:235`, `public.ts:267,308`, `app/preview/[templateId]/page.tsx:23`, `template-store.ts` | — | Ubah fail-closed (tak dikenal → null/throw + test merah) |
| Scaffold generik | `scripts/create-template.ts:151-351` | — | Tulis ulang jadi scaffold varian-unik kosong |
| Mockup/acuan generik | `mockup-preview.tsx`, `docs/template-reference-v3.json`, `PLANNING_TEMPLATE_MODULE.md:127` | — | Selaraskan ke kontrak unik |

Urutan hapus: **renderer fail-closed dulu → template baru jadi → registry generik dihapus
fisik → guide lama diganti**. Dilarang menghapus branch generik sebelum migrasi data
selesai (situs existing yang menyimpan `hero-full`/`features-3col`/… akan blank).

## 3. Kontrak template unik (normatif)

1. **Setiap varian wajib punya `html`.** Varian tanpa `html` ditolak test.
   Renderer tidak punya branch generik untuk jatuh kembali.
2. **ID namespaced per template.** Format `<template>-<nama-unik>`, contoh:
   `laundry-emerald:hero-arch`, `laundry-emerald:service-cards-luxe`. ID telanjang
   generik (`hero-full`, `features-3col`, `pricing-3tier`, `testimonials-grid`,
   `gallery-grid`, `contact-form`, `faq-accordion`, `steps-3col`, `location-hours`)
   **ditolak test**.
3. **Header/footer wajib `html` kustom dan unik.** Jumlah varian mengikuti
   `template-schema.ts` (`MIN_HEADER_VARIANTS_V3 = 5`, `MIN_FOOTER_VARIANTS_V3 = 5`),
   tetapi kelimanya harus komposisi unik — dilarang reuse `standard`/`floating`/
   `columns`/`centered` generik. UX boleh sama (navigasi, CTA, copyright),
   gaya visual harus beda.
4. **Kreativitas minimal.** Setiap varian harus berbeda markup-nya dari varian lain
   dalam tipe yang sama **dan** dari template lain: minimal 3 pembeda
   (bentuk/komposisi/dekorasi/ornamen). Uji similaritas fingerprint HTML
   (setelah strip warna, font, dan teks) harus di bawah ambang.
5. **Referensi desain wajib diterjemahkan, bukan ditempel.** Diberi gambar/foto
   referensi → ekstrak palet, tipografi, komposisi per section, ornamen — lalu
   bangun `html` baru. Dilarang mengambil varian template lain lalu hanya
   mengganti warna.

## 4. Kontrak adaptif — nol hardcoded (normatif)

### 4.1 Warna: hanya token

| Pakai | Dilarang |
|---|---|
| `var(--color-primary/secondary/accent/background/surface/text/textMuted/border)` | hex (`#fff`, `#0E7C66`, …), `rgb()/rgba()/hsl()` |
| `var(--color-on-primary)` untuk teks di atas primary | `#fff` / `white` untuk teks terang |
| Tombol di atas latar TERANG: `background: var(--color-primary)` + `color: var(--color-on-primary)`; di atas latar GELAP/primary: `background: var(--color-accent)` + `color: var(--color-primary)` | `var(--color-primary)` langsung sebagai background tombol di semua konteks |
| `var(--color-primary)` untuk aksen sebagai teks di atas latar terang (mis. harga) | warna teks fixed |
| `theme:<token>` untuk `style.backgroundColor` per-section | hex di `defaultStyle`/`data.sections[].style` |

Token disediakan `buildThemeTokens()` — sumber tunggal kanvas + live site.
Catatan: `--color-button` / `--color-on-button` / `--color-on-section` /
`--color-primary-on-section` HANYA ada di `SectionRenderer` generik (dihapus)
dan tidak tersedia di jalur `variant.html` — jangan dipakai di `html`
template (ditolak guard parity). Ornamen/dekorasi (lengkung emas, daun, divider)
wajib `currentColor` atau `var(--color-*)`.

### 4.2 Font: hanya token

- `var(--font-heading)` untuk headline, `var(--font-body)` untuk body,
  `var(--font-accent)` untuk eyebrow script/aksen. Dilarang `font-family:` literal
  dalam bentuk apa pun (termasuk `'Cormorant Garamond'`, `'Plus Jakarta Sans'`).
- `accentFont` adalah token ketiga resmi: `DesignStyleTypography.accentFont?` →
  plumbing `--font-accent` di `section-renderer.tsx`, `renderer-v3.tsx`,
  `builder-canvas.tsx`, loader `GoogleFonts`/`getGoogleFontsUrl`, persist
  `public.ts` + `store.ts`. Nilai default fallback = `headingFont`.
  Ketiga font wajib terdaftar di `FONT_CATEGORIES` (`font-categories.ts`).

### 4.3 Responsif (diwarisi §15 guide lama, tetap berlaku)

Satu kolom default (mobile-first 375px) → multi-kolom via breakpoint naik;
dilarang lebar fixed > 480px; gambar `max-width:100%;height:auto`; tanpa scroll
horizontal di 375px; target sentuh ≥ 44px; body ≥ 14px. `variant.html` membawa
wadahnya sendiri (isi di-box `6xl`, rata tengah).

## 5. Workflow referensi → template (normatif)

Saat diberi gambar/foto desain web:

1. **Ekstrak palet → petakan ke 8 token** (`primary/secondary/accent/background/
   surface/text/textMuted/border`). Contoh Emerald: hijau tua pekat → `primary`,
   emas muted → `accent`, krem → `background/surface`. Jangan bawa hex referensi
   mentah ke `html` — hanya token.
2. **Ekstrak tipografi → petakan ke 3 font builtin.** Serif display →
   `headingFont` (mis. `Playfair Display`), sans → `bodyFont` (mis. `Manrope`),
   script/italic emas → `accentFont` (mis. `Great Vibes`). Ketiganya dari
   `FONT_CATEGORIES`.
3. **Bedah komposisi per section.** Untuk tiap blok referensi catat: susunan
   (split/band/grid), bentuk khas (arch, oval, lingkaran, inset `rounded-2xl`),
   dekorasi (lengkung, daun line-art, divider, badge, dots), hierarki tombol.
4. **Bangun `html` baru per section** dengan komposisi + dekorasi tersebut,
   memakai token §4. Ornamen sebagai inline SVG/div bertoken (karena `<style>`
   diblokir sanitizer, responsif via inline style + kelas breakpoint).
5. **Header/footer unik.** Navigasi + CTA boleh meniru UX referensi, tetapi susunan
   visual, bentuk bar, dan dekorasi harus karya baru (lihat §3.3).
6. **Isi tetap niche template.** Struktur UX boleh meniru referensi, copywriting +
   gambar tetap milik niche (contoh: template laundry memakai layanan kiloan/
   express/antar-jemput + foto laundry premium, bukan foto spa).

## 6. Struktur template baru (gambaran)

```
src/lib/builder/templates/
├── laundry-emerald/      # template pengganti
│   ├── index.ts
│   ├── shared.ts
│   ├── chrome.ts
│   ├── sections.ts
│   ├── schemes.ts
│   └── data.ts
├── food/                 # dibangun ulang menyusul, kontrak sama
│   ├── index.ts
│   ├── chrome.ts
│   ├── schemes.ts
│   └── data.ts
├── marketplace-hybrid/
│   ├── index.ts
│   ├── shared.ts
│   ├── chrome.ts
│   ├── sections.ts
│   ├── schemes.ts
│   └── data.ts
├── catalog.ts              # BUILT_IN_CATALOG tanpa laundry-fresh
├── catalog.generated.ts    # AUTO-GENERATED — jangan edit manual
└── catalog.test.ts         # guard unik (pengganti whitelist lama)
```

Setiap folder template mendeklarasikan **sendiri**: `theme` (palet + 3 font),
`headers` (≥5, semua `html`), `footers` (≥5, semua `html`), `sections`
(tipe + varian, semua `html`), `data` (seed `sections/header/footer/seo`,
`activeSections`, `paletteOverride`). Tidak ada impor dari `sections/registry`
atau `templates/compose` — kedua modul itu dihapus.

Registrasi otomatis via `scripts/gen-template-catalog.mjs` yang memindai
folder ber-`index.ts` dan menghasilkan `catalog.generated.ts`. Hook npm
(`predev`, `prebuild`, `pretest`) menjalankannya otomatis.

Renderer setelah hapus generik:

```
section-renderer.tsx   → token + <VariantHtmlRenderer html={variant.html}> + null
site-header-shared.tsx → <VariantHtmlRenderer html={variant.html}> + null
site-footer-shared.tsx → <VariantHtmlRenderer html={variant.html}> + null
```

## 7. Guard otomatis (menggantikan guard generik lama)

| Guard | Menolak | Menggantikan |
|---|---|---|
| `no-hardcoded-template-style` | regex `#[0-9a-fA-F]{3,8}`, `rgba?\(`, `hsla?\(`, `:\s*white\b`, `:\s*black\b`, `font-family:` yang nilainya bukan `var(--font-*)` di semua `html`/`customCss` template | klaim "tanpa hardcoded" yang tak dites |
| `unique-variant-id` | ID telanjang generik (`hero-full`, `features-3col`, …) | whitelist `RENDERED_VARIANTS` |
| `template-uniqueness` | fingerprint HTML mirip antar template/varian (strip warna+font+teks) | cek "varian markup berbeda" yang longgar |
| `no-generic-import` | impor `sections/registry` atau `templates/compose` | — (baru, via lint/grep test) |
| `variant-html-required` | varian/header/footer tanpa `html` | kontrak "3 varian per tipe" generik |
| `accentFont-registered` | `accentFont` tak ada di `FONT_CATEGORIES` | — (baru) |

`catalog.test.ts` yang sekarang (kontrak 8 section inti, seed resolve tanpa
fallback, `{year}`, tier, palet+font, `maxNavDepth` seragam) **dipertahankan**;
yang dihapus hanya bagian yang mengunci ke varian generik.

## 8. Migrasi data (syarat sebelum hapus fisik generik)

1. Audit DB: daftar `store_pages.layout` + `custom_config` yang memakai varian
   generik (`hero-full`, `features-3col`, …) dan chrome generik
   (`standard`, `columns`, …).
2. Skrip migrasi: petakan tiap varian generik → varian unik padanan di template
   aktif situs tersebut; situs tanpa padanan ditandai read-only + pemberitahuan.
3. Kriteria hapus fisik: nol situs merujuk ID generik + semua guard §7 hijau +
   uji tiga viewport (375/768/1024) × tiga skema (terang/gelap/aksen) × tiga font.

## 9. Definisi selesai (tahap dokumentasi ini)

- [x] Inventarisasi generik (§2.2) terverifikasi terhadap file di repo.
- [ ] Dokumen ini disetujui user (nama final template pengganti + palet/font awal).
- [ ] Implementasi **belum** dimulai: tidak ada file kode yang dihapus/diubah
      pada tahap ini.

> Persetujuan yang dibutuhkan untuk lanjut ke implementasi: (1) nama/id final
> template pengganti `laundry-fresh`; (2) palet + 3 font awal; (3) apakah `food.ts`
> ikut dibangun ulang pada gelombang yang sama atau menyusul.
