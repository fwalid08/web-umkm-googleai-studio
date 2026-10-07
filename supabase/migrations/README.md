# Migrations — Squashed Baseline (2026-10-07)

Menggantikan 54 file lama (`000`–`053`, diarsip di `../migrations_archive/`)
yang sekarang menjadi 9 file bersih. End-state skema **identik** (terverifikasi
via dump-diff remote).

| # | File | Isi |
|---|------|-----|
| 001 | `extensions.sql` | extensions + `uuid_generate_v4()` wrapper |
| 002 | `tables.sql` | 46 tabel (nama prefix final, kolom final). Tanpa rename, tanpa tabel mati |
| 003 | `views.sql` | 12 compat views nama lama — **DEPRECATED**, hanya untuk kode lama (170+ query masih pakai nama lama). Kode baru wajib pakai tabel prefix. Hapus hanya setelah migrasi kode selesai |
| 004 | `routines.sql` | 7 functions + 9 triggers |
| 005 | `constraints_indexes.sql` | FK constraints + 125 indexes |
| 006 | `rls.sql` | ENABLE RLS + 57 policies |
| 007 | `grants.sql` | ownership, grants, comments |
| 008 | `storage.sql` | bucket `product-images` + storage policies |
| 009 | `seed.sql` | seed sistem modul (18 features, pack `online_shop_pack`, matriks harga) |

## Dihapus (deprecated, tidak ada di skema final)

- Tabel mati: `bookings`, `navigation_groups/items`, `layout_nodes`, `design_styles`, `templates_library`
- Rename dance: `products`→`prod_products`, `orders`→`ord_orders`, dll. (langsung nama final)
- Seed basi: `002/017/019` (kolom lama `product_name`, `total_amount`, tabel `templates`) — **demo-login perlu re-seed baru** (follow-up)

## Aturan

- Jangan edit nomor/urutan file tanpa reset DB.
- `scripts/sync-module-migrations.mjs` **deprecated** — jangan `--apply`.
- Migrasi baru: lanjutkan penomoran dari `010_*.sql`.
