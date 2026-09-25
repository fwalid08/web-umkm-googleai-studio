"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  Search,
  MessageCircle,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Tag,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { tenantUrl } from "@/lib/urls";

interface Product {
  id: string;
  index: number;
  name: string;
  price: number;
  description: string;
  category: string;
  available: boolean;
}

export default function ProductsPage() {
  const { t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [websiteName, setWebsiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("Umum");
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/products");
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setWebsiteName(json.data.website_name || "Toko Utama");
      } else {
        setError(json.error || "Gagal memuat produk");
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const openAddModal = () => {
    setEditIndex(null);
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormCat("Umum");
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditIndex(p.index);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormDesc(p.description);
    setFormCat(p.category || "Umum");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    try {
      if (editIndex != null) {
        // Edit existing
        const res = await fetch("/api/user/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            index: editIndex,
            name: formName.trim(),
            price: Number(formPrice),
            description: formDesc.trim(),
            category: formCat.trim() || "Umum",
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.products) {
          setProducts(json.data.products);
          setModalOpen(false);
        }
      } else {
        // Add new
        const res = await fetch("/api/user/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            price: Number(formPrice),
            description: formDesc.trim(),
            category: formCat.trim() || "Umum",
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.products) {
          setProducts(json.data.products);
          setModalOpen(false);
        }
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (index: number, current: boolean) => {
    try {
      const res = await fetch("/api/user/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index,
          available: !current,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.products) {
        setProducts(json.data.products);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm("Hapus produk ini dari toko?")) return;
    try {
      const res = await fetch(`/api/user/products?index=${index}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success && json.data?.products) {
        setProducts(json.data.products);
      }
    } catch {
      // ignore
    }
  };

  const testWaLink = (product: Product) => {
    const text = encodeURIComponent(
      `Halo, saya ingin memesan ${product.name} (Rp ${product.price.toLocaleString("id-ID")}). Apakah produk masih tersedia?`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Katalog Produk</h1>
            <span className="text-xs text-gray-500 font-medium">· {websiteName}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Kelola menu makanan, minuman, barang jualan, dan stok yang tampil di website tokomu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-gray-200/80 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Produk</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200/80 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Produk Siap Jual</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {products.filter((p) => p.available).length}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 p-4 bg-white border border-gray-200/80 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Rata-rata Harga</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {products.length > 0
              ? `Rp ${Math.round(
                  products.reduce((acc, p) => acc + p.price, 0) / products.length
                ).toLocaleString("id-ID")}`
              : "Rp 0"}
          </p>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau deskripsi..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Memuat katalog produk...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Store className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">
              {search || selectedCategory !== "all" ? "Produk tidak ditemukan" : "Belum ada produk"}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== "all"
                ? "Coba gunakan kata kunci pencarian lain atau pilih kategori Semua."
                : "Mulai tambahkan menu atau barang jualan tokomu agar pelanggan dapat langsung memesan via WhatsApp."}
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk Pertama
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-gray-200/90 hover:border-emerald-300 rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-snug">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{prod.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          prod.available ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prod.available ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {prod.available ? "Tersedia" : "Stok Habis"}
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-gray-900 shrink-0">
                    Rp {prod.price.toLocaleString("id-ID")}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {prod.description || "Tidak ada deskripsi tambahan."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <a
                  href={testWaLink(prod)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Tes WA</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleAvailable(prod.index, prod.available)}
                    title={prod.available ? "Tandai habis" : "Tandai tersedia"}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      prod.available
                        ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {prod.available ? "Habis?" : "Aktifkan"}
                  </button>

                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit produk"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(prod.index)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Produk */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editIndex != null ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Produk / Menu *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Aren Spesial"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Contoh: 18000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    placeholder="Minuman, Makanan, dsb"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi Singkat Produk
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Bahan baku pilihan, rasa mantap, cocok dinikmati saat santai..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
