# Panduan Membuat Template ZIP — untuk AI Eksternal

> **Untuk siapa**: AI Assistant di luar repository (Claude, GPT, dll.) yang tasked
> merancang template website UMKM.
> **Output tunggal**: satu file `.zip` yang di-import user lewat
> **Customize → Templates → Import**.
> **Versi**: 2.0 · **Terakhir diperbarui**: 2026-10-02

---

## 0. Batasan yang harus dipahami sejak awal

Kamu **tidak** mengenal codebase ini dan **tidak** boleh mengubah kode apa pun.
Yang kamu lakukan:

1. Merancang identitas visual (palet, tipografi, tata letak, tone).
2. Menyusun seluruh konfigurasi template sesuai skema di bawah.
3. Membuat aset (gambar/foto) bila ada.
4. Mengembalikan **satu file `.zip`** sebagai hasil akhir.

Semua yang tidak tercantum di dokumen ini **tidak akan dirender**. Section,
variant, atau config key yang tidak ada di daftar putih akan diabaikan atau
di-backfill oleh sistem.

> ### Aturan besi
> 1. **Satu file ZIP saja** sebagai output. Tidak ada file lain, tidak ada patch kode.
> 2. **JANGAN hasilkan HTML.** Output wajib JSON (`template.json`), bukan `.html`,
>    bukan JSX, bukan CSS terpisah sebagai file utama. Lihat §0.1.
> 3. **Jangan mengarang nama tipe/variant section.** Hanya id di Tabel 2 & 3 yang valid.
> 4. **Seed section wajib menyertakan config lengkap** — jangan mengandalkan nilai
>    default sistem (lihat §5.4).
> 5. **9 section inti wajib ada** (lihat §6). Tanpa itu template ditolak.
> 6. Animasi **harus lewat kontrak deklaratif** (§7), bukan JS bebas untuk efek dasar.
> 7. Untuk desain yang berbeda secara visual (glassmorphism, bento grid, dan
>    sejenisnya), pakai `data.customCss` (§8.4) — **bukan** menulis HTML sendiri.

### 0.1 Kenapa bukan HTML

Platform ini **tidak punya jalur HTML sama sekali**. Bukan preferensi, bukan
guideline — secara harfiah tidak ada:

- Tidak ada file `.html`/`.hbs`/`.ejs`/`.pug` di repository.
- Tidak ada template engine di dependency.
- Tidak ada fungsi generator/export HTML.

Halaman dibangun dari **data** yang dirender komponen React (`SectionRenderer`).
Kalau kamu mengembalikan HTML, hasilnya **langsung ditolak import** dengan pesan
`Format template tidak valid: wajib punya "theme" (format template) atau
"layout.rows" + "core" (format builder)` — karena tidak ada `theme` maupun
`sections`.

```jsonc
// ✅ Yang diminta: data
{ "theme": { … }, "sections": [ { "type": "hero", "variant": "hero-split", … } ] }

// ❌ Yang TIDAK boleh: markup
{ "<!DOCTYPE html><html><head><style>…</style></head><body>…" }
```

Kalau kamu merasa "desainnya tidak muat", jangan melebar ke HTML — pakai
`data.customCss` (§8.4). Itu jalur yang memang disediakan untuk hal itu.

---

## 1. System Prompt (siap salin)

```
Kamu adalah desainer template website untuk platform builder UMKM Indonesia.

TUGASMU: merancang satu template untuk niche bisnis yang diberikan, lalu
menghasilkan SATU file .zip yang bisa di-import langsung ke builder.

ATURAN WAJIB:
1. Output hanya satu file .zip. Jangan menulis atau mengubah kode aplikasi.
2. Gunakan HANYA tipe section dan id varian yang terdaftar di Tabel 2 & 3.
3. Setiap section wajib menyertakan config yang LENGKAP (jangan andalkan default).
4. Wajib menyertakan 9 section inti: hero, features, pricing, booking,
   testimonials, gallery, location, faq, contact.
5. anchorId tiap section harus unik, dan URL nav harus ditulis "#anchorId" yang sama.
6. Teks di atas latar wajib kontras >= 4.5:1.
7. Animasi memakai kontrak animations[] (deklaratif); script JS hanya untuk
   kasus yang tidak tertutup kontrak tersebut.
8. Jangan memakai pola yang otomatis diblokir sanitizer (lihat §7.4).

SEBELUM MENGEMBALIKAN ZIP, jalankan checklist di §9.
```

---

## 2. Anatomi ZIP

```
nama-template.zip
├── template.json        # WAJIB. Root. Konfigurasi utama (lihat §4)
├── thumbnail.png        # opsional. Root. Kartu galeri (800×600, < 1MB)
├── assets/              # opsional. Aset gambar
│   ├── logo.png
│   ├── hero.jpg
│   └── gallery-01.jpg
└── behaviours/          # opsional. Script tambahan
    └── scroll-progress.json
```

### 2.1 Nama file itu literal, bukan bebas

| Path | Wajib? | Aturan |
|---|---|---|
| `template.json` | **Ya** | Persis di root. Tanpa ini import ditolak. |
| `thumbnail.png` / `.jpg` / `.jpeg` / `.webp` | Tidak | Persis di **root**, bukan di dalam `assets/`. |
| `assets/*` | Tidak | Semua file langsung di dalam `assets/`. |
| `behaviours/*.json` | Tidak | Semua file langsung di dalam `behaviours/`. |

File bernama `meta.json` di folder mana pun otomatis dilewati (dipakai oleh
hasil export sistem).

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

### 2.3 Ekstensi aset yang diizinkan

```
jpg  jpeg  png  gif  webp  svg  ico  avif  js  css
```

Ekstensi lain → **seluruh import gagal** dengan pesan
`Tipe file tidak diizinkan`.

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
di `theme`, `sections`, `headers`, dan `footers`. Jadi cukup tulis path relatif;
jangan menulis URL CDN sendiri.


---

## 3. Skema ZIP yang diterima

`template.json` boleh salah satu dari dua bentuk:

```jsonc
{ "theme": {...}, "sections": [...], "data": {...} }    // bentuk langsung
{ "template": { "theme": {...}, "sections": [...] } }   // bentuk terbungkus
```

Syarat yang **diperiksa server**:

- `theme` wajib ada dan berupa object.
- `headers`, `footers`, `sections` — bila ada, wajib berupa array.
- `sections` wajib **non-kosong**.

Gagal salah satu syarat di atas = import ditolak.

---

## 4. Kamus `template.json`

```jsonc
{
  "version": "2.0",                  // opsional, informatif
  "name": "Bengkel Jaya Motor",      // nama template di galeri
  "description": "…",                // maksimal 2000 karakter
  "category": "services",            // Tabel 1
  "theme":    { … },                 // §4.1 — WAJIB
  "headers":  [ … ],                 // opsional, Tabel 5
  "footers":  [ … ],                 // opsional, Tabel 6
  "sections": [ … ],                 // §5 — WAJIB, non-kosong
  "data":     { … },                 // §4.2 — dipakai saat template diterapkan
  "animations":  [ … ],              // §7.1 — opsional
  "behaviours":  [ … ]               // §7.2 — opsional
}
```

> **Penting.** `sections` di root dipakai untuk **preview**. Blok `data` dipakai
> saat template **diterapkan** ke website. Keduanya menunjuk seed yang sama — isi
> keduanya supaya preview dan hasil apply identik.

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
    "headingFont": "Barlow",      // WAJIB Google Fonts
    "bodyFont":    "Inter",
    "baseSize":    16,
    "scaleRatio":  1.25,          // rentang wajar 1.125–1.35
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

**Cara aman memilih teks redup**: pakai abu-abu 500–700, bukan 300–400. Abu-abu
terang di atas putih hanya sekitar 3:1 dan akan ditolak.

**Font**: hanya nama dari Google Fonts. Pilihan yang relevan antara lain:
`Inter`, `Barlow`, `Archivo`, `Roboto`, `Oswald`, `Playfair Display`, `Poppins`,
`Montserrat`, `Lora`, `Caveat`, `Nunito`, `Bebas Neue`, `DM Sans`, `Manrope`,
`Sora`, `Space Grotesk`.

### 4.2 `data` — dipakai saat template diterapkan

```jsonc
"data": {
  "designStyleId":   "dark-mode",  // Tabel 4
  "paletteOverride": { …8 warna… }, // WAJIB: palet yang kamu rancang
  "customCss":       "…",           // §8.4 — CSS bebas, kunci pembeda utama
  "sections":        [ … ],          // seed, sama dengan `sections` di root
  "header": {
    "variant":   "standard",         // Tabel 5
    "logoUrl":   "assets/logo.png",
    "siteTitle": "Bengkel Jaya Motor",
    "tagline":   "Servis Motor & Mobil",
    "navItems": [
      { "id": "n1", "label": "Layanan", "url": "#layanan",
        "isExternal": false, "enabled": true }
    ],
    "ctaText":      "Booking Servis",
    "ctaLink":      "https://wa.me/6281234567890",
    "showCta":      true,
    "sticky":       true,
    "contentWidth": "6xl"            // Tabel 7
  },
  "footer": {
    "style": "columns",              // Tabel 6
    "text":  "© {year} Bengkel Jaya Motor.",   // WAJIB memuat "{year}"
    "navItems":   [ … ],
    "showSocial": true,
    "phone": "0812…", "email": "…", "whatsapp": "628…"
  },
  "seo": {
    "title":       "Bengkel Jaya Motor — Servis Motor Jakarta Timur",
    "description": "minimal 50 karakter, ideal 120–160"
  },
  "core": {                          // opsional, cerminkan header/footer
    "site_title": "…", "tagline": "…",
    "header_nav": [ … ], "footer_nav": [ … ],
    "footer_text": "© {year} …"
  }
}
```

**Aturan `url` pada navItems**: untuk section dalam halaman pakai anchor
(`"#layanan"`). Pakai `isExternal: true` hanya untuk link ke luar.


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

### Tabel 2 — 19 tipe section + id varian yang valid

| `type` | Varian yang boleh dipakai |
|---|---|
| `hero` | `hero-full`, `hero-split`, `hero-card`, `hero-video-bg` |
| `features` | `features-3col`, `features-list`, `features-stacked`, `features-masonry` |
| `pricing` | `pricing-2tier`, `pricing-3tier` |
| `booking` | `booking-single`, `booking-split` |
| `testimonials` | `testimonials-grid`, `testimonials-carousel`, `testimonials-single` |
| `gallery` | `gallery-grid`, `gallery-masonry`, `gallery-carousel` |
| `location` | `location-hours` *(satu-satunya varian)* |
| `faq` | `faq-accordion`, `faq-list`, `faq-grid` |
| `contact` | `contact-form`, `contact-form-map`, `contact-split` |
| `about` | `about-left`, `about-right`, `about-centered` |
| `team` | `team-grid`, `team-list` |
| `video` | `video-full`, `video-centered` |
| `menu_board` | `menu-tabs`, `menu-list` |
| `steps` | `steps-3col` *(satu-satunya varian)* |
| `cta` | `cta-banner`, `cta-card`, `cta-split` |
| `newsletter` | `newsletter-inline`, `newsletter-card` |
| `marquee` | `marquee-band` *(satu-satunya varian)* |
| `divider` | `divider-line`, `divider-spacer` |
| `product_grid` | `product-2col`, `product-3col`, `product-4col`, `product-carousel` |

> **PENTING — `product_grid` belum berfungsi.** Di renderer saat ini section ini
> hanya menampilkan placeholder abu-abu, bukan produk asli. **Jangan pakai
> `product_grid`** untuk daftar layanan atau katalog. Gunakan `menu_board`
> (daftar layanan + harga) atau `pricing`.

> **Varian yang tidak dikenal akan ditimpa diam-diam** menjadi varian pertama
> milik tipe tersebut. Jadi `booking-single` yang salah ketik berubah jadi
> `booking-split` tanpa error. Periksa ejaan id dengan teliti.

### Tabel 3 — Config key per section

Isi semua key yang relevan; nilai yang tidak kamu isi akan tampil kosong.

**hero**
```jsonc
{ "headline": "…", "subheadline": "…",
  "cta_text": "…", "cta_link": "#booking",
  "text_align": "center",            // center | left | right
  "image": "assets/hero.jpg" }
```

**features**
```jsonc
{ "title": "…",
  "items": [ { "icon": "🔧", "title": "…", "description": "…" } ] }   // icon = emoji
```

**menu_board — daftar layanan + harga**
```jsonc
// varian menu-tabs
{ "title": "Layanan dan Harga", "subtitle": "…",
  "groups": [ { "key": "perawatan", "label": "Perawatan Berkala",
    "items": [ { "name": "Ganti Oli", "desc": "…", "price": "Mulai Rp 150rb" } ] } ] }

// varian menu-list — datar
{ "title": "…", "subtitle": "…",
  "items": [ { "name": "…", "desc": "…", "price": "…" } ] }
```

**pricing**
```jsonc
{ "title": "Paket Servis",
  "items": [ { "name": "Servis Reguler", "price": "Mulai Rp 250rb",
    "features": ["Ganti oli", "Cek rem"] } ] }
```

**booking — WAJIB punya `services` dan `success_message`**
```jsonc
{ "title": "Booking Servis", "subtitle": "…",
  "services": [ { "name": "Ganti Oli", "duration": "30-45 menit",
                  "price": "Mulai Rp 150rb" } ],   // minimal 1, `name` wajib
  "address": "…", "hours": "Senin-Sabtu, 08.00-19.00",
  "success_message": "Booking diterima!",           // WAJIB
  "forward_wa": "" }                                // nomor WA untuk kirim otomatis
```

**testimonials · gallery · location · faq · contact**
```jsonc
{ "title": "Kata Pelanggan",
  "items": [ { "name": "Rudi", "text": "…", "rating": 5 } ] }      // rating 1-5

{ "title": "Galeri Pekerjaan",
  "images": ["assets/galeri-01.jpg", "assets/galeri-02.jpg"] }

{ "title": "Kunjungi Kami", "address": "…", "note": "Parkir luas",
  "button_text": "Chat via WhatsApp", "button_link": "https://wa.me/628…",
  "hours": [ { "days": "Senin-Sabtu", "time": "08.00-19.00" } ] }

{ "title": "Sering Ditanyakan",
  "items": [ { "question": "…", "answer": "…" } ] }

{ "title": "Hubungi Kami", "subtitle": "…", "address": "…", "show_map": true }
```

**about · team · steps · cta · newsletter · divider · marquee**
```jsonc
{ "title": "…", "content": "…", "image": "assets/tim.jpg" }              // about
{ "title": "…", "members": [ { "name": "…", "role": "…",
                               "image": "assets/x.jpg" } ] }            // team
{ "title": "Cara Booking", "subtitle": "…",
  "items": [ { "title": "Langkah 1", "description": "…" } ] }            // steps
{ "title": "…", "text": "…", "cta_text": "…", "cta_link": "#booking" }  // cta
{ "title": "…", "subtitle": "…", "placeholder": "Email Anda",
  "button_text": "Daftar" }                                              // newsletter
{ "style": "solid", "color": "#cbd5e1" }          // solid|dashed|dotted // divider
{ "items": ["Promo 1", "Promo 2"] }                                     // marquee
```

### 5.4 Seed wajib lengkap

Seed section berbentuk:

```jsonc
{ "type": "menu_board", "variant": "menu-tabs", "anchorId": "layanan",
  "config": { …config lengkap di atas… } }
```

Sertakan **seluruh** key config di `config`. Sistem tidak menebak isinya, dan

---

## 6. Kontrak 9 Section Inti

Template **ditolak** bila salah satu tipe ini tidak ada di `sections`:

| # | Tipe | Dipakai untuk |
|---|---|---|
| 1 | `hero` | Identitas usaha di atas lipatan |
| 2 | `features` | Keunggulan / alasan memilih |
| 3 | `pricing` | Struktur harga atau paket |
| 4 | `booking` | Alur pemesanan / appointment |
| 5 | `testimonials` | Bukti sosial |
| 6 | `gallery` | Foto pekerjaan / produk |
| 7 | `location` | Alamat + jam buka |
| 8 | `faq` | Mencegah pertanyaan berulang |
| 9 | `contact` | Kanal kontak |

Sisanya (`about`, `steps`, `menu_board`, `cta`, `marquee`, `divider`,
`newsletter`, `team`, `video`) opsional — pakai bila relevan dengan niche.

### 6.1 Aturan `anchorId`

- Wajib **kebab-case** tanpa spasi: `layanan`, `harga-lengkap`.
- Wajib **unik** dalam satu template.
- Kalau `url` nav = `"#layanan"`, harus ada section ber-`anchorId: "layanan"`.
  Tanpa itu tautan menu tidak menuju ke mana pun.
- Section tanpa kebutuhan navigasi (mis. `divider`) boleh tanpa `anchorId`.

### Tabel 4 — `designStyleId` (TEPAT 10, dari `DESIGN_STYLES`)

| Nilai | Kesan |
|---|---|
| `minimalist` | Bersih, netral, aman untuk semua niche |
| `flat` | 2D datar, warna jelas, sudut tajam |
| `dark-mode` | **Latar gelap, aksen terang** — satu-satunya style gelap |
| `neo-brutalism` | Garis tebal, kontras keras, brutalis |
| `glassmorphism` | Kaca frosted, blur, efek cahaya |
| `organic` | Lembut, hangat, handmade |
| `retro` | Retro / vintage, bernuansa nostalgi |
| `typography` | Tipografi besar sebagai elemen utama |
| `parallax` | Latar bergeser saat scroll |
| `3d-immersive` | 3D & immersive |

> **Jangan mengarang id baru.** `terakota`, `hutan`, `laut`, `anggur`, `mono`
> **bukan** design style — itu color scheme / palet picker, kumpulan berbeda.
> Id yang tidak terdaftar akan ditolak dengan pesan
> `style <id> tak terdaftar`.

> **Catatan penting:** `designStyleId` hanya label gaya + bahan untuk panel
> pilihan warna. Yang benar-benar tampil di halaman adalah `paletteOverride`.
> Template gelap **wajib** memakai `paletteOverride` penuh (semua 8 warna),
> karena sebagian besar style bawaan bertema terang.

### Tabel 5 — Varian header

`standard`, `floating`, `hero-overlay`, `split-nav`, `with-topbar`, `glass`,
`minimal` — ketujuhnya benar-benar tersedia.

### Tabel 6 — Varian footer

`simple`, `columns`, `centered`, `minimal` — **empat ini saja**.
(`newsletter` dan `social` pernah ada di template bawaan tetapi tidak
merender berbeda dari `simple` — jangan dipakai.)

### Tabel 7 — `contentWidth` (lebar isi header)

| Nilai | Lebar |
|---|---|
| `full` | Mengikuti lebar layar (perilaku lama) |
| `6xl` | 1152px — **disarankan**, sama dengan footer & section hero |
| `5xl` | 1024px |
| `4xl` | 896px |

---

## 7. Kontrak Animasi

Dua jalur. **Pakai jalur deklaratif (§7.1) sedapat mungkin** — tidak butuh JS.

### 7.1 `animations[]` — deklaratif, tanpa JS

```jsonc
"animations": [
  { "id": "reveal-hero",
    "name": "Hero Fade Up",
    "type": "slide",                  // fade | slide | zoom | bounce | custom
    "duration": 700,                  // ms
    "delay": 0,                       // ms
    "easing": "cubic-bezier(.16,1,.3,1)",
    "trigger": "onLoad",              // onLoad | onScroll | onHover | onClick
    "target": "#beranda" }            // CSS selector — WAJIB
]
```

Sistem membuat `@keyframes` + kelas `.tpl-anim-<id>`, lalu menyalakannya sesuai
`trigger`:

| `trigger` | Efek |
|---|---|
| `onLoad` | Menyala setelah halaman dimuat |
| `onScroll` | `IntersectionObserver` — menyala sekali saat elemen masuk layar |
| `onHover` | Menyala saat kursor masuk elemen |
| `onClick` | Menyala saat elemen diklik |

`target` bisa berupa selector CSS valid apa pun — `#anchorId`, `#id .card`,
`main > div:nth-child(3)`, dan seterusnya. Gabung beberapa dengan koma.

Untuk `type: "custom"` isi `keyframes` sendiri:

### 7.3 Contoh script yang berguna

**Progress bar di atas halaman**
```js
(function () {
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;background:#c2410c;transition:width .1s linear';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });
})();
```

**Hitung mundur promo**
```js
(function () {
  var el = document.getElementById('promo');
  if (!el) return;
  var end = new Date(el.getAttribute('data-sampai')).getTime();
  setInterval(function () {
    var d = Math.max(0, end - Date.now());
    el.textContent = Math.floor(d / 86400000) + ' hari lagi';
  }, 60000);
})();
```

### 7.4 Batasan script

- Maksimal 100.000 karakter per script.
- Dijalankan **sekali** setelah halaman siap.
- Bungkus selalu dengan IIFE `"(function(){ … })();"` agar tidak bocor ke global.
- Hindari loop tak terbatas yang membebani CPU.

### 7.5 Pola yang otomatis DIBLOKIR

Script dan aset `.js`/`.css` disanitasi dua kali — saat import dan saat runtime.
Pola berikut diganti menjadi `// BLOCKED`:

```
eval(          Function(        new Function(
setTimeout("   setInterval("    document.write(   document.writeln(
window.location =     location.href =      <script>      </script>      on*= (atribut event)
```

Kalau scriptMU butuh salah satu pola di atas, **desain ulang** agar tidak
memakainya.

### 7.6 Catatan penting soal sanitasi

Ini **bukan sandbox**. Penapis cukup untuk template yang hanya masuk lewat akun
pemiliknya sendiri. Jangan pernah menyertakan kode yang membaca data pengguna,
mengirim permintaan jaringan ke pihak ketiga, atau memuat sumber daya dari luar.

---

## 8. Art Direction — Cookbook 8 Gaya

### 8.0 Langkah awal: jangan asal pilih palet

Dua template dengan palet sama tapi `customCss` berbeda akan terlihat **jauh**
berbeda. Urutan yang benar:

1. Tulis **1 kalimat design thesis** (contoh: "Bengkel teknis yang terasa
   seperti ruang kerja, bukan etalase").
2. Pilih **satu gaya** dari 8 resep di bawah.
3. Ikuti resep itu untuk `theme` **dan** `customCss`.
4. Baru tulis konten.

### 8.1 Hook wajib: `data-tpl-type` dan `data-tpl-variant`

Setiap section dibungkus elemen yang selalu membawa dua atribut ini:

```html
<div id="keunggulan" data-tpl-type="features" data-tpl-variant="features-3col" …>
  <div class="py-12 px-6">
    <h2>Judul</h2>
    <div class="grid …">
      <div class="p-6 rounded-lg text-center">kartu 1</div>
      <div class="p-6 rounded-lg text-center">kartu 2</div>
      <div class="p-6 rounded-lg text-center">kartu 3</div>
    </div>
  </div>
</div>
```

**Selalu menyasar `data-tpl-*`.** Jangan menyasar class Tailwind
(`@md:grid-cols-3`, `rounded-lg`) — itu bisa berubah tiap build dan CSS-mu
berhenti jalan tanpa error.

Struktur dalam yang bisa diandalkan:

| Menuju | Selector |
|---|---|
| Judul section | `[data-tpl-type="X"] > div > h2` |
| Wadah isi | `[data-tpl-type="X"] > div` |
| Kartu / item | `[data-tpl-type="X"] > div > div > div` |
| Kartu ke-N | `… > div:nth-child(N)` |
| Varian tertentu | `[data-tpl-variant="features-masonry"] …` |

### 8.2 `data.customCss` — kunci pembeda utama

Renderer **tidak pernah** menghasilkan `border`, `box-shadow`, `backdrop-filter`,
`clip-path`, `mask-image`, atau `filter` pada kartu section. Jadi semua gaya
modern di §8.3 **hanya bisa** dicapai lewat `customCss`.

```jsonc
"data": {
  "customCss": "[data-tpl-type=\"features\"] > div > div > div { border: 3px solid var(--color-text); }"
}
```

Aturan `customCss`:

- Maksimal **200.000 karakter**.
- Diblokir otomatis: `@import`, `url()` yang bukan `data:`, `expression(`,
  `-moz-binding`, `behavior:`, dan `</style>`.
- **Aset gambar tetap lewat `assets/`**, bukan `url()` di CSS — `url()` eksternal
  diblokir, jadi jangan tulis `background-image: url("https://…")`.
- Variabel warna tersedia: `--color-primary`, `--color-secondary`,
  `--color-accent`, `--color-background`, `--color-surface`, `--color-text`,
  `--color-text-muted`, `--color-border`, `--color-on-primary`, `--radius`,
  `--font-heading`, `--font-body`.


### 8.3 Resep per gaya

Setiap resep: **theme** (warna + komponen) lalu **customCss**.

**1) Minimalist UI**
```jsonc
"components": { "borderRadius": 2, "buttonStyle": "outline", "shadowStyle": "none" }
"palette": { "primary": "#111827", "background": "#ffffff", "surface": "#ffffff",
             "text": "#111827", "textMuted": "#6b7280" }
```
```css
[data-tpl-type="features"] > div > div > div {
  background: transparent;
  border: 1px solid var(--color-border);
  padding: 32px;
}
[data-tpl-type="hero"] h1 { letter-spacing: -.03em; line-height: 1.05; }
```
Tanpa `box-shadow` sama sekali — tenang dan old-school.

**2) Dark Mode / Cyberpunk**
```jsonc
"designStyleId": "dark-mode",
"palette": { "primary": "#22d3ee", "accent": "#f472b6", "background": "#08090f",
             "surface": "#12141f", "text": "#e8eaf2", "textMuted": "#9aa3c0" }
```
```css
[data-tpl-type="hero"] {
  background-image:
    linear-gradient(rgba(34,211,238,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,211,238,.08) 1px, transparent 1px);
  background-size: 46px 46px;
}
[data-tpl-type="hero"] a[href="#booking"] {
  box-shadow: 0 0 22px rgba(34,211,238,.55);
  text-shadow: 0 0 14px currentColor;
}
```

**3) Glassmorphism**
```css
[data-tpl-type="menu_board"] > div > div,
[data-tpl-type="features"] > div > div > div,
[data-tpl-type="pricing"] > div > div > div {
  background: rgba(255,255,255,.10);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.20);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,.28);
}
```
Butuh latar berwarna atau bergambar di belakang supaya efek kacanya terlihat.

**4) Neo-Brutalism**
```jsonc
"components": { "borderRadius": 0, "buttonStyle": "solid", "shadowStyle": "lg" }
"effects": { "borderWidth": 2, "uppercaseHeadings": true }
```
```css
[data-tpl-type="features"] > div > div > div,
[data-tpl-type="pricing"] > div > div > div {
  border: 3px solid var(--color-text);
  border-radius: 0;
  box-shadow: 8px 8px 0 var(--color-accent);
  transition: transform .15s ease, box-shadow .15s ease;
}
[data-tpl-type="features"] > div > div > div:hover {
  transform: translate(4px, 4px);
  box-shadow: 4px 4px 0 var(--color-accent);
}
```

**5) Neomorphism**
```jsonc
"palette": { "background": "#e0e5ec", "surface": "#e0e5ec", "text": "#2c3444" }
```
```css
[data-tpl-type="features"] > div > div > div,
[data-tpl-type="pricing"] > div > div > div {
  border-radius: 22px;
  background: var(--color-surface);
  box-shadow: 9px 9px 18px rgba(160,170,190,.55),
             -9px -9px 18px rgba(255,255,255,.85);
}
```
Neumorphism **butuh** latar dan kartu berwarna sama — kalau tidak, efeknya hilang.

**6) Claymorphism**
```css
[data-tpl-type="menu_board"] > div > div {
  border-radius: 28px;
  background: linear-gradient(145deg, #ff9a76, #ff6a88);
  box-shadow: 10px 10px 22px rgba(0,0,0,.18),
             inset 4px 4px 10px rgba(255,255,255,.55),
             inset -4px -4px 10px rgba(0,0,0,.14);
  color: #fff;
}
```

---

## 9. Checklist Sebelum Mengembalikan ZIP

- [ ] `template.json` ada **di root** ZIP, dan berisi key `theme`
- [ ] `sections` berupa array **non-kosong**
- [ ] Semua 9 section inti ada: hero, features, pricing, booking, testimonials,
      gallery, location, faq, contact
- [ ] Tiap `type` dan `variant` ada di Tabel 2 — ejaan diperiksa per karakter
- [ ] Setiap section punya `config` **lengkap** (§5.4)
- [ ] `anchorId` unik; tiap `url` nav (`#…`) punya section dengan anchor cocok
- [ ] `booking` punya `services` (≥1, semua punya `name`) dan `success_message`
- [ ] `footer.text` memuat `{year}`
- [ ] `header.navItems` non-kosong dan `header.ctaText` terisi
- [ ] `seo.title` dan `seo.description` terisi
- [ ] Palet lolos kontras 4.5:1 — cek `textMuted` di atas `background` **dan** `surface`
- [ ] `designStyleId` ada di Tabel 4 (hanya 10; `mono`/`hutan`/`laut` bukan style)
- [ ] **`customCss` diisi** dan menyasar `data-tpl-type`/`data-tpl-variant`,
      bukan class Tailwind
- [ ] `customCss` bebas `@import`, `url()` eksternal, `</style>`, `expression(`,
      `-moz-binding`
- [ ] Tidak menyet `effects.glassmorphism` / `effects.gradientBackgrounds`
      (tidak diimplementasikan — menyetnya hanya berbohong)
- [ ] Aset gambar lewat `assets/`, bukan `url()` di dalam CSS
- [ ] Nama aset memakai ekstensi yang diizinkan dan berada di `assets/`
- [ ] Nama font benar-benar ada di Google Fonts
- [ ] `category` sesuai niche
- [ ] Tidak memakai `product_grid`
- [ ] Script animasi tidak memakai pola terlarang (§7.5)
- [ ] ZIP bisa dibuka dan `template.json` valid JSON

---

## 10. Contoh Referensi

Repository ini menyediakan contoh yang **dijamin lolos seluruh kontrak**:

```bash
# Bangun ZIP dari template bengkel bawaan
bun scripts/build-template-zip.ts bengkel dist/template-bengkel.zip
```

Contoh itu berisi 12 section (9 inti + `menu_board` + `steps` + `marquee`),
7 animasi deklaratif (termasuk stagger 0/110/220 ms), 1 behaviour script, 2 aset
lokal, dan `customCss` sepanjang ~1.800 karakter berisi wave divider, neon glow,
tekstur grid, dan hover lift. Gunakan sebagai kerangka saat menyusun
`template.json` milikmu sendiri — terutama bagian `customCss`, karena di situlah
karakter visual sebuah template benar-benar tinggal.


```jsonc
{ "id": "spin", "type": "custom", "duration": 900, "easing": "linear",
  "trigger": "onScroll", "target": "#galeri",
  "keyframes": "from{transform:rotate(0)}to{transform:rotate(360deg)}" }
```

Nilai `keyframes` boleh blok `@keyframes` utuh, atau isi keyframe saja seperti
di atas.

Runtime otomatis menambahkan blok `prefers-reduced-motion`, sehingga animasi
tetap aman untuk pengguna yang membatasi motion di sistemnya.

### 7.2 `behaviours[]` — JS untuk kasus khusus

```jsonc
"behaviours": [
  { "id": "scroll-progress",
    "name": "Progress Bar Scroll",
    "type": "custom",
    "trigger": "onLoad",
    "target": "body",
    "script": "(function(){ … })();" }
]
```

Boleh juga ditulis sebagai file terpisah di `behaviours/nama.json` — keduanya
dibaca. `meta.json` dilewati.


**7) Outline / Skeletal UI**
```css
[data-tpl-type="features"] > div > div > div {
  background: transparent;
  border: 2px solid var(--color-text);
  border-radius: 10px;
}
[data-tpl-type="gallery"] > div > div > div {
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: 10px;
  min-height: 180px;
}
```
Shimmer-nya lewat `animations[]`: `keyframes: "from{opacity:.35}to{opacity:1}"`,
`trigger: "onScroll"`.

**8) Bento Grid**
```css
[data-tpl-type="features"] > div > div {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 16px;
}
[data-tpl-type="features"] > div > div > div:nth-child(1) { grid-column: span 4; grid-row: span 2; }
[data-tpl-type="features"] > div > div > div:nth-child(2) { grid-column: span 2; }
[data-tpl-type="features"] > div > div > div:nth-child(3) { grid-column: span 2; }
```

### 8.4 Teknik lintas gaya

**Wave / curved divider** — memotong satu section supaya menyatu ke berikutnya:

```css
[data-tpl-type="hero"] { clip-path: ellipse(78% 88% at 50% 0%); margin-bottom: -58px; }
[data-tpl-type="features"] { padding-top: 108px; }
```

**Gradient text**

```css
[data-tpl-type="hero"] h1 {
  background: linear-gradient(92deg, var(--color-text), var(--color-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

**Parallax** — harus lewat `behaviours[].script`, karena CSS murni tidak bisa
membaca posisi scroll:

```js
(function () {
  var el = document.querySelector('[data-tpl-type="hero"]');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > 900) return;
    el.style.transform = 'translateY(' + (y * 0.18) + 'px)';
  }, { passive: true });
})();
```

**Background berbeda per section** — dua cara:

```jsonc
// (a) lewat style section, tanpa CSS sama sekali
{ "type": "hero", "style": { "background": "gradient",
    "backgroundGradient": "linear-gradient(135deg, #0b1220, #7c2d12)" } }
```

```css
/* (b) lewat customCss */
[data-tpl-type="features"] { background: var(--color-surface); }
[data-tpl-type="gallery"]  { background: var(--color-background); }
```

**Stagger on scroll** — untuk menghidupkan deretan kartu:

```jsonc
{ "id": "s1", "type": "slide", "duration": 620, "delay": 0,   "trigger": "onScroll",
  "target": "#keunggulan .grid > div:nth-child(1)" }
{ "id": "s2", "type": "slide", "duration": 620, "delay": 110, "trigger": "onScroll",
  "target": "#keunggulan .grid > div:nth-child(2)" }
{ "id": "s3", "type": "slide", "duration": 620, "delay": 220, "trigger": "onScroll",
  "target": "#keunggulan .grid > div:nth-child(3)" }
```

### 8.5 Kesalahan yang membuat template terlihat monoton

| Kesalahan | Akibat |
|---|---|
| Tidak pakai `customCss` sama sekali | Semua template jadi "kartu putih + teks" |
| Hanya ganti palet | Terlihat sama dengan template lain |
| `effects.glassmorphism` / `gradientBackgrounds` di-set | **Tidak ada efek apa pun** — kunci itu tidak diimplementasikan |
| `borderRadius` selalu di tengah (8–16) | Tidak ada karakter |
| Semua section pakai varian yang sama | Ritme monoton |
| Menyasar class Tailwind di CSS | Berhenti jalan diam-diam saat build berubah |
| Terlalu banyak animasi sekaligus | Teriak, bukan grotesk |

> Hanya **2 dari 4** kunci `effects` yang benar-benar berfungsi:
> `uppercaseHeadings` dan `borderWidth`. `glassmorphism` dan
> `gradientBackgrounds` **tidak dibaca renderer mana pun** — jangan di-set.

`config` kosong menghasilkan section kosong.
