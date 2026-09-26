# Cron: Verifikasi Custom Domain

Endpoint: `POST /api/domains/verify` — cek DNS TXT `_saas-verify.<domain>`
untuk website dengan `custom_domain_verified = false`, tiap **5 menit**.

Auth: header `x-cron-secret: <CRON_SECRET>` **atau** query `?secret=<CRON_SECRET>`.
Tanpa secret yang cocok → `401`. `CRON_SECRET` wajib di-set di env server.

## 1. Vercel Cron (vercel.json sudah disediakan)

`vercel.json` di repo:

```json
{ "crons": [{ "path": "/api/domains/verify", "schedule": "*/5 * * * *", "method": "POST" }] }
```

> ⚠️ **Keterbatasan Vercel Cron: tidak mendukung custom headers.**
> Artinya cron bawaan Vercel TIDAK bisa mengirim `x-cron-secret`,
> sehingga request-nya akan ditolak `401` kecuali pakai fallback query.
>
> **Cara set agar jalan di Vercel:**
> 1. Buka Vercel Dashboard → Project → Settings → Cron Jobs (atau tab Cron).
> 2. Cari job `/api/domains/verify`, ubah **Path** menjadi:
>    `/api/domains/verify?secret=<isi CRON_SECRET prod>`
>    (ambil nilainya dari Project → Settings → Environment Variables → `CRON_SECRET`).
> 3. Pastikan schedule `*/5 * * * *` dan method `POST`. Save.
>
> Catatan: query `?secret=` bisa tercatat di access log — itu trade-off yang
> diterima khusus untuk Vercel Cron. Untuk keamanan maksimal pakai opsi 2/3
> (header) sebagai pemicu utama dan Vercel Cron hanya sebagai cadangan.

## 2. Scheduler eksternal + header (disarankan, paling aman)

Pakai cron-job.org / EasyCron / GitHub Actions dengan header:

```bash
curl -X POST "https://<domain-prod>/api/domains/verify" \
  -H "x-cron-secret: $CRON_SECRET"
```

Contoh GitHub Actions (tiap 5 menit):

```yaml
- run: |
    curl -sf -X POST "$APP_URL/api/domains/verify" \
      -H "x-cron-secret: $CRON_SECRET"
```

## 3. Test manual

```bash
# Sukses (header)
curl -X POST "http://localhost:3000/api/domains/verify" \
  -H "x-cron-secret: $CRON_SECRET"

# Sukses (fallback query — cara Vercel Cron)
curl -X POST "http://localhost:3000/api/domains/verify?secret=$CRON_SECRET"

# Harus 401 (tanpa secret)
curl -X POST "http://localhost:3000/api/domains/verify"
```

Respons sukses:

```json
{ "success": true, "verified": 1, "total_checked": 3, "results": [...] }
```

## Checklist env

- `CRON_SECRET` ter-set di `.env.local` (dev) dan Vercel Project Env (prod).
  Lihat `.env.example`. Generate: `openssl rand -hex 32`.
