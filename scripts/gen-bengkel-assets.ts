/**
 * Generate aset gambar untuk template bengkel.
 *
 * Dipakai untuk membuktikan jalur `assets/` pada template ZIP: file lokal di
 * dalam ZIP → diunggah ke storage → path di `template.json` ditulis ulang jadi
 * URL. Jalur itu belum pernah diuji template bawaan mana pun.
 *
 * Pakai: bun scripts/gen-bengkel-assets.ts
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const OUT_DIR = "dist/bengkel-assets";

/** Logo: kotak oranye high-vis dengan inisial "BJ" sederhana. */
async function makeLogo(file: string) {
  const size = 256;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#f97316"/>
    <rect x="14" y="14" width="${size - 28}" height="${size - 28}" fill="none" stroke="#0b1220" stroke-width="6"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="bold"
      fill="#0b1220">BJ</text>
    <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold"
      letter-spacing="4" fill="#0b1220">MOTOR</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

/**
 * Latar galeri: pola diagonal gelap (baja/oli). Sengaja abstrak, bukan foto
 * stok — section ini dipakai sebagai `background: "image"` di belakang overlay
 * gelap 70%, jadi yang penting adalah teksturnya, bukan objeknya.
 */
async function makeWorkshopBg(file: string) {
  const w = 1600;
  const h = 900;
  const stripes: string[] = [];
  for (let i = -h; i < w + h; i += 64) {
    stripes.push(`<polygon points="${i},${h} ${i + 32},${h} ${i + 32 + h},0 ${i + h},0" fill="#16233a"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1220"/>
        <stop offset="55%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#7c2d12"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <g opacity="0.55">${stripes.join("")}</g>
    <circle cx="${w * 0.78}" cy="${h * 0.3}" r="150" fill="#f97316" opacity="0.18"/>
    <circle cx="${w * 0.18}" cy="${h * 0.78}" r="110" fill="#fbbf24" opacity="0.12"/>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(file);
}

mkdirSync(OUT_DIR, { recursive: true });
const logo = `${OUT_DIR}/logo-bengkel.png`;
const workshop = `${OUT_DIR}/workshop-bengkel.jpg`;
await makeLogo(logo);
await makeWorkshopBg(workshop);
console.log(`OK  ${logo}`);
console.log(`OK  ${workshop}`);
