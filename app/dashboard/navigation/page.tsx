"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Trash2,
  Edit3,
  Check,
  Store,
  ExternalLink,
  ArrowUpDown,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantUrl, tenantDisplay } from "@/lib/urls";

interface NavItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  enabled: boolean;
}

const DEFAULT_HEADER_LINKS: NavItem[] = [
  { id: "nav-1", label: "Beranda", url: "/", isExternal: false, enabled: true },
  { id: "nav-2", label: "Katalog Produk", url: "#products", isExternal: false, enabled: true },
  { id: "nav-3", label: "Promo Bulan Ini", url: "#promo", isExternal: false, enabled: true },
  { id: "nav-4", label: "Tentang Kami", url: "/p/tentang-kami", isExternal: false, enabled: true },
  { id: "nav-5", label: "Kontak CS", url: "/p/kontak-kami", isExternal: false, enabled: true },
];

const DEFAULT_FOOTER_LINKS: NavItem[] = [
  { id: "foot-1", label: "Kebijakan Toko & Garansi", url: "/p/kebijakan-toko", isExternal: false, enabled: true },
  { id: "foot-2", label: "Panduan Pemesanan / FAQ", url: "/p/bantuan-faq", isExternal: false, enabled: true },
  { id: "foot-3", label: "WhatsApp Layanan Pelanggan", url: "https://wa.me/", isExternal: true, enabled: true },
];

export default function StoreNavigationPage() {
  const { t } = useLang();
  const [headerLinks, setHeaderLinks] = useState<NavItem[]>(DEFAULT_HEADER_LINKS);
  const [footerLinks, setFooterLinks] = useState<NavItem[]>(DEFAULT_FOOTER_LINKS);
  const [activeSite, setActiveSite] = useState<{ id: string; name: string; subdomain: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"header" | "footer">("header");
  const [editingItem, setEditingItem] = useState<{ item: NavItem; type: "header" | "footer" } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites?.length > 0) {
          const list = json.data.websites;
          const site = list.find((s: any) => s.id === json.data.active_website_id) ?? list[0];
          setActiveSite(site);

          const savedHeader = localStorage.getItem(`umkm_nav_head_${site.id}`);
          const savedFooter = localStorage.getItem(`umkm_nav_foot_${site.id}`);
          if (savedHeader) {
            try {
              setHeaderLinks(JSON.parse(savedHeader));
            } catch {}
          }
          if (savedFooter) {
            try {
              setFooterLinks(JSON.parse(savedFooter));
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  function saveHeader(items: NavItem[]) {
    setHeaderLinks(items);
    if (activeSite) {
      localStorage.setItem(`umkm_nav_head_${activeSite.id}`, JSON.stringify(items));
    }
  }

  function saveFooter(items: NavItem[]) {
    setFooterLinks(items);
    if (activeSite) {
      localStorage.setItem(`umkm_nav_foot_${activeSite.id}`, JSON.stringify(items));
    }
  }

  function toggleLink(id: string, type: "header" | "footer") {
    if (type === "header") {
      const updated = headerLinks.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it));
      saveHeader(updated);
    } else {
      const updated = footerLinks.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it));
      saveFooter(updated);
    }
    notify("Status menu diperbarui");
  }

  function deleteLink(id: string, type: "header" | "footer") {
    if (!confirm("Hapus tautan menu ini?")) return;
    if (type === "header") {
      saveHeader(headerLinks.filter((it) => it.id !== id));
    } else {
      saveFooter(footerLinks.filter((it) => it.id !== id));
    }
    notify("Menu berhasil dihapus");
  }

  function moveItem(index: number, direction: "up" | "down", type: "header" | "footer") {
    const list = type === "header" ? [...headerLinks] : [...footerLinks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    if (type === "header") saveHeader(list);
    else saveFooter(list);
  }

  function startEdit(item: NavItem, type: "header" | "footer") {
    setEditingItem({ item, type });
    setFormLabel(item.label);
    setFormUrl(item.url);
    setIsAdding(false);
  }

  function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formLabel.trim() || !formUrl.trim()) return;

    if (editingItem) {
      const { item, type } = editingItem;
      if (type === "header") {
        saveHeader(
          headerLinks.map((it) =>
            it.id === item.id ? { ...it, label: formLabel.trim(), url: formUrl.trim() } : it
          )
        );
      } else {
        saveFooter(
          footerLinks.map((it) =>
            it.id === item.id ? { ...it, label: formLabel.trim(), url: formUrl.trim() } : it
          )
        );
      }
      notify("Tautan menu berhasil diperbarui");
    } else {
      const newItem: NavItem = {
        id: "nav-" + Date.now(),
        label: formLabel.trim(),
        url: formUrl.trim(),
        isExternal: formUrl.startsWith("http"),
        enabled: true,
      };
      if (activeTab === "header") {
        saveHeader([...headerLinks, newItem]);
      } else {
        saveFooter([...footerLinks, newItem]);
      }
      notify("Tautan menu baru berhasil ditambahkan");
    }

    setEditingItem(null);
    setIsAdding(false);
  }

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  }

  const currentList = activeTab === "header" ? headerLinks : footerLinks;
  const liveStoreUrl = activeSite?.subdomain ? tenantUrl(activeSite.subdomain) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Menu Navigasi Toko
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Atur tautan menu yang tampil di header dan footer toko online Anda untuk mempermudah
            pengunjung mencari produk dan informasi.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormLabel("");
            setFormUrl("");
            setIsAdding(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tautan Menu</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-xs flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs Switcher: Header vs Footer */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("header");
            setIsAdding(false);
            setEditingItem(null);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "header"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Menu Utama (Header Navigasi)</span>
          <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {headerLinks.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("footer");
            setIsAdding(false);
            setEditingItem(null);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "footer"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Tautan Kaki (Footer Links)</span>
          <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {footerLinks.length}
          </span>
        </button>
      </div>

      {/* Form Add/Edit */}
      {(isAdding || editingItem) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white border-2 border-emerald-600 rounded-2xl p-5 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-sm text-gray-900">
              {editingItem ? "Edit Tautan Menu" : `Tambah Menu Baru ke ${activeTab === "header" ? "Header" : "Footer"}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingItem(null);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕ Batal
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Teks Menu:
              </label>
              <input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Contoh: Promo Spesial, Tentang Toko"
                required
                className="w-full text-xs border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tujuan Link (URL / Anchor):
              </label>
              <input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="Contoh: #products, /p/tentang-kami, https://wa.me/..."
                required
                className="w-full text-xs border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 text-xs border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs"
            >
              Simpan Tautan
            </button>
          </div>
        </form>
      )}

      {/* Menu List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Urutan Menu {activeTab === "header" ? "Header Toko" : "Footer Toko"}
          </h3>
          <span className="text-xs text-gray-400">
            {currentList.filter((it) => it.enabled).length} Aktif
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {currentList.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-mono flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>{item.label}</span>
                    {!item.enabled && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, "up", activeTab)}
                    className="p-1.5 hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                    title="Geser ke Atas"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === currentList.length - 1}
                    onClick={() => moveItem(idx, "down", activeTab)}
                    className="p-1.5 hover:bg-gray-100 text-gray-500 border-l border-gray-200 disabled:opacity-30"
                    title="Geser ke Bawah"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => toggleLink(item.id, activeTab)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                    item.enabled
                      ? "border-gray-200 text-gray-600 hover:bg-gray-100"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {item.enabled ? "Nonaktifkan" : "Aktifkan"}
                </button>

                <button
                  onClick={() => startEdit(item, activeTab)}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700"
                  title="Edit Tautan"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteLink(item.id, activeTab)}
                  className="p-2 border border-red-100 rounded-xl hover:bg-red-50 text-red-600"
                  title="Hapus Tautan"
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
