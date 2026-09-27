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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Menu Navigasi Toko
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Atur tautan menu yang tampil di header dan footer toko online Anda untuk mempermudah
            pengunjung mencari produk dan informasi.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            setFormLabel("");
            setFormUrl("");
            setIsAdding(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tautan Menu</span>
        </Button>
      </div>

      {notification && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs Switcher: Header vs Footer */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "header" | "footer");
          setIsAdding(false);
          setEditingItem(null);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="header" className="gap-2">
            Menu Utama
            <Badge variant="secondary" className="text-xs">{headerLinks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            Footer
            <Badge variant="secondary" className="text-xs">{footerLinks.length}</Badge>
          </TabsTrigger>
        </TabsList>

      {/* Form Add/Edit */}
      {(isAdding || editingItem) && (
        <Card className="border-emerald-600 mt-4">
          <form onSubmit={handleSaveForm}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
            <CardTitle className="text-sm">
              {editingItem ? "Edit Tautan Menu" : `Tambah Menu Baru ke ${activeTab === "header" ? "Header" : "Footer"}`}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setEditingItem(null);
              }}
            >
              ✕ Batal
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nav-label">
                Nama Teks Menu:
              </Label>
              <Input
                id="nav-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Contoh: Promo Spesial, Tentang Toko"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nav-url">
                Tujuan Link (URL / Anchor):
              </Label>
              <Input
                id="nav-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="Contoh: #products, /p/tentang-kami, https://wa.me/..."
                required
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setEditingItem(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Tautan
            </Button>
          </div>
          </CardContent>
          </form>
        </Card>
      )}

      {/* Menu List */}
      <Card className="overflow-hidden mt-4">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 py-4">
          <CardTitle className="text-sm">
            Urutan Menu {activeTab === "header" ? "Header Toko" : "Footer Toko"}
          </CardTitle>
          <span className="text-xs text-gray-400">
            {currentList.filter((it) => it.enabled).length} Aktif
          </span>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-gray-100">
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
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{item.label}</span>
                    {!item.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Nonaktif
                      </Badge>
                    )}
                  </h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, "up", activeTab)}
                    className="h-8 w-8"
                    title="Geser ke Atas"
                    aria-label="Geser ke atas"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={idx === currentList.length - 1}
                    onClick={() => moveItem(idx, "down", activeTab)}
                    className="h-8 w-8"
                    title="Geser ke Bawah"
                    aria-label="Geser ke bawah"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={() => toggleLink(item.id, activeTab)}
                    aria-label={item.enabled ? `Nonaktifkan ${item.label}` : `Aktifkan ${item.label}`}
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => startEdit(item, activeTab)}
                  className="h-8 w-8"
                  title="Edit Tautan"
                  aria-label={`Edit ${item.label}`}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteLink(item.id, activeTab)}
                  className="h-8 w-8 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                  title="Hapus Tautan"
                  aria-label={`Hapus ${item.label}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </Tabs>
    </div>
  );
}
