# Panduan Membuat Template — untuk AI Eksternal (v3.4)

> ⚠️ **DEPRECATED — alur ZIP/import tidak berlaku lagi.**
> Template kini hanya kode statis di `src/lib/builder/templates/`
> (lihat `food.ts` sebagai contoh + `docs/TEMPLATE_GUIDE.md §9`).
> AI eksternal cukup menghasilkan konten setara `template.json`
> (skema §4 tetap valid sebagai draf) — authoring ke `.ts` dilakukan
> maintainer via PR. Isi dokumen ini dipertahankan sebagai arsip skema.

> **Untuk siapa**: AI di luar repository (Claude, GPT, dll.) yang merancang template website UMKM.
> **Output tunggal**: satu file `.zip` yang di-import user lewat **Customize → Templates → Import**.
> **Versi**: 3.6 · **Terakhir diperbarui**: 2026-10-03
>
> v3.6 menyelaraskan dokumen dengan sistem yang berjalan: tabel jujur FAIL vs
> warning saat import (§2.7), paket tier kumulatif + siapa mengisinya (§1c),
> `animations/meta.json` benar-benar dibaca, thumbnail jadi anjuran kuat
> (bukan syarat mati), format ZIP hasil Export yang round-trip (§8.6),
> dan pembersihan referensi mati (§10).
>
> v3.0 mengubah aturan besi v2.0: **HTML kini BOLEH** (section-level + field-level),
> ditambah `activeSections`, dan penegasan "tidak ada konten hardcoded".
> v3.1 menambahkan: **spek mobile-first penuh** (§5.8) — template wajib mobile-friendly.
> v3.2 menambahkan: **aturan keras varian kustom** (§5.4) — ID di luar Tabel 2 wajib
> punya `variant.html` atau disasar `customCss`, dipicu kasus nyata `hero-katering-*`.
> v3.3 menambahkan: **lebar konten boxed** (§5.9) — isi section dibatasi
> `4xl`/`5xl`/`6xl` dan rata tengah, `full` hanya untuk lapisan latar.
> v3.4 menambahkan: **tipe section kustom diizinkan** (§5.10) — AI boleh membuat
> tipe baru di luar 19 predefined, dengan syarat tiap variannya punya `html`.
> v3.5 menambahkan: **chrome milik template (header/footer)** (§5.11) — header/footer
> wajib punya varian milik template dengan `html`, tidak boleh pakai bawaan builder.

---

## 0. Yang harus dipahami sejak awal

Kamu **tidak** mengenal codebase ini dan **tidak** boleh mengubah kode apa pun. Yang kamu lakukan:

1. Merancang identitas visual (palet, tipografi, tata letak, tone).
2. Menyusun seluruh konfigurasi template sesuai skema di bawah.
3. Membuat aset (gambar/foto) bila ada.
4. Mengembalikan **satu file `.zip`** sebagai hasil akhir.

Page builder tugasnya **merender template dan menyesuaikan form konfigurasinya di sidebar**.
Setiap varian yang kamu definisikan membawa `configFields`-nya sendiri — ketika user pilih
varian, form di sidebar otomatis berubah mengikuti `configFields` varian itu.

> ### Aturan besi v3.5
> 1. **Satu file ZIP saja** sebagai output. Tidak ada file lain, tidak ada patch kode.
> 2. **HTML BOLEH** — dua jalur (§3): `variant.html` (section-level) dan field
>    bertipe `html` (field-level). Ini cara template berekspresi bebas.
> 3. **18 tipe Tabel 2 WAJIB didefinisikan semua** (§5) — plus kamu BOLEH
>    menambah tipe section kustom sendiri (§5.10), dengan syarat tiap variannya
>    punya `html` (tanpa html, tipe asing tidak bisa tampil).
> 4. **`activeSections`** menentukan section mana yang AKTIF untuk niche ini (§5.5).
> 5. **Tidak ada konten hardcoded** (§6): tiap teks/gambar/video/icon/list/background
>    wajib punya `configFields` dengan tipe field yang sesuai.
> 6. **Minimal varian**: ≥5 header, ≥5 footer, ≥3 untuk tiap tipe section (§5.6).
>    Pengecualian: `marquee` (renderer single-DOM) boleh 1 varian.
> 7. **Thumbnail + preview** disarankan kuat (§8): `thumbnail.png` di root + `data` lengkap
>    agar preview/demo identik dengan hasil apply. Tanpa thumbnail import tetap
>    sukses, tapi kartu galeri kosong.
> 8. Animasi **lewat kontrak deklaratif** `animations[]` (§7.1) atau file
>    `animations/meta.json` (§2) — keduanya dibaca dan digabung (inline dulu);
>    JS hanya untuk kasus yang tidak tertutup kontrak itu (§7.2).
> 9. **Palet + font harus bisa diganti** (§4.3): jangan kunci desain ke satu warna
>     atau satu font — user bisa pilih predefined color scheme & font di builder.
> 10. **Mobile-first penuh** (§5.8): template dirancang dari layar HP (375px) ke
>     atas — fluid, tanpa scroll horizontal, CTA terjangkau, nav jadi hamburger.
> 11. **Setiap aset harus dipakai** (§2.6): tiap file di `assets/` wajib dirujuk
>     ≥1 kali oleh config (`assets/nama-file`), dan tiap field gambar di seed
>     wajib terisi (path `assets/…` atau URL eksplisit) — field kosong tampil
>     kosong di preview dan diisi foto generik di kanvas.
> 12. **Tipe kustom diizinkan** (§5.10): id kebab-case tak menabrak 18 bawaan,
>     ≥1 varian, tiap varian wajib `html` + `configFields` + `defaultConfig`.
> 13. **Header & Footer milik template** (§5.11): chrome custom wajib punya `html`,
>     layout kustom tanpa html = error, layout bawaan tanpa html = warning.
> 14. **Paket tier kumulatif** (§1c): `free` < `starter` < `growth` < `enterprise`.
>     Paket atas bisa memakai semua template paket bawahnya. Tier diisi admin
>     saat publish (form import) — bukan dari file ZIP.
> 15. Item nav tanpa flag `enabled` dianggap aktif. Tetap tulis `"enabled": true`
>     eksplisit agar jelas.

---

## 1. System Prompt (siap salin)

```
Kamu adalah desainer template website untuk platform builder UMKM Indonesia.

TUGASMU: merancang satu template untuk niche bisnis yang diberikan, lalu
menghasilkan SATU file .zip yang bisa di-import langsung ke builder.

ATURAN WAJIB:
1. Output hanya satu file .zip. Jangan menulis atau mengubah kode aplikasi.
2. Definisikan SEMUA 18 tipe section (Tabel 2), masing-masing ≥3 varian
   (kecuali marquee yang boleh 1 varian). Kamu BOLEH menambah tipe
   section kustom (§5.10): id kebab-case baru, ≥1 varian, tiap varian wajib html.
3. Tentukan activeSections: section yang AKTIF untuk niche ini (boleh memuat
   tipe kustom milikmu, asal terdefinisi di katalog).
4. Setiap varian (header/footer/section) wajib punya configFields + defaultConfig
   yang lengkap — tidak ada konten hardcoded tanpa form field.
5. Minimal 5 varian header dan 5 varian footer.
6. HTML kustom BOLEH: variant.html (section-level) dan field type 'html'
   (field-level). Placeholder {{key}} = teks aman, {{{key}}} = HTML disanitasi.
   Setiap ID varian KUSTOM wajib punya variant.html ATAU disasar customCss (§5.4).
7. anchorId tiap section harus unik (kebab-case), dan URL nav ditulis
   "#anchorId" yang sama.
8. Teks di atas latar wajib kontras >= 4.5:1.
9. Animasi memakai kontrak animations[] (deklaratif); script JS hanya untuk
   kasus yang tidak tertutup kontrak tersebut, dibungkus IIFE.
10. Palet memakai 8 kunci standar agar predefined color scheme builder bisa
    menggantikannya. Font memakai nama Google Fonts agar bisa diganti.
11. Sertakan thumbnail.png (800x600) di root ZIP.
12. Mobile-first (§5.8): desain dari 375px ke atas, fluid tanpa scroll
    horizontal, target sentuh ≥44px, body ≥14px, nav mobile = hamburger/drawer.
13. Setiap file di assets/ wajib dirujuk config; setiap field gambar di seed
    wajib terisi (§2.6).

SEBELUM MENGEMBALIKAN ZIP, jalankan checklist di §9.
```

---

## 2. Anatomi ZIP

```
nama-template.zip
├── template.json        # WAJIB. Root. Konfigurasi utama (lihat §4)
├── thumbnail.png        # WAJIB. Root. Kartu galeri + preview (800×600, < 1MB)
├── assets/              # opsional. Aset gambar
│   ├── logo.png
│   ├── hero.jpg
│   └── gallery-01.jpg
├── behaviours/          # opsional. Script tambahan (satu JSON per behaviour)
│   └── scroll-progress.json
└── animations/          # opsional. meta.json berisi animations[]
    └── meta.json
```

### 2.1 Nama file itu literal

| Path | Wajib? | Aturan |
|---|---|---|
| `template.json` | **Ya** | Persis di root. Tanpa ini import ditolak. |
| `thumbnail.png` / `.jpg` / `.jpeg` / `.webp` | **Ya** | Persis di **root**, bukan di dalam `assets/`. |
| `assets/*` | Tidak | Semua file langsung di dalam `assets/`. |
| `behaviours/*.json` | Tidak | Semua file langsung di dalam `behaviours/`. |
| `animations/meta.json` | Tidak | Array animations. |

File `meta.json` di folder mana pun otomatis dilewati saat import folder itu
(dipakai hasil export sistem sebagai fallback).

### 2.2 Batas keras

| Batas | Nilai |
|---|---|
| Ukuran ZIP | ≤ 25 MB |
| Total setelah diekstrak | ≤ 100 MB |
| Jumlah entri | ≤ 200 |
| `template.json` | ≤ 5 MB |
| Jumlah aset | ≤ 50 |
| Ukuran 1 aset | ≤ 10 MB |
| Jumlah behaviour | ≤ 50 |
| `variant.html` per varian | ≤ 50.000 karakter |
| `customCss` | ≤ 200.000 karakter |

### 2.3 Ekstensi aset yang diizinkan

```
jpg  jpeg  png  gif  webp  svg  ico  avif  js  css
```

Ekstensi lain → **seluruh import gagal** dengan pesan `Tipe file tidak diizinkan`.

### 2.4 Cara membuat ZIP

```bash
# Jalankan dari dalam folder yang berisi template.json, assets/, behaviours/
zip -r template-nama.zip template.json assets behaviours thumbnail.png
```

Jangan-zip dengan folder pembungkus (mis. `nama-template/template.json`) —
import hanya mencari `template.json` di root.

### 2.5 Path aset otomatis diganti URL

Bila `template.json` memuat string `assets/hero.jpg`, sistem mengunggah file itu
ke storage lalu **mengganti semua kemunculan string tersebut** dengan URL final —
di `theme`, `sections`, `headers`, `footers`, dan `variant.html`. Jadi cukup tulis
path relatif; jangan menulis URL CDN sendiri.

### 2.6 Setiap aset harus dipakai (wajib)

Upload tanpa referensi = gambar mati. Aturannya:

1. **Tiap field gambar di seed wajib terisi.** `image`, `logoUrl`,
   `backgroundImage`, `images`/`gallery`, `avatar` — isi dengan `assets/…`
   atau URL `https://…` eksplisit. JANGAN kosongkan (`""`) dengan harapan
   "nanti diisi builder": field kosong tampil kosong di preview dan diisi foto
   generik (bukan desainmu) di kanvas.
2. **Tiap file di `assets/` wajib dirujuk ≥1 kali.** File yang tidak dirujuk
   config manapun memicu warning saat import (import tetap sukses).
3. Nama file di JSON harus **persis sama** dengan nama file di ZIP
   (termasuk ekstensi dan huruf besar-kecil): `assets/Hero.jpg` ≠
   `assets/hero.jpg` — yang kedua tidak terganti dan tampil rusak.
4. Cek silang sebelum zip: untuk setiap file di `assets/`, `grep` namanya di
   `template.json` — harus ada ≥1 kemunculan.
5. **Isi file harus foto asli, bukan placeholder.**
   Kamu (AI) **tidak bisa menghasilkan foto JPG/PNG asli** — yang kamu tulis
   hanyalah teks/SVG. Maka untuk foto (hero, galeri, tim, menu):
   - **Opsi A (disarankan):** pakai URL foto asli langsung di config, mis.
     `https://images.unsplash.com/photo-…?auto=format&fit=crop&w=1600&q=80`
     — tanpa mengupload file apapun untuk foto tersebut.
   - **Opsi B:** beri nama jujur berekstensi `.svg` (mis. `assets/hero.svg`)
     bila memang hanya placeholder vektor, dan biarkan user mengganti dengan
     foto asli lewat builder.
   - **DILARANG:** menyimpan teks/SVG lalu menamainya `.jpg`/`.png`
     (mis. file 1 KB berisi `<svg…` bernama `hero-catering.jpg`). Sistem
     mendeteksi ini saat import dan memberi warning, dan gambarnya **tampil
     rusak** di preview & canvas karena browser menolak SVG berlabel JPEG.
6. **Jaring pengaman (bukan pengganti aturan di atas):** saat import, field
   gambar kosong diisi otomatis dari file yang cocok konvensi nama
   (`logo*` → `logoUrl`, `hero*/banner*` → `image`, `gallery-*`/`foto*` →
   `images`, `avatar*/team*/chef*` → `avatar`). Hasil pengisian dilaporkan
   di dialog import. Jangan mengandalkan ini — rujukan eksplisit tetap wajib
   karena tebakan nama bisa salah (mis. `hero.svg` generik vs foto hero
   sesungguhnya).

### 2.7 Yang menggagalkan vs peringatan (kontrak jujur)

Tidak semua "wajib" di dokumen ini menggagalkan import. Yang berlaku di sistem:

**MENGGAGALKAN import (error, ZIP ditolak):**

| Kondisi | Pesan |
|---|---|
| ZIP rusak / bukan ZIP / tanpa `template.json` | File ZIP rusak / template.json tidak ditemukan |
| `template.json` bukan JSON valid / bukan objek / >5 MB | JSON tidak valid / terlalu besar |
| Tanpa `theme` (dan bukan format legacy) | Format template tidak valid |
| Layout chrome **kustom** tanpa `html` | Renderer tidak punya branch … |
| Melebihi batas (§2.2): 25MB / 100MB / 200 entri / 50 aset / 10MB per aset | Batas terlampaui |
| Path tak aman (`..`, absolut) / ekstensi dilarang | Path tidak aman / tipe file tidak diizinkan |
| Nama template duplikat (per user / per katalog public) | Nama sudah digunakan |
| `category` form admin di luar 5 kanonis / tier di luar 4 paket | Invalid category / tier |

**PERINGATAN (import tetap sukses, tampil di dialog):** semua hasil
`validateTemplateV3` — nama/category/designType bermasalah, jumlah varian di
bawah minimum, `activeSections` tak dikenal (dibuang diam-diam), `configFields`
tak lengkap, coverage aset (file tak dirujuk / field kosong), auto-map,
thumbnail bermasalah, pola CSS/HTML berisiko. Juga: `category`/`designType`
tak dikenal diabaikan diam-diam; `customCss` >200.000 karakter **dipotong
diam-diam** (bukan ditolak).

Aturan praktis: ikuti seluruh checklist §9 — lolos import bukan berarti lolos
kualitas. Template yang penuh warning tampil rusak/kosong di preview walau
statusnya "berhasil".

---

## 3. Ekspresi HTML (baru di v3.0)

Template **boleh berekspresi dengan HTML** agar desain kreatif tidak terbatas
layout bawaan renderer. Dua jalur:

### 3.1 Section-level: `variant.html`

Setiap varian header/footer/section boleh punya kunci `html`:

```jsonc
{
  "id": "hero-panggung",
  "name": "Panggung",
  "layout": "hero-full",
  "mockup": "hero-full",
  "html": "<section data-tpl-type=\"hero\" data-tpl-variant=\"hero-panggung\" class=\"panggung\">\n  <h1>{{headline}}</h1>\n  <p>{{subheadline}}</p>\n  <a href=\"{{cta_link}}\">{{cta_text}}</a>\n</section>",
  "configFields": [
    { "key": "headline", "label": "Judul", "type": "text" },
    { "key": "subheadline", "label": "Sub Judul", "type": "textarea" },
    { "key": "cta_text", "label": "Teks Tombol", "type": "text" },
    { "key": "cta_link", "label": "Link Tombol", "type": "text" }
  ],
  "defaultConfig": {
    "headline": "Judul default",
    "subheadline": "Sub judul default",
    "cta_text": "Lihat Menu",
    "cta_link": "#menu"
  }
}
```

Aturan `variant.html`:

- Placeholder `{{key}}` diganti `config[key]` (di-escape otomatis — aman).
- Placeholder `{{{key}}}` diganti `config[key]` mentah tapi **disanitasi dulu**
  (untuk field bertipe `html`).
- Variabel tema tersedia sebagai CSS vars di `customCss`: `--color-primary`,
  `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`,
  `--color-text`, `--color-text-muted`, `--color-border`, `--color-on-primary`,
  `--radius`, `--font-heading`, `--font-body`.
- Pembungkus hasil render selalu membawa `data-tpl-type` + `data-tpl-variant`
  agar `customCss`-mu tetap bisa menyasarnya.
- **List link otomatis diekspan**: bila `config[key]` berupa array objek
  `{label, url, ...}` (mis. `navItems`), `{{key}}` dirender jadi deretan
  `<a href="url">label</a>` — item `enabled: false` dilewati, item tanpa
  `enabled` dianggap aktif, `isExternal: true` membuka tab baru, protokol
  selain `#…`, `/…`, `http(s)`, `mailto:`, `tel:` dibuang. Jadi
  `<nav>{{navItems}}</nav>` langsung jadi navigasi tanpaHTML manual per item.
- **Dilarang di dalam `html`**: `<script>`, `<style>`, `<iframe>`, `<object>`,
  `<embed>`, `<form>`, atribut `on*=` (mis. `onclick=`), dan `javascript:`.
  Semua diganti `<!-- BLOCKED` saat import & render. Butuh JS → pakai
  `behaviours[]` (§7.2). Butuh CSS → pakai `customCss` (§8.4).
- **Wajib responsif** (§5.8): `variant.html` dirancang mobile-first — dilarang
  `width` fixed di atas 480px (mis. `width:1200px`, `min-width:900px`);
  pakai layout fluid (`max-width:100%`, grid 1 kolom → multi-kolom via
  `@md:` mengikuti pola renderer) dan gambar `max-width:100%;height:auto`.

### 3.2 Field-level: tipe field `html`

`ConfigField` kini mengenal tipe `html` — textarea khusus untuk konten kaya
(mis. deskripsi dengan `<strong>/<em>/<a>`, list kustom):

```jsonc
{ "key": "konten_kaya", "label": "Konten Kaya", "type": "html", "rows": 5 }
```

Nilai field `html` disanitasi dengan aturan yang sama seperti §3.1, lalu bisa
ditampilkan lewat `{{{konten_kaya}}}` di `variant.html`, atau dibaca komponen
section bawaan yang mendukungnya.

### 3.3 Kapan pakai yang mana

| Kebutuhan | Jalur |
|---|---|
| Layout section benar-benar baru (tidak muat di varian bawaan) | `variant.html` |
| Teks dengan formatting di dalam section bawaan | field `html` + `{{{key}}}` |
| Gaya visual (border, shadow, blur, grid, clip) | `customCss` (§8.4) |
| Gerakan / interaksi | `animations[]` + `behaviours[]` (§7) |

---

## 4. Kamus `template.json`

```jsonc
{
  "version": "3.0",                  // metadata, tidak divalidasi (boleh diisi)
  "name": "Bengkel Jaya Motor",      // nama tampilan; NAMA GALERI diambil dari form import bila kosong di file
  "description": "…",                // maksimal 2000 karakter (dipotong bila lebih)
  "category": "services",            // Tabel 1 — 5 nilai kanonis; di luar itu ditolak saat validasi ketat, diabaikan diam-diam saat import
  "designType": "tech",              // Tabel 1b — divalidasi bila diisi, boleh kosong
  "theme":    { … },                 // §4.1 — WAJIB (salah satu dari sedikit syarat mati, lihat §2.7)
  "headers":  [ … ],                 // §4.4 — WAJIB ≥5 varian
  "footers":  [ … ],                 // §4.4 — WAJIB ≥5 varian
  "sections": [ … ],                 // §5 — WAJIB semua 19 tipe
  "activeSections": [ … ],           // §5.5 — subset yang aktif untuk niche ini
  "data":     { … },                 // §4.2 — dipakai saat template diterapkan
  "animations":  [ … ],              // §7.1 — opsional
  "behaviours":  [ … ]               // §7.2 — opsional
}
```

> **Penting.** `sections` di root = **katalog** (semua 19 tipe + variannya,
> dipakai sidebar + preview). Blok `data.sections` = **seed** (hanya section
> aktif + kontennya, dipakai saat template diterapkan). Keduanya menunjuk seed
> yang sama — isi keduanya supaya preview dan hasil apply identik.

### 4.1 `theme`

```jsonc
"theme": {
  "palette": {
    "primary":     "#c2410c",
    "secondary":   "#1e293b",
    "accent":      "#f59e0b",
    "background":  "#f8fafc",
    "surface":     "#ffffff",
    "text":        "#0f172a",
    "textMuted":   "#475569",
    "border":      "#cbd5e1"
  },
  "typography": {
    "headingFont": "Barlow",      // WAJIB nama Google Fonts
    "bodyFont":    "Inter",       // WAJIB nama Google Fonts
    "baseSize":    16,
    "scaleRatio":  1.25,
    "headingWeight": 700,
    "bodyWeight":    400
  },
  "components": {
    "borderRadius": 8,            // 0 = tajam, 24 = sangat bulat
    "buttonStyle": "solid",       // solid | outline | ghost | gradient
    "shadowStyle": "md",          // none | sm | md | lg | xl
    "navStyle":    "solid",       // solid | transparent | glass | bordered
    "footerStyle": "columns"      // simple | columns | centered | minimal
  },
  "effects": {
    "borderWidth": 1,
    "uppercaseHeadings": false
  }
}
```

**Kontras (WAJIB, diperiksa otomatis)**

```
text      vs background   >= 4.5:1
textMuted vs background   >= 4.5:1
text      vs surface      >= 4.5:1
textMuted vs surface      >= 4.5:1
teks tombol vs primary    >= 4.5:1
```

**Cara aman memilih teks redup**: pakai abu-abu 500–700, bukan 300–400.

### 4.2 `data` — dipakai saat template diterapkan

```jsonc
"data": {
  "designStyleId":   "dark-mode",  // Tabel 4 (10 style bawaan)
  "paletteOverride": { …8 warna… }, // WAJIB: palet yang kamu rancang
  "customCss":       "…",           // §8.4 — CSS bebas, kunci pembeda utama
   "activeSections":  ["hero","features","pricing","testimonials","gallery","location","faq","contact"],
  "sections":        [ … ],          // seed HANYA section aktif + konten lengkap
  "header": {
    "variant":   "bk-hdr-workshop", // id varian header milikmu (bukan layout global)
    "logoUrl":   "assets/logo.png",
    "siteTitle": "Bengkel Jaya Motor",
    "tagline":   "Servis Motor & Mobil",
    "navItems": [
      { "id": "n1", "label": "Layanan", "url": "#layanan",
        "isExternal": false, "enabled": true }
    ],
    "ctaText":      "Chat WhatsApp",
    "ctaLink":      "https://wa.me/6281234567890",
    "showCta":      true,
    "sticky":       true,
    "contentWidth": "6xl"
  },
  "footer": {
    "style": "columns",
    "text":  "© {year} Bengkel Jaya Motor.",   // WAJIB memuat "{year}"
    "navItems":   [ … ],
    "showSocial": true,
    "phone": "0812…", "email": "…", "whatsapp": "628…"
  },
  "seo": {
    "title":       "Bengkel Jaya Motor — Servis Motor Jakarta Timur",
    "description": "minimal 50 karakter, ideal 120–160"
  },
  "core": {
    "site_title": "…", "tagline": "…",
    "header_nav": [ … ], "footer_nav": [ … ],
    "footer_text": "© {year} …"
  }
}
```

### 4.3 Palet & font harus bisa diganti builder

Template membawa desainnya sendiri, TAPI:

- Palet memakai **tepat 8 kunci standar** (`primary`, `secondary`, `accent`,
  `background`, `surface`, `text`, `textMuted`, `border`) agar predefined color
  scheme builder bisa menggantikannya satu-per-satu. Jangan menambah kunci
  sendiri; jangan mengunci warna di dalam `variant.html` atau `customCss`
  dengan hex mentah — pakai `var(--color-*)`.
- Font memakai **nama Google Fonts** agar predefined font builder bisa
  menggantikannya. Contoh valid: `Inter`, `Barlow`, `Playfair Display`,
  `Bebas Neue`, `Space Grotesk`, `Nunito`, `Caveat`, `DM Sans`, `Manrope`.

Contoh: template bernuansa coklat (`primary: #92400e`) harus tetap tampil benar
ketika user memilih skema biru — karena semua warna mengalir dari 8 kunci itu.

### 4.4 `headers` / `footers` — ≥5 varian masing-masing

Setiap varian:

```jsonc
{
  "id": "bk-hdr-workshop",          // unik dalam template, kebab-case
  "name": "Bar Pabrik",             // nama di pemilih varian sidebar
  "description": "…",
  "layout": "standard",             // Tabel 5 (header) / Tabel 6 (footer)
  "mockup": "header-standard",      // preview mini di galeri (wajib diisi)
  "maxNavDepth": 1,                 // header saja: 1 = datar, 2 = boleh submenu
  "html": "…opsional…",             // §3.1
  "configFields": [ … ],            // §6 — form sidebar varian ini
  "defaultConfig": { … }            // §6 — nilai awal, semua key punya field
}
```

Kelima varian harus **benar-benar berbeda desainnya** (komposisi, bentuk,
dekorasi) — bukan sekadar geser rata kiri/tengah/kanan.

> Item nav tanpa flag `enabled` dianggap aktif oleh renderer. Tetap tulis
> `"enabled": true` eksplisit di seed agar maksudnya jelas.

---

## 5. Kamus Section

### Tabel 1 — Kategori bisnis (`category`)

| Nilai | Untuk |
|---|---|
| `food` | Kuliner, warung, kedai, bakery |
| `fashion` | Busana, hijab, sepatu, tas |
| `retail` | Toko, kelontong, elektronik |
| `handicraft` | Kerajinan, ukir, anyaman, buatan tangan |
| `services` | Bengkel, barbershop, salon, klinik, jasa, kursus |

### Tabel 1b — Jenis desain (`designType`, wajib)

| Nilai | Kesan |
|---|---|
| `editorial` | Tipografi besar, ruang kosong lega, garis tipis, kontras tinggi |
| `brutalist` | Sudut tajam, border tebal, blok warna rata |
| `organic` | Radius besar, warna hangat, kesan handmade |
| `luxury` | Serif/display, whitespace lega, aksen mewah |
| `tech` | Grid tegas, monospace, warna dingin, utilitarian |

### Tabel 1c — Paket tier (`tier_requirement`, kumulatif)

Template tidak memilih paketnya sendiri — **admin mengisi tier saat publish**
(dropdown Category + Min. Tier di dialog import admin). Aturannya kumulatif:
paket atas bisa memakai semua template paket bawahnya.

| Nilai | Siapa yang melihat |
|---|---|
| `free` | Semua paket (default bila tidak diisi) |
| `starter` | `starter`, `growth`, `enterprise` |
| `growth` | `growth`, `enterprise` |
| `enterprise` | Hanya `enterprise` |

Template bertier di atas paket tenant tetap tampil di katalog tapi **tergembok**
dengan ajakan upgrade — jadi rancang template `free` semenarik mungkin sebagai
pintu masuk, dan simpan fitur premium untuk tier berbayar.

> Nilai lain (termasuk string kosong) ditolak saat publish. Kolom `category`
> hanya menerima 5 nilai Tabel 1 — kategori di luar itu ditolak.

### Tabel 2 — 18 tipe section predefined (SEMUA wajib didefinisikan + boleh tambah tipe kustom §5.10)

| `type` | Contoh varian (≥3 tiap tipe) |
|---|---|
| `hero` | `hero-full`, `hero-split`, `hero-card`, `hero-video-bg` |
| `features` | `features-3col`, `features-list`, `features-stacked`, `features-masonry` |
| `pricing` | `pricing-2tier`, `pricing-3tier`, + 1 varian kreasimu |
| `testimonials` | `testimonials-grid`, `testimonials-carousel`, `testimonials-single` |
| `gallery` | `gallery-grid`, `gallery-masonry`, `gallery-carousel` |
| `location` | `location-hours`, + 2 varian kreasimu |
| `faq` | `faq-accordion`, `faq-list`, `faq-grid` |
| `contact` | `contact-form`, `contact-form-map`, `contact-split` |
| `about` | `about-left`, `about-right`, `about-centered` |
| `team` | `team-grid`, `team-list`, + 1 varian kreasimu |
| `video` | `video-full`, `video-centered`, + 1 varian kreasimu |
| `menu_board` | `menu-tabs`, `menu-list`, + 1 varian kreasimu (`menu-grid`) |
| `steps` | `steps-3col`, + 2 varian kreasimu (`steps-horizontal`, `steps-numbered`) |
| `cta` | `cta-banner`, `cta-card`, `cta-split` |
| `newsletter` | `newsletter-inline`, `newsletter-card`, + 1 varian kreasimu |
| `divider` | `divider-line`, `divider-spacer`, + 1 varian kreasimu |
| `marquee` | `marquee-band` (boleh 1 — single-DOM) |
| `product_grid` | `product-2col`, `product-3col`, `product-4col`, `product-carousel` |

> ID varian boleh kreasimu sendiri (mis. `hero-panggung`), TAPI bila tanpa
> `html` (§3.1) ia jatuh ke branch default renderer dan tampak sama dengan
> varian lain. **Varian kustom tanpa `html` + tanpa `customCss` = varian mati.**
> Selalu sertakan salah satunya. Detail + cara cek di §5.4.

### 5.4 ID varian kustom wajib hidup (aturan keras)

Renderer hanya mengenal ID bawaan (contoh hero: `hero-full`, `hero-split`,
`hero-card`, `hero-video-bg`). Setiap ID di luar itu (contoh nyata yang pernah
lolos: `hero-katering-full`, `hero-katering-split`) WAJIB memenuhi **salah satu**:

- (a) punya kunci `html` (§3.1) dengan markup yang benar-benar berbeda, ATAU
- (b) disasar eksplisit di `customCss`/`data.customCss`, mis.
  `[data-tpl-variant="hero-katering-full"] { … }`.

Bila tidak, import memunculkan warning persis seperti ini (dan varian tampil
kembar dengan default):

```
Varian "hero/hero-katering-full" tidak dikenal renderer dan tanpa
html/customCss — tampil sama dengan varian default. Tambahkan variant.html
atau sasar via customCss.
```

**Cek mandiri sebelum zip** (wajib): kumpulkan semua ID varian yang TIDAK ada
di Tabel 2, lalu untuk tiap ID pastikan `grep "id-tersebut"` mengenai `html`
miliknya sendiri ATAU `customCss`. Bila tidak kena keduanya → perbaiki dulu,
jangan mengandalkan warning import.

### Tabel 3 — Config key per section + tipe field yang sesuai

Setiap konten wajib punya field dengan tipe yang tepat (syarat §6):

**hero** — `headline` (text), `subheadline` (textarea), `cta_text` (text),
`cta_link` (text), `text_align` (select), `image` (image), `video_url` (text)

**features** — `title` (text), `items` (list: `icon` text-emoji, `title` text,
`description` textarea)

**menu_board** — `title` (text), `subtitle` (textarea), `groups` (list: `key` text,
`label` text, `items` list: `name` text, `desc` textarea, `price` text) untuk
`menu-tabs`; atau `items` datar untuk `menu-list`

**pricing** — `title` (text), `items` (list: `name` text, `price` text,
`features` = **`string[]` polos**, mis. `["Ganti oli", "Cek rem"]`.
JANGAN isi objek (`[{ "text": "…" }]`) — itu membuat seluruh halaman crash
putih. Renderer menoleransinya agar tidak roboh, tapi bentuk kanonis tetap
string polos.)

**testimonials** — `title` (text), `items` (list: `name` text, `text` textarea,
`rating` number 1–5, `avatar` image opsional)

**gallery** — `title` (text), `images` (gallery) atau `images` (list image)

**location** — `title` (text), `address` (textarea), `note` (textarea),
`button_text` (text), `button_link` (text), `hours` (list: `days` text,
`time` text)

**faq** — `title` (text), `items` (list: `question` text, `answer` textarea)

**contact** — `title` (text), `subtitle` (textarea), `address` (textarea),
`phone` (text), `email` (text), `show_map` (switch)

**about/team/steps/cta/newsletter/divider/marquee/product_grid** — lihat contoh
`template-bengkel.zip` (§10): `title` (text), `content`/`subtitle` (textarea
atau `html`), `image` (image), `members` (list), `items` (list),
`button_text`/`cta_text` (text), `placeholder` (text), `style`/`color`
(select/color), `columns` (number).

### 5.5 `activeSections` — section mana yang aktif untuk niche ini

`activeSections` = subset 18 tipe yang **di-seed ke kanvas** (`data.sections`):

```jsonc
"activeSections": ["hero","features","menu_board","pricing","testimonials","gallery","location","faq","contact"]
```

Aturan:

- Wajib subset dari 18 tipe Tabel 2 (yang tak dikenal dibuang saat import).
- `data.sections` hanya berisi tipe yang ada di `activeSections`, berurutan
  sesuai alur halaman (hero dulu, contact terakhir).
- 8 section inti UMKM **wajib aktif**: `hero`, `features`, `pricing`,
  `testimonials`, `gallery`, `location`, `faq`, `contact`.
- Sisa 10 tipe (`about`, `steps`, `menu_board`, `cta`, `marquee`, `divider`,
  `newsletter`, `team`, `video`, `product_grid`) aktifkan bila relevan dengan
  niche (mis. warung makan aktifkan `menu_board`; bengkel aktifkan `steps`).

### 5.6 Minimal varian

| Elemen | Minimal |
|---|---|
| Header | ≥5 varian, layout benar-benar dirender (Tabel 5), tiap punya `mockup` |
| Footer | ≥5 varian, layout benar-benar dirender (Tabel 6), tiap punya `mockup` |
| Tiap tipe section | ≥3 varian, tiap punya `mockup` — kecuali `marquee` (boleh 1) |

### 5.7 Aturan `anchorId` dan nav

- `anchorId` wajib **kebab-case** tanpa spasi (`layanan`, `harga-lengkap`) dan
  **unik** dalam satu template.
- Kalau `url` nav = `"#layanan"`, harus ada section ber-`anchorId: "layanan"`.
- Section tanpa kebutuhan navigasi (mis. `divider`) boleh tanpa `anchorId`.

### 5.8 Mobile-first penuh (spek wajib v3.1)

Template dirancang **dari layar HP ke atas**, bukan sebaliknya. Pengunjung UMKM
mayoritas dari HP — halaman yang rusak di 375px = template ditolak.

**Breakpoint builder:**

| Perangkat | Lebar | Perilaku section |
|---|---|---|
| HP (mobile) | < 640px | 1 kolom, nav jadi hamburger/drawer |
| Tablet | 640–1023px | 2 kolom / campuran |
| Desktop | ≥ 1024px | Multi-kolom penuh |

**Aturan layout (berlaku untuk `variant.html` maupun section bawaan):**

1. **Satu kolom sebagai default.** Grid/kolom ganda hanya di breakpoint naik
   (`@md:`/`@sm:` mengikuti pola renderer: `grid grid-cols-1 @md:grid-cols-3`).
2. **Dilarang lebar fixed di atas 480px** di `variant.html` maupun `customCss`:
   `width:1200px`, `min-width:900px`, dan sejenisnya. Pakai
   `max-width:100%` + `margin:auto` untuk membatasi di desktop.
3. **Gambar responsif**: selalu `max-width:100%;height:auto`. Jangan mengandalkan
   atribut `width`/`height` mentah dari aset.
4. **Tidak boleh scroll horizontal di 375px.** Penyebab umum: flex tanpa wrap,
   teks tanpa break (`word-break`), badge/marquee terlalu lebar, tabel tanpa
   wrapper scroll.
5. **Target sentuh ≥ 44×44px** untuk tombol, link nav, ikon hamburger, dan
   kontrol form. Jarak antar target yang bersebelahan cukup untuk jempol.
6. **Tipografi mobile**: body ≥ 14px, headline hero proporsional (jangan 72px di
   HP — turunkan via `@md:` atau `clamp()`), line-height ≥ 1.5 untuk paragraf.
7. **Navigasi mobile = hamburger/drawer**, bukan dropdown dan bukan menu desktop
   yang dikecilkan. Menu drawer menutup otomatis setelah item diklik lalu scroll
   ke anchor (`scrollIntoView smooth`). CTA header yang ramai boleh
   disembunyikan di HP agar header ringkas.
8. **Form mobile**: input full-width 1 kolom, keyboard yang tepat (`type=tel`
   untuk telepon, `type=email` untuk email — lewat placeholder pola bila perlu),
   tombol submit selebar layar.
9. **Sembunyikan section per perangkat bila relevan** lewat `responsive`
   (`hideOnMobile` / `hideOnTablet` / `hideOnDesktop`) — mis. marquee hiasan
   disembunyikan di HP, tabel harga lebar diganti varian ringkas. Jangan
   menyembunyikan konten inti (hero, kontak, CTA) di perangkat mana pun.

**Aturan `customCss` responsif:**

- Tulis gaya mobile dulu, tambah `@media (min-width:640px)` /
  `@media (min-width:1024px)` untuk naik — atau sasar `@md:` mengikuti pola
  renderer. Jangan menulis gaya desktop lalu menimpanya dengan `max-width`.
- Dilarang `position:fixed` kecuali header sticky / progress bar.
  Dilarang `overflow-x` yang memaksa scroll halaman.

**Verifikasi (wajib sebelum zip):** buka preview di **375px**, lalu 768px, lalu
1024px. Checklist: tidak ada scroll horizontal; hero terbaca tanpa zoom; CTA
terjangkau jempol; nav jadi hamburger di HP; form bisa diisi dengan keyboard HP.

### 5.9 Lebar konten section: boxed, bukan full-width selebar layar

Isi section **wajib dibox** (wadah terbatas + rata tengah), mengikuti section
bawaan renderer (`max-w-6xl`/`max-w-4xl` + `mx-auto`). Teks dan kartu yang
melebar satu layar penuh tidak terbaca dan terlihat rusak di monitor lebar.

**Skala lebar konten (sama dengan Tabel 7 header):**

| Lebar | Nilai | Untuk |
|---|---|---|
| `4xl` | 896px | Teks panjang: FAQ, testimoni tunggal, about-centered |
| `5xl` | 1024px | Sedang: pricing 2-tier, kontak split |
| `6xl` | 1152px — **default** | Umum: hero, features, galeri, pricing 3-tier |
| `full` | Mengikuti layar | **Hanya latar/pita**: background hero, marquee, wave divider — isinya tetap dibox di dalamnya |

**Aturan:**

1. **Default `6xl` (1152px) + `margin:auto`** untuk semua section konten, kecuali
   yang memang sempit secara sifatnya (`4xl`/`5xl` pada tabel di atas).
2. **`full` hanya untuk lapisan latar**, bukan isi. Background boleh selebar
   layar (foto hero, pita marquee, gradasi CTA), tapi judul/teks/tombol di
   atasnya tetap dibungkus wadah `6xl` (atau lebih sempit) yang terpusat.
3. **Padding horizontal wajib**: `24px` di HP (`px-6`), boleh longgar di desktop.
   Isi tidak boleh menempel ke tepi layar di 375px.
4. **Di `variant.html`**: bungkus isi dengan
   `<div style="max-width:1152px;margin:0 auto;padding:0 24px">…</div>`
   (ganti angka sesuai tabel). Jangan mengandalkan class Tailwind semata —
   wadah eksplisit lebih tahan (lihat §8.1).
5. **Di `customCss`**: bila menimpa lebar section bawaan, sasar
   `[data-tpl-type="X"] > div` dengan `max-width` + `margin-inline:auto` —
   jangan `width:100vw` (memicu scroll horizontal) dan jangan melebarkan
   melampaui `6xl` kecuali untuk lapisan latar (aturan 2).
6. **Sejajar vertikal**: semua section satu halaman memakai lebar yang sama
   (umumnya `6xl`) agar tepi kiri-kanan rata dari hero sampai footer —
   selaras dengan `contentWidth` header (Tabel 7, default `6xl`).

**Verifikasi:** buka preview di **1440px** (atau monitor terlebar): tidak ada
teks/kartu yang menempel ke tepi layar; tepi konten hero ≈ tepi konten
features ≈ tepi footer.

### 5.10 Tipe section kustom — buat tipe barumu sendiri (v3.4)

19 tipe Tabel 2 adalah fondasi wajib, **bukan batas**. Bila niche butuh blok
yang tidak muat di tipe manapun (contoh: `jadwal-sholat`, `kalkulator-ongkir`,
`menu-harian`), buat tipe sendiri. Bedakan dengan §5.4: itu soal ID *varian*
kustom di dalam tipe bawaan; ini soal *tipe* yang benar-benar baru.

**Syarat tipe kustom (divalidasi otomatis, gagal = import ditolak):**

1. **Id kebab-case**, huruf kecil/angka/strip, maks 40 karakter, mis.
   `promo-gacor`. **Dilarang** memakai nama 19 bawaan (`hero`, `faq`, …).
2. **≥1 varian**, tiap varian punya `name`, `configFields`, `defaultConfig`,
   `mockup` — sama seperti varian biasa.
3. **Tiap varian WAJIB punya `html` non-kosong.** Renderer tidak punya branch
   untuk tipe asing; tanpa html, section jatuh ke placeholder bertuliskan
   `Section: <type>` dan praktis mati. Tidak ada pengecualian.
4. `html` memakai placeholder `{{key}}` / `{{{key}}}` seperti biasa (§3.1),
   mengikuti aturan responsif (§5.8: fluid, 1 kolom default) dan lebar boxed
   (§5.9: bungkus isi `max-width` + `margin:auto`).
5. Daftarkan tipe kustom di `activeSections` / seed bila dipakai di halaman —
   hanya tipe yang terdefinisi di katalog yang boleh aktif.

**Contoh minimal:**

```jsonc
{
  "type": "jadwal-sholat",
  "name": "Jadwal Sholat",
  "icon": "Clock",
  "variants": [
    {
      "id": "jadwal-sholat-kartu",
      "name": "Kartu",
      "description": "Kartu jadwal sholat harian",
      "layout": "jadwal-sholat-kartu",
      "mockup": "jadwal-sholat-kartu",
      "html": "<section data-tpl-type=\"jadwal-sholat\" data-tpl-variant=\"jadwal-sholat-kartu\"><div style=\"max-width:1152px;margin:0 auto;padding:0 24px\"><h2>{{title}}</h2><p>{{subtitle}}</p></div></section>",
      "configFields": [
        { "key": "title", "label": "Judul", "type": "text" },
        { "key": "subtitle", "label": "Sub Judul", "type": "textarea" }
      ],
      "defaultConfig": { "title": "Jadwal Sholat", "subtitle": "… " }
    }
  ]
}
```

Catatan: `icon` bebas (dipakai pemilih blok; tak dikenal → ikon default).
`layout` bebas (hanya label; yang dirender adalah `html`).

### 5.11 Header & Footer milik template — chrome custom (v3.4)

**Prinsip:** Header & footer **wajib** menggunakan varian milik template. Template **tidak boleh** mengandalkan header/footer bawaan builder (default). Jika template tidak menyediakan `html` untuk varian header/footer, ia akan tampil seperti template bawaan builder (default), bukan desain milik template.

**Layout bawaan (renderer punya branch):**  
- Header: `standard`, `floating`, `hero-overlay`, `split-nav`, `with-topbar`, `glass`, `minimal`  
- Footer: `simple`, `columns`, `centered`, `minimal`, `newsletter`, `social`, `cta-overlap`

**Aturan keras (divalidasi otomatis saat import):**

| Situasi | Aturan | Konsekuensi |
|---|---|---|
| Layout **kustom** (di luar daftar di atas) **tanpa `html`** | **ERROR** — import ditolak | Renderer tidak punya branch → desain hilang diam-diam |
| Layout **bawaan** **tanpa `html`** | **WARNING** (import tetap sukses) | Tampil persis seperti bawaan builder; bukan desain template. Tambahkan `variant.html` untuk desain sendiri. |
| Layout **kustom** **dengan `html`** | OK | Desain custom berjalan via `variant.html` |

**Aturan desain chrome:**
1. Layout kustom **WAJIB** punya `html` non-kosong di setiap varian. Tanpa html, import gagal (error).
2. Layout bawaan **DISARANKAN** punya `html` agar desain jadi milik template, bukan bawaan builder. Tanpa html → warning di import.
3. Setiap varian chrome WAJIB punya `configFields` + `defaultConfig` + `mockup` (untuk galeri).
4. `configFields` chrome: `logoUrl`, `siteTitle`, `tagline`, `navItems` (list), `ctaText`, `ctaLink`, `showCta`, `sticky` (header); `siteTitle`, `logoUrl`, `text`, `showNav`, `navItems`, `showSocial`, `address`, `phone`, `email` (footer) — serupa §4.3.
5. `defaultConfig` chrome WAJIB terisi (tidak boleh kosong `""` atau `[]`) agar preview & apply tidak kosong.

**Contoh varian header kustom:**

```jsonc
{
  "id": "hdr-katering-split",
  "name": "Split Nav",
  "description": "Brand kiri, menu kanan, CTA sticky",
  "layout": "hdr-katering-split",
  "mockup": "header-split",
  "html": "<header data-tpl-type=\"header\" data-tpl-variant=\"hdr-katering-split\"><div style=\"max-width:1152px;margin:0 auto;padding:0 24px\"><a href=\"#\"><img src=\"{{logoUrl}}\" alt=\"{{siteTitle}}\"/></a><nav>{{navItems}}</nav><a href=\"{{ctaLink}}\" class=\"btn\">{{ctaText}}</a></div></header>",
  "configFields": [
    { "key": "logoUrl", "label": "Logo URL", "type": "image" },
    { "key": "siteTitle", "label": "Nama Toko", "type": "text" },
    { "key": "tagline", "label": "Tagline", "type": "text" },
    { "key": "navItems", "label": "Menu Navigasi", "type": "list", "itemFields": [{ "key": "label", "type": "text" }, { "key": "url", "type": "text" }] },
    { "key": "ctaText", "label": "Teks CTA", "type": "text" },
    { "key": "ctaLink", "label": "Link CTA", "type": "text" },
    { "key": "showCta", "label": "Tampilkan CTA", "type": "switch" },
    { "key": "sticky", "label": "Header menempel", "type": "switch" }
  ],
  "defaultConfig": {
    "logoUrl": "",
    "siteTitle": "Catering",
    "tagline": "Makanan Sehat Setiap Hari",
    "navItems": [],
    "ctaText": "Pesan Sekarang",
    "ctaLink": "#pesan",
    "showCta": true,
    "sticky": true
  }
}
```

**Contoh varian footer kustom:**

```jsonc
{
  "id": "ftr-katering-split",
  "name": "Split Footer",
  "description": "Brand kiri, navigasi tengah, kontak kanan",
  "layout": "ftr-katering-split",
  "mockup": "footer-split",
  "html": "<footer data-tpl-type=\"footer\" data-tpl-variant=\"ftr-katering-split\"><div style=\"max-width:1152px;margin:0 auto;padding:0 24px\"><div class=\"grid grid-cols-3 gap-8\"><div><h4>{{siteTitle}}</h4><p>{{address}}</p></div><nav>{{navItems}}</nav><div><p>{{phone}}</p><p>{{email}}</p></div></div></footer>",
  "configFields": [
    { "key": "siteTitle", "label": "Nama Toko", "type": "text" },
    { "key": "logoUrl", "label": "Logo URL", "type": "image" },
    { "key": "text", "label": "Teks Copyright", "type": "text" },
    { "key": "showNav", "label": "Tampilkan Navigasi", "type": "switch" },
    { "key": "navItems", "label": "Menu Footer", "type": "list", "itemFields": [{ "key": "label", "type": "text" }, { "key": "url", "type": "text" }] },
    { "key": "showSocial", "label": "Tampilkan Sosmed", "type": "switch" },
    { "key": "address", "label": "Alamat", "type": "text" },
    { "key": "phone", "label": "Telepon", "type": "text" },
    { "key": "email", "label": "Email", "type": "text" }
  ],
  "defaultConfig": {
    "siteTitle": "Catering",
    "logoUrl": "",
    "text": "© {year} Catering.",
    "showNav": true,
    "navItems": [],
    "showSocial": true,
    "address": "",
    "phone": "",
    "email": ""
  }
}
```

**Catatan:** `layout` di chrome hanya label; yang dirender adalah `html`. `id` harus unik kebab-case. Setiap varian chrome wajib punya `html`, `configFields`, `defaultConfig`, `mockup`. Tanpa `html`, varian tidak akan tampil beda dari bawaan.

---

### Tabel 4 — `designStyleId` (10 style bawaan)

`minimalist` · `flat` · `dark-mode` (satu-satunya gelap) · `neo-brutalism` ·
`glassmorphism` · `organic` · `retro` · `typography` · `parallax` · `3d-immersive`

> `designStyleId` hanya label + bahan panel warna. Yang tampil di halaman adalah
> `paletteOverride` — template gelap wajib memakai `paletteOverride` penuh.

### Tabel 5 — Layout header (7, semuanya dirender)

`standard` · `floating` · `hero-overlay` · `split-nav` · `with-topbar` ·
`glass` · `minimal`

### Tabel 6 — Layout footer

`simple` · `columns` · `centered` · `minimal` (+ varian kreasimu via `html`)

### Tabel 7 — `contentWidth`

`full` (mengikuti layar) · `6xl` = 1152px (**disarankan**) · `5xl` = 1024px ·
`4xl` = 896px

> Skala yang sama berlaku untuk **isi section** — lihat §5.9 (boxed, bukan
> full-width). Header (`contentWidth`) dan section (§5.9) memakai default
> yang sama (`6xl`) agar tepi halaman rata.

---

## 6. Tidak ada konten hardcoded

**Setiap key yang diisi di `defaultConfig` harus punya form field**, agar user
bisa mengubahnya dari sidebar. Key tanpa field = konten mati.

```jsonc
// ✅ Benar: semua key punya field
"configFields": [
  { "key": "headline", "label": "Judul", "type": "text" },
  { "key": "hero_image", "label": "Gambar Hero", "type": "image" },
  { "key": "items", "label": "Daftar", "type": "list", "itemFields": [
    { "key": "name", "label": "Nama", "type": "text" },
    { "key": "price", "label": "Harga", "type": "text" }
  ]}
],
"defaultConfig": {
  "headline": "Judul default (bisa diubah user)",
  "hero_image": "assets/hero.jpg",
  "items": [{ "name": "…", "price": "…" }]
}
```

```jsonc
// ❌ Salah: "promo_badge" diisi tapi tidak ada field-nya → tidak bisa diubah
"defaultConfig": { "headline": "…", "promo_badge": "DISKON 50%" }
```

Pengecualian (boleh tanpa field — struktural, bukan konten): `showCta`,
`showNav`, `showSocial`, `contentWidth`, `id`, `isExternal`, `enabled`, `key`.

Pilih tipe field yang sesuai isi: gambar → `image`, daftar gambar → `gallery`,
warna → `color`, latar → `background`, ya/tidak → `switch`, angka → `number`,
pilihan → `select`, teks kaya → `html` (§3.2), berulang → `list`.

---

## 7. Kontrak Animasi & Behaviour

### 7.1 `animations[]` — deklaratif, tanpa JS

```jsonc
"animations": [
  { "id": "reveal-hero",
    "name": "Hero Fade Up",
    "type": "slide",                  // fade | slide | zoom | bounce | custom
    "duration": 700,
    "delay": 0,
    "easing": "cubic-bezier(.16,1,.3,1)",
    "trigger": "onLoad",              // onLoad | onScroll | onHover | onClick
    "target": "#beranda" }            // CSS selector — WAJIB
]
```

Untuk `type: "custom"` isi `keyframes` sendiri (blok `@keyframes` utuh atau isi
saja, mis. `"from{transform:rotate(0)}to{transform:rotate(360deg)}"`).

### 7.2 `behaviours[]` — JS untuk kasus khusus

```jsonc
"behaviours": [
  { "id": "scroll-progress",
    "name": "Progress Bar Scroll",
    "trigger": "onLoad",              // onLoad | onScroll | onClick | onHover | onSubmit
    "target": "body",
    "script": "(function(){ … })();" }
]
```

Boleh juga sebagai file `behaviours/nama.json` — keduanya dibaca.

Aturan script: maks 100.000 karakter, dijalankan sekali setelah siap, selalu
bungkus IIFE, hindari loop berat.

**Pola yang otomatis DIBLOKIR** (diganti `// BLOCKED` saat import & runtime):

```
eval(  Function(  new Function(  setTimeout("  setInterval("
document.write(  document.writeln(  window.location =  location.href =
<script>  </script>  on*=
```

### 7.3 Contoh script yang berguna

Progress bar, hitung mundur promo, parallax (`translateY` dari `scrollY`),
smooth-scroll anchor — lihat arsip v2 untuk contoh lengkap.

---

## 8. Art Direction, Thumbnail & Preview

### 8.0 Langkah awal

1. Tulis **1 kalimat design thesis** (mis. "Bengkel teknis yang terasa seperti
   ruang kerja, bukan etalase").
2. Pilih **satu** `designType` (Tabel 1b) dan **satu** gaya §8.3.
3. Ikuti resep itu untuk `theme` **dan** `customCss` **dan** `variant.html`.
4. Baru tulis konten.

### 8.1 Hook wajib: `data-tpl-type` dan `data-tpl-variant`

Setiap section dibungkus elemen ber-atribut ini (otomatis bila pakai renderer
bawaan; tulis manual bila pakai `variant.html`):

```html
<div id="keunggulan" data-tpl-type="features" data-tpl-variant="features-3col">
  …
</div>
```

**Selalu menyasar `data-tpl-*` di `customCss`.** Jangan menyasar class Tailwind —
itu bisa berubah tiap build.

### 8.2 `data.customCss` — kunci pembeda utama

Renderer **tidak pernah** menghasilkan `border`, `box-shadow`,
`backdrop-filter`, `clip-path`, `mask-image`, atau `filter` pada kartu section.
Semua gaya modern **hanya bisa** dicapai lewat `customCss` (atau `variant.html`).

Aturan: maks 200.000 karakter; diblokir `@import`, `url()` non-`data:`,
`expression(`, `-moz-binding`, `behavior:`, `</style>`; aset gambar tetap lewat
`assets/` (jangan `url(https://…)` di CSS); pakai `var(--color-*)`.

### 8.3 Resep gaya (ringkas — pilih satu)

**Minimalist** — `borderRadius: 2`, `buttonStyle: outline`, `shadowStyle: none`,
tanpa box-shadow, garis `1px solid var(--color-border)`.

**Dark/Cyberpunk** — `designStyleId: dark-mode`, grid neon di hero,
glow di CTA (`box-shadow: 0 0 22px …`).

**Glassmorphism** — kartu `rgba(255,255,255,.10)` + `backdrop-filter: blur(16px)`
+ border putih transparan. Butuh latar berwarna di belakangnya.

**Neo-Brutalism** — `borderRadius: 0`, border `3px solid var(--color-text)`,
`box-shadow: 8px 8px 0 var(--color-accent)`, hover menggeser.

**Neomorphism/Claymorphism/Bento/Wave/Gradient-text** — lihat arsip v2; teknik
sama, hanya bungkusnya kini boleh `variant.html`.

### 8.4 Thumbnail & preview (demo template)

- `thumbnail.png` (800×600, <1MB) di **root** ZIP — kartu galeri.
- Preview (`/preview/[templateId]`) merender `data.sections` + `data.header` +
  `data.footer` apa adanya — verifikasi di **tiga viewport: 375px, 768px,
  1024px** (§5.8) sebelum mengembalikan ZIP.
- **Tidak perlu semua 19 tipe tampil**, cukup yang di
  `activeSections` sesuai niche UMKM (mis. warung makan tampilkan hero, menu,
  testimoni, lokasi, kontak).
- Pastikan preview = hasil apply: isi `sections` root dan `data.sections` dengan
  seed yang sama.

### 8.5 Kesalahan yang membuat template terlihat monoton

| Kesalahan | Akibat |
|---|---|
| Tidak pakai `customCss`/`variant.html` sama sekali | "Kartu putih + teks" generik |
| Hanya ganti palet | Sama dengan template lain |
| Varian tanpa `html` + tanpa CSS khas | 3 nama untuk 1 tampilan |
| `borderRadius` selalu 8–16 | Tidak ada karakter |
| Menyasar class Tailwind di CSS | Berhenti jalan diam-diam |
| Hex mentah di `html`/CSS (bukan `var(--color-*)`) | Skema builder merusak desain |

### 8.6 Export ZIP (round-trip import-ulang)

Tombol **Export** (galeri tenant maupun panel admin) selalu menghasilkan ZIP
dengan struktur **yang sama persis seperti ZIP import** (§2), sehingga hasilnya
bisa di-import ulang apa adanya:

```
nama-template.zip
├── template.json        # data tersimpan apa adanya (hanya URL storage
│                        #  yang ditulis ulang ke path relatif assets/…)
├── thumbnail.png        # diunduh ulang dari storage (best-effort)
├── assets/              # file aktual yang berhasil diunduh ulang
│   ├── logo.png
│   └── meta.json        # referensi saja (dilewati saat import)
└── (tanpa behaviours/*.json & animations/ — keduanya hidup inline
    di template.json; menulis file terpisah justru menduplikasi saat re-import)
```

Jaminan dan batasnya:
- URL absolut (signed URL kedaluwarsa) di `template.json` dipetakan balik ke
  `assets/<nama>` memakai metadata DB — **hanya untuk file yang benar-benar
  masuk ZIP**. URL yang filenya gagal diunduh dibiarkan apa adanya (jujur)
  dan dilaporkan sebagai warning di log server.
- `behaviours` + `animations` tetap inline di `template.json` (import
  membacanya dari sana — lihat §2.7).
- Thumbnail yang gagal diunduh (URL kedaluwarsa) tidak disertakan sebagai
  file; `thumbnail_url` lama tetap tertulis.

---

## 9. Checklist Sebelum Mengembalikan ZIP

Legenda: **[FAIL]** = import ditolak bila dilanggar (§2.7). Tanpa tanda =
anjuran kualitas — import tetap sukses tapi hasilnya bisa rusak/kosong.

- [ ] **[FAIL]** `template.json` di **root** dan valid JSON, berisi `theme` + `sections` non-kosong
- [ ] **[FAIL]** Tiap ID varian kustom (di luar Tabel 2) punya `html` ATAU disasar `customCss` — cek via grep per ID (§5.4)
- [ ] **[FAIL]** Layout chrome kustom tanpa `html` tidak ada (§5.11)
- [ ] **[FAIL]** Batas §2.2 dipatuhi (25MB ZIP, 200 entri, 50 aset, dst.)
- [ ] **[FAIL]** Aset berekstensi diizinkan; path aman; nama duplikat tidak ada
- [ ] `version: "3.0"` terisi (metadata; tidak divalidasi)
- [ ] `thumbnail.png` di **root** (800×600, <1MB) — sangat disarankan; tanpanya kartu galeri kosong
- [ ] `designType` salah satu dari 5 (Tabel 1b); `category` salah satu dari 5 (Tabel 1)
- [ ] `sections` katalog memuat **semua 18 tipe** Tabel 2 (+ tipe kustom bila ada, §5.10)
- [ ] Tiap tipe (kecuali `marquee`) punya **≥3 varian** berisi `mockup`
- [ ] Tiap tipe kustom: id kebab-case tak menabrak bawaan, ≥1 varian, **tiap varian punya `html`** (§5.10)
- [ ] `headers` ≥5 varian, `footers` ≥5 varian, tiap punya `mockup` **dan `html`**
- [ ] `activeSections` = tipe terdefinisi di katalog (boleh kustom), memuat 8 inti
  (hero, features, pricing, testimonials, gallery, location, faq, contact)
- [ ] `data.sections` hanya berisi tipe aktif, `config` **lengkap**, `anchorId` unik
- [ ] Tiap key `defaultConfig` punya `configFields` (§6) — tidak ada konten mati
- [ ] Tipe field sesuai isi (image/gallery/color/switch/html/list)
- [ ] `variant.html` (bila ada) ≤50rb karakter, bebas script/style/iframe/on*
- [ ] Isi section dibox (§5.9): default `6xl` + rata tengah + padding 24px di HP;
  `full` hanya untuk lapisan latar; verifikasi di 1440px (tepi hero ≈ features ≈ footer)
- [ ] `variant.html` + `customCss` responsif (§5.8): tanpa width fixed >480px,
  gambar `max-width:100%`, grid 1 kolom → multi-kolom via `@md:`
- [ ] Verifikasi 375px: tanpa scroll horizontal, hero terbaca, CTA terjangkau,
  nav jadi hamburger, form 1 kolom full-width
- [ ] Target sentuh ≥44px; body ≥14px; CTA header ringkas di HP
- [ ] Tiap `url` nav (`#…`) punya section ber-anchor cocok
- [ ] `footer.text` memuat `{year}`; `header.navItems` non-kosong + `ctaText` terisi
- [ ] `seo.title` + `seo.description` (≥50 karakter) terisi
- [ ] Palet 8 kunci, lolos kontras 4.5:1; font = nama Google Fonts
- [ ] `designStyleId` salah satu dari 10 (Tabel 4)
- [ ] `customCss`/`variant.html` menyasar `data-tpl-*`, pakai `var(--color-*)`
- [ ] Tiap file di `assets/` dirujuk ≥1 kali di `template.json` (§2.6)
- [ ] Tiap field gambar di seed terisi (`assets/…` atau URL eksplisit, bukan `""`)
- [ ] Script IIFE, tanpa pola terlarang (§7.2)
- [ ] ZIP bisa dibuka dan `template.json` valid JSON
- [ ] `category` + tier target sudah disiapkan untuk form import admin (Tabel 1c)

---

## 10. Contoh Referensi

Dua referensi — pakai keduanya:

**A. Kerangka v3.0 siap isi** (`docs/template-reference-v3.json` + tool):

```bash
# Buat kerangka baru untuk niche apapun
bun scripts/create-template.ts --category food --design organic --name "Warung Makan" --out template.json

# Validasi sebelum zip
bun scripts/create-template.ts --validate template.json
```

File `docs/template-reference-v3.json` = kerangka lengkap yang SUDAH valid v3.0
(semua 19 tipe, ≥3 varian per tipe, ≥5 header/footer, activeSections, slot
`variant.html`, field `html`). Isi `defaultConfig` + `theme` + `customCss` +
`variant.html` sesuai niche — strukturnya jangan diubah.

**B. Contoh terisi dari Export** (cara tercepat melihat bentuk nyata):

1. Buka panel admin → Templates → **Export** pada template apa pun.
2. Hasilnya ZIP import-compatible (§8.6): `template.json` persis seperti yang
   disimpan + `assets/` + `thumbnail.*`. Bandingkan dengan kerangka A untuk
   melihat bagaimana konten niche mengisi struktur yang sama.
