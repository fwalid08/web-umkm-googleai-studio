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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Halaman Info Toko
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Buat halaman informasi penting seperti Tentang Toko, Jam Buka, Syarat Pengembalian, dan
            FAQ untuk meningkatkan kepercayaan calon pembeli.
          </p>
        </div>

        <Button onClick={startAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Tambah Halaman Baru</span>
        </Button>
      </div>

      {notification && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog
        open={editingPage !== null || isAdding}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPage(null);
            setIsAdding(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>{isAdding ? "Tambah Halaman Baru" : `Edit Halaman: ${editingPage?.title}`}</span>
            </DialogTitle>
            <DialogDescription>
              Halaman info tampil di toko online Anda (mis. /p/tentang-kami).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="page-title">Judul Halaman:</Label>
                <Input
                  id="page-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Tentang Brand Kami"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page-slug">
                  Alamat URL Slug:
                </Label>
                <div className="flex items-center">
                  <span className="text-sm bg-gray-50 border border-r-0 border-gray-300 px-3 py-2 text-gray-400 rounded-l-lg font-mono h-10 flex items-center">
                    /p/
                  </span>
                  <Input
                    id="page-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="tentang-kami"
                    className="rounded-l-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-content">
                Isi Konten Halaman:
              </Label>
              <Textarea
                id="page-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                placeholder="Tuliskan isi cerita brand, informasi kontak, jam buka toko, atau kebijakan refund..."
                className="leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="page-published"
                  checked={formPublished}
                  onCheckedChange={setFormPublished}
                />
                <Label htmlFor="page-published" className="text-sm font-medium cursor-pointer">
                  Publikasikan langsung di website toko
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingPage(null);
                    setIsAdding(false);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Halaman
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pages Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 py-4">
          <CardTitle className="text-sm">Daftar Halaman Toko ({pages.length})</CardTitle>
          <span className="text-xs text-gray-400">
            {pages.filter((p) => p.is_published).length} Tayang di Toko
          </span>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-gray-100">
          {pages.map((page) => (
            <div
              key={page.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{page.title}</h4>
                  <Badge variant={page.is_published ? "success" : "secondary"} className="text-xs">
                    {page.is_published ? "● Tayang" : "○ Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                  <span>/p/{page.slug}</span>
                  <span>·</span>
                  <span className="font-sans">Diperbarui {page.updated_at}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1 max-w-xl mt-0.5">
                  {page.content}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 mr-1">
                  <Switch
                    checked={page.is_published}
                    onCheckedChange={() => handleTogglePublish(page.id)}
                    aria-label={page.is_published ? `Ubah ${page.title} ke draft` : `Tayangkan ${page.title}`}
                  />
                  <span className="text-xs text-gray-500 hidden lg:inline">
                    {page.is_published ? "Tayang" : "Draft"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => startEdit(page)}
                  className="h-8 w-8"
                  title="Edit Halaman"
                  aria-label={`Edit ${page.title}`}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeletePage(page.id)}
                  className="h-8 w-8 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                  title="Hapus Halaman"
                  aria-label={`Hapus ${page.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
