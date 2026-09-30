"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CornerDownRight, Edit3, MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { NavigationGroup, NavigationItem, StorePage } from "@/lib/builder/types";
import { useToast } from "@/components/ui/toast";

interface GroupWithItems extends NavigationGroup {
  items: Array<NavigationItem & { children: NavigationItem[] }>;
}

interface ItemForm {
  id?: string;
  parent_id?: string | null;
  label: string;
  mode: "page" | "url";
  page_id: string;
  url: string;
  open_in_new_tab: boolean;
}

const EMPTY_FORM: ItemForm = { label: "", mode: "page", page_id: "", url: "/", open_in_new_tab: false };

export function NavigationTab({ websiteId }: { websiteId: string }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupWithItems[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [groupOpen, setGroupOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const [navRes, pageRes] = await Promise.all([
        fetch(`/api/websites/${websiteId}/navigation`),
        fetch(`/api/websites/${websiteId}/pages`),
      ]);
      const navJson = await navRes.json();
      const pageJson = await pageRes.json();
      if (navJson.success) {
        setGroups(navJson.data);
        setActiveGroupId((prev) => {
          if (prev && navJson.data.some((g: GroupWithItems) => g.id === prev)) return prev;
          return navJson.data.find((g: GroupWithItems) => g.key === "topnav")?.id ?? navJson.data[0]?.id ?? null;
        });
      } else {
        toast("error", navJson.error ?? "Gagal memuat navigasi");
      }
      if (pageJson.success) setPages(pageJson.data);
    } catch {
      toast("error", "Gagal memuat navigasi. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  function pageUrl(p: StorePage) {
    return p.is_homepage ? "/" : `/p/${p.slug}`;
  }

  function openAdd(parentId: string | null = null) {
    setForm({ ...EMPTY_FORM, parent_id: parentId ?? null });
    setFormOpen(true);
  }

  function openEdit(item: NavigationItem, parentId: string | null = null) {
    setForm({
      id: item.id,
      parent_id: parentId,
      label: item.label,
      mode: item.page_id ? "page" : "url",
      page_id: item.page_id ?? "",
      url: item.url,
      open_in_new_tab: item.open_in_new_tab,
    });
    setFormOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup || !form.label.trim()) return;
    let url = form.url.trim() || "/";
    let pageId: string | null = null;
    if (form.mode === "page") {
      const p = pages.find((x) => x.id === form.page_id);
      if (!p) {
        toast("error", "Pilih halaman tujuan dulu");
        return;
      }
      url = pageUrl(p);
      pageId = p.id;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/navigation`, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          form.id
            ? { kind: "item", id: form.id, label: form.label.trim(), url, page_id: pageId, open_in_new_tab: form.open_in_new_tab }
            : { kind: "item", group_id: activeGroup.id, label: form.label.trim(), url, page_id: pageId, parent_id: form.parent_id ?? null, open_in_new_tab: form.open_in_new_tab },
        ),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal menyimpan menu");
        return;
      }
      setFormOpen(false);
      toast("success", form.id ? "Menu diperbarui — situs live ikut" : "Menu ditambahkan — situs live ikut");
      load();
    } catch {
      toast("error", "Gagal menyimpan menu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(item: NavigationItem) {
    try {
      const res = await fetch(`/api/websites/${websiteId}/navigation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "item", id: item.id, enabled: !item.enabled }),
      });
      const json = await res.json();
      if (json.success) load();
      else toast("error", json.error ?? "Gagal mengubah status");
    } catch {
      toast("error", "Gagal mengubah status.");
    }
  }

  async function handleDelete(kind: "group" | "item", id: string, name: string) {
    if (!confirm(`Hapus ${kind === "group" ? "grup" : "menu"} "${name}"?`)) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/navigation?kind=${kind}&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal menghapus");
        return;
      }
      toast("success", "Dihapus");
      load();
    } catch {
      toast("error", "Gagal menghapus.");
    }
  }

  async function handleMove(siblings: NavigationItem[], index: number, dir: "up" | "down") {
    if (!activeGroup) return;
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    try {
      const res = await fetch(`/api/websites/${websiteId}/navigation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "reorder",
          group_id: activeGroup.id,
          parent_id: siblings[0]?.parent_id ?? null,
          ordered_ids: ids,
        }),
      });
      const json = await res.json();
      if (json.success) load();
      else toast("error", json.error ?? "Gagal mengurutkan");
    } catch {
      toast("error", "Gagal mengurutkan.");
    }
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/navigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "group", title: newGroupTitle.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.error ?? "Gagal membuat grup");
        return;
      }
      setNewGroupTitle("");
      setGroupOpen(false);
      toast("success", "Grup navigasi dibuat");
      load();
    } catch {
      toast("error", "Gagal membuat grup.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Memuat navigasi">
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
          <h2 className="text-lg font-bold">Navigasi Website</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Grup <strong>Menu Utama (Topnav)</strong> tampil di header. Tiap menu bisa punya submenu.
            Perubahan langsung tayang di situs live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setGroupOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Grup Baru
          </Button>
          <Button size="sm" onClick={() => openAdd(null)} disabled={!activeGroup}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Menu
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center shrink-0">
            <Button
              variant={g.id === activeGroupId ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveGroupId(g.id)}
              className="rounded-full whitespace-nowrap"
            >
              {g.title}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {g.items.length}
              </Badge>
            </Button>
            {g.key === "custom" && g.id === activeGroupId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600"
                title="Hapus grup"
                onClick={() => handleDelete("group", g.id, g.title)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-sm">
            {activeGroup ? `Menu — ${activeGroup.title}` : "Menu"}
          </CardTitle>
          <span className="text-xs text-muted-foreground">Seret urutan via tombol ↑ ↓</span>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {!activeGroup || activeGroup.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Belum ada menu di grup ini. Klik “Tambah Menu”.
            </p>
          ) : (
            activeGroup.items.map((item, idx) => (
              <div key={item.id}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-muted text-xs font-mono flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold flex items-center gap-2 flex-wrap">
                        {item.label}
                        {!item.enabled && <Badge variant="secondary">Nonaktif</Badge>}
                        {item.children.length > 0 && (
                          <Badge variant="outline">{item.children.length} submenu</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{item.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === 0} title="Naik" onClick={() => handleMove(activeGroup.items, idx, "up")}>
                      <MoveUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === activeGroup.items.length - 1} title="Turun" onClick={() => handleMove(activeGroup.items, idx, "down")}>
                      <MoveDown className="w-3.5 h-3.5" />
                    </Button>
                    <Switch checked={item.enabled} onCheckedChange={() => handleToggle(item)} aria-label={`Ubah status ${item.label}`} />
                    <Button variant="ghost" size="sm" title="Tambah submenu" onClick={() => openAdd(item.id)}>
                      <CornerDownRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(item)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-600" title="Hapus" onClick={() => handleDelete("item", item.id, item.label)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {item.children.map((child, cIdx) => (
                  <div key={child.id} className="pl-10 pr-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 border-t">
                    <div className="flex items-center gap-2 min-w-0">
                      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <h5 className="text-sm font-semibold truncate">
                          {child.label}
                          {!child.enabled && <Badge variant="secondary" className="ml-2">Nonaktif</Badge>}
                        </h5>
                        <p className="text-xs text-muted-foreground font-mono truncate">{child.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={cIdx === 0} title="Naik" onClick={() => handleMove(item.children, cIdx, "up")}>
                        <MoveUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={cIdx === item.children.length - 1} title="Turun" onClick={() => handleMove(item.children, cIdx, "down")}>
                        <MoveDown className="w-3 h-3" />
                      </Button>
                      <Switch checked={child.enabled} onCheckedChange={() => handleToggle(child)} aria-label={`Ubah status ${child.label}`} />
                      <Button variant="outline" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(child, item.id)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7 text-red-600" title="Hapus" onClick={() => handleDelete("item", child.id, child.label)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialog grup baru */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grup Navigasi Baru</DialogTitle>
            <DialogDescription>Grup khusus selain Menu Utama & Footer (misal “Promo”).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="group-title">Nama Grup</Label>
              <Input id="group-title" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} placeholder="Contoh: Menu Promo" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>Buat Grup</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah/edit menu & submenu */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Menu" : form.parent_id ? "Tambah Submenu" : "Tambah Menu"}
            </DialogTitle>
            <DialogDescription>
              {form.parent_id ? "Submenu tampil sebagai dropdown di bawah induknya." : "Tautkan ke halaman toko atau URL manual."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-label">Teks Menu</Label>
              <Input id="item-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Contoh: Katalog, Promo" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={form.mode === "page" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, mode: "page" })}>
                Halaman Toko
              </Button>
              <Button type="button" variant={form.mode === "url" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, mode: "url" })}>
                URL Manual
              </Button>
            </div>
            {form.mode === "page" ? (
              <div className="space-y-1.5">
                <Label>Halaman Tujuan</Label>
                <Select value={form.page_id} onValueChange={(v) => setForm({ ...form, page_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih halaman…" /></SelectTrigger>
                  <SelectContent>
                    {pages.filter((p) => p.is_published).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} {p.is_homepage ? "(Home /)" : `(/p/${p.slug})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="item-url">URL (/, /p/slug, #anchor, https://…)</Label>
                <Input id="item-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="font-mono" required />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="item-blank"
                checked={form.open_in_new_tab}
                onCheckedChange={(v) => setForm({ ...form, open_in_new_tab: v === true })}
              />
              <Label htmlFor="item-blank" className="text-sm cursor-pointer">Buka di tab baru</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>Simpan Menu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
