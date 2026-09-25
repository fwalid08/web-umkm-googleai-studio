"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Eye,
  Check,
  Trash2,
  Edit3,
  Globe,
  Store,
  ExternalLink,
  Shield,
  HelpCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantUrl, tenantDisplay } from "@/lib/urls";

interface StorePageItem {
  id: string;
  title: string;
  slug: string;
  type: "standard" | "legal" | "contact" | "faq";
  is_published: boolean;
  content: string;
  updated_at: string;
}

const DEFAULT_PAGES: StorePageItem[] = [
  {
    id: "about-us",
    title: "Tentang Toko Kami",
    slug: "tentang-kami",
    type: "standard",
    is_published: true,
    content:
      "Selamat datang di toko resmi kami! Kami adalah UMKM lokal yang berkomitmen menyediakan produk berkualitas tinggi dengan harga ramah di kantong. Semua pesanan dibuat dengan teliti dan dikirim dengan aman ke seluruh penjuru Nusantara.",
    updated_at: "Hari ini",
  },
  {
    id: "contact-hours",
    title: "Kontak, Lokasi & Jam Operasional",
    slug: "kontak-kami",
    type: "contact",
    is_published: true,
    content:
      "Alamat: Jl. Raya Pasar Baru No. 12\nJam Buka: Setiap Hari (08.00 - 20.00 WIB)\nLayanan WhatsApp CS: Siap membalas dalam hitungan menit untuk konsultasi pesanan dan konfirmasi pembayaran.",
    updated_at: "Kemarin",
  },
  {
    id: "terms-refund",
    title: "Syarat Ketentuan & Kebijakan Pengembalian",
    slug: "kebijakan-toko",
    type: "legal",
    is_published: true,
    content:
      "1. Garansi pengembalian atau kirim ulang jika produk rusak saat pengiriman (wajib menyertakan video unboxing).\n2. Pembatalan pesanan dapat dilakukan sebelum barang diserahkan ke kurir.\n3. Pembayaran aman terverifikasi via QRIS, Transfer Bank, atau COD.",
    updated_at: "3 hari lalu",
  },
  {
    id: "faq-guide",
    title: "Panduan Pemesanan & FAQ",
    slug: "bantuan-faq",
    type: "faq",
    is_published: false,
    content:
      "Q: Bagaimana cara pesan?\nA: Pilih produk dari katalog, masukkan jumlah pesanan, lalu klik 'Beli via WhatsApp' untuk langsung terhubung dengan admin kami.",
    updated_at: "1 minggu lalu",
  },
];

export default function StorePagesPage() {
  const { t } = useLang();
  const [pages, setPages] = useState<StorePageItem[]>([]);
  const [activeSite, setActiveSite] = useState<{ id: string; name: string; subdomain: string } | null>(null);
  const [editingPage, setEditingPage] = useState<StorePageItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState("");

  // Form states for adding/editing
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPublished, setFormPublished] = useState(true);

  useEffect(() => {
    // Load active website
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites?.length > 0) {
          const list = json.data.websites;
          const site = list.find((s: any) => s.id === json.data.active_website_id) ?? list[0];
          setActiveSite(site);

          const storageKey = `umkm_pages_${site.id}`;
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              setPages(JSON.parse(saved));
            } catch {
              setPages(DEFAULT_PAGES);
            }
          } else {
            setPages(DEFAULT_PAGES);
            localStorage.setItem(storageKey, JSON.stringify(DEFAULT_PAGES));
          }
        }
      } catch {
        setPages(DEFAULT_PAGES);
      }
    })();
  }, []);

  function savePagesToStorage(newPages: StorePageItem[]) {
    setPages(newPages);
    if (activeSite) {
      localStorage.setItem(`umkm_pages_${activeSite.id}`, JSON.stringify(newPages));
    }
  }

  function handleTogglePublish(id: string) {
    const updated = pages.map((p) =>
      p.id === id ? { ...p, is_published: !p.is_published, updated_at: "Baru saja" } : p
    );
    savePagesToStorage(updated);
    notify("Status publikasi halaman diperbarui");
  }

  function handleDeletePage(id: string) {
    if (!confirm("Hapus halaman ini dari toko Anda?")) return;
    const updated = pages.filter((p) => p.id !== id);
    savePagesToStorage(updated);
    notify("Halaman berhasil dihapus");
  }

  function startEdit(page: StorePageItem) {
    setEditingPage(page);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormContent(page.content);
    setFormPublished(page.is_published);
    setIsAdding(false);
  }

  function startAdd() {
    setEditingPage(null);
    setFormTitle("");
    setFormSlug("");
    setFormContent("");
    setFormPublished(true);
    setIsAdding(true);
  }

  function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const slug = formSlug.trim()
      ? formSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : formTitle.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (editingPage) {
      const updated = pages.map((p) =>
        p.id === editingPage.id
          ? {
              ...p,
              title: formTitle.trim(),
              slug,
              content: formContent.trim(),
              is_published: formPublished,
              updated_at: "Baru saja",
            }
          : p
      );
      savePagesToStorage(updated);
      notify(`Halaman "${formTitle}" berhasil disimpan`);
    } else {
      const newPage: StorePageItem = {
        id: "page-" + Date.now(),
        title: formTitle.trim(),
        slug,
        type: "standard",
        content: formContent.trim(),
        is_published: formPublished,
        updated_at: "Baru saja",
      };
      savePagesToStorage([...pages, newPage]);
      notify(`Halaman "${formTitle}" berhasil ditambahkan`);
    }

    setEditingPage(null);
    setIsAdding(false);
  }

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  }

  const liveStoreUrl = activeSite?.subdomain ? tenantUrl(activeSite.subdomain) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Halaman Info Toko
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Buat halaman informasi penting seperti Tentang Toko, Jam Buka, Syarat Pengembalian, dan
            FAQ untuk meningkatkan kepercayaan calon pembeli.
          </p>
        </div>

        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Halaman Baru</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-xs flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Editor Modal / Drawer */}
      {(editingPage || isAdding) && (
        <div className="bg-white border-2 border-emerald-600 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>{isAdding ? "Tambah Halaman Baru" : `Edit Halaman: ${editingPage?.title}`}</span>
            </h3>
            <button
              onClick={() => {
                setEditingPage(null);
                setIsAdding(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕ Batal
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Halaman:</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Tentang Brand Kami"
                  required
                  className="w-full text-xs border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alamat URL Slug:
                </label>
                <div className="flex items-center">
                  <span className="text-xs bg-gray-50 border border-r-0 border-gray-300 px-3 py-2.5 text-gray-400 rounded-l-xl font-mono">
                    /p/
                  </span>
                  <input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="tentang-kami"
                    className="w-full text-xs border border-gray-300 rounded-r-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Isi Konten Halaman:
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                placeholder="Tuliskan isi cerita brand, informasi kontak, jam buka toko, atau kebijakan refund..."
                className="w-full text-xs border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Publikasikan langsung di website toko</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPage(null);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  Simpan Halaman
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Pages Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Daftar Halaman Toko ({pages.length})</h3>
          <span className="text-xs text-gray-400">
            {pages.filter((p) => p.is_published).length} Tayang di Toko
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {pages.map((page) => (
            <div
              key={page.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{page.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      page.is_published
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {page.is_published ? "● Tayang" : "○ Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                  <span>/p/{page.slug}</span>
                  <span>·</span>
                  <span className="font-sans">Diperbarui {page.updated_at}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 max-w-xl font-sans mt-0.5">
                  {page.content}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(page.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                    page.is_published
                      ? "border-gray-200 text-gray-600 hover:bg-gray-100"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {page.is_published ? "Ubah ke Draft" : "Tayangkan"}
                </button>
                <button
                  onClick={() => startEdit(page)}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700"
                  title="Edit Halaman"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="p-2 border border-red-100 rounded-xl hover:bg-red-50 text-red-600"
                  title="Hapus Halaman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
