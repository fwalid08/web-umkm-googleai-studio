"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, FileText, Home, Loader2, Plus, Trash2 } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StorePage } from "@/lib/builder/types";
import { normalizeSlug } from "@/lib/pages/slug";
import { useToast } from "@/components/ui/toast";

function slugify(v: string) {
  return normalizeSlug(v);
}

function pageUrl(p: StorePage) {
  return p.is_homepage ? "/" : `/p/${p.slug}`;
}

export function PagesTab({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Dialog tambah
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  // true bila user sudah mengedit slug manual — auto-slug dari judul berhenti.
  const [slugTouched, setSlugTouched] = useState(false);

  function resetAddForm() {
    setNewTitle("");
    setNewSlug("");
    setSlugTouched(false);
  }

  function openAddDialog() {
    resetAddForm();
    setAddOpen(true);
  }

  // Dialog edit (judul, slug custom, tipe, SEO, publish)
  const [editing, setEditing] = useState<StorePage | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages`);
      const json = await res.json();
      if (json.success) setPages(json.data);
      else toast("error", json.error ?? "Gagal memuat halaman");
    } catch {
      toast("error", "Gagal memuat halaman. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), slug: newSlug.trim() || slugify(newTitle) }),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal membuat halaman");
        return;
      }
      setAddOpen(false);
      resetAddForm();
      // Flow: tambah halaman -> langsung masuk page builder
      router.push(`/dashboard/websites/page-builder/${json.data.id}`);
    } catch {
      toast("error", "Gagal membuat halaman. Periksa koneksi Anda.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          slug: editing.is_homepage ? undefined : editing.slug,
          type: editing.type,
          is_published: editing.is_published,
          meta_title: editing.meta_title || null,
          meta_description: editing.meta_description || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal menyimpan halaman");
        return;
      }
      setEditing(null);
      toast("success", "Halaman disimpan");
      load();
    } catch {
      toast("error", "Gagal menyimpan halaman.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetHome(id: string, title: string) {
    if (!confirm(`Jadikan "${title}" sebagai homepage (URL /)? Homepage lama tidak lagi jadi utama.`)) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_homepage: true }),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal mengatur homepage");
        return;
      }
      toast("success", `"${title}" kini homepage (/)`);
      load();
    } catch {
      toast("error", "Gagal mengatur homepage.");
    }
  }

  async function handleTogglePublish(p: StorePage) {
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !p.is_published }),
      });
      const json = await res.json();
      if (json.success) load();
      else toast("error", json.error ?? "Gagal mengubah status");
    } catch {
      toast("error", "Gagal mengubah status.");
    }
  }

  async function handleDelete(p: StorePage) {
    if (!confirm(`Hapus halaman "${p.title}"?`)) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${p.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal menghapus halaman");
        return;
      }
      toast("success", "Halaman dihapus");
      load();
    } catch {
      toast("error", "Gagal menghapus halaman.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Memuat halaman">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Halaman Website</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Satu halaman bisa jadi homepage (URL <code className="font-mono">/</code>). Sisanya memakai
            URL custom (<code className="font-mono">/p/slug-anda</code>).
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Tambah Halaman
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-sm">Daftar Halaman ({pages.length})</CardTitle>
          <span className="text-xs text-muted-foreground">
            {pages.filter((p) => p.is_published).length} Tayang
          </span>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {pages.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Belum ada halaman. Klik “Tambah Halaman” untuk membuat halaman pertama via page builder.
            </p>
          )}
          {pages.map((p) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.is_homepage ? <Home className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                  <h4 className="font-bold text-sm truncate">{p.title}</h4>
                  {p.is_homepage && <Badge className="bg-emerald-600 text-white">Home</Badge>}
                  <Badge variant={p.is_published ? "success" : "secondary"}>
                    {p.is_published ? "Tayang" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">{pageUrl(p)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch checked={p.is_published} onCheckedChange={() => handleTogglePublish(p)} aria-label={`Ubah status ${p.title}`} />
                {!p.is_homepage && (
                  <Button variant="ghost" size="sm" title="Jadikan homepage" onClick={() => handleSetHome(p.id, p.title)}>
                    <Home className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" title="Edit konten di page builder" onClick={() => router.push(`/dashboard/websites/page-builder/${p.id}`)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Edit judul, URL & SEO"
                  onClick={() => setEditing({ ...p })}
                >
                  <span className="text-xs font-semibold px-1">URL</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Hapus"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog tambah -> redirect ke page builder */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Halaman</DialogTitle>
            <DialogDescription>
              Setelah dibuat, Anda langsung masuk page builder untuk mengisi konten.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-title">Judul Halaman</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!slugTouched) setNewSlug(slugify(e.target.value));
                }}
                placeholder="Contoh: Promo Ramadan"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-slug">URL Custom</Label>
              <div className="flex items-center">
                <span className="text-sm bg-muted border border-r-0 px-3 py-2 rounded-l-lg font-mono h-10 flex items-center">/p/</span>
                <Input
                  id="new-slug"
                  value={newSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setNewSlug(slugify(e.target.value));
                  }}
                  placeholder="promo-ramadan"
                  className="rounded-l-none font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Otomatis dari judul — klik & ubah bila ingin custom.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Buat & Buka Builder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog edit judul / URL custom / SEO */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pengaturan Halaman</DialogTitle>
            <DialogDescription>
              {editing?.is_homepage
                ? "Homepage selalu di URL / — slug dikunci."
                : "Atur URL custom (slug), tipe, dan SEO."}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Judul</Label>
                <Input
                  id="edit-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-slug">URL Custom</Label>
                <div className="flex items-center">
                  <span className="text-sm bg-muted border border-r-0 px-3 py-2 rounded-l-lg font-mono h-10 flex items-center">
                    {editing.is_homepage ? "/" : "/p/"}
                  </span>
                  <Input
                    id="edit-slug"
                    value={editing.is_homepage ? "home" : editing.slug}
                    disabled={editing.is_homepage}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                    className="rounded-l-none font-mono"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipe</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as StorePage["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="about">Tentang</SelectItem>
                      <SelectItem value="contact">Kontak</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="terms">Syarat</SelectItem>
                      <SelectItem value="privacy">Privasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    checked={editing.is_published}
                    onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                    id="edit-pub"
                  />
                  <Label htmlFor="edit-pub">Tayang</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-seo-t">Judul SEO (maks 60)</Label>
                <Input
                  id="edit-seo-t"
                  value={editing.meta_title ?? ""}
                  onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-seo-d">Deskripsi SEO (maks 160)</Label>
                <Textarea
                  id="edit-seo-d"
                  value={editing.meta_description ?? ""}
                  onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
