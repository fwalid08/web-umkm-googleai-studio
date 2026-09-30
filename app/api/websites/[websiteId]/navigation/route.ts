import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveWebsite } from "@/lib/websites/active";
import type { NavigationGroup, NavigationItem } from "@/lib/builder/types";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

const urlSchema = z
  .string()
  .min(1, "URL wajib diisi")
  .max(500)
  .refine((v) => v.startsWith("/") || v.startsWith("#") || /^https?:\/\//.test(v), {
    message: "URL harus mulai dengan /, #, atau http(s)://",
  });

const createGroupSchema = z.object({
  kind: z.literal("group"),
  title: z.string().min(3, "Nama grup minimal 3 karakter").max(100),
});

const createItemSchema = z.object({
  kind: z.literal("item"),
  group_id: z.string().uuid(),
  label: z.string().min(1, "Label wajib diisi").max(100),
  url: urlSchema.default("/"),
  page_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  open_in_new_tab: z.boolean().optional(),
});

const patchGroupSchema = z.object({
  kind: z.literal("group"),
  id: z.string().uuid(),
  title: z.string().min(3).max(100).optional(),
});

const patchItemSchema = z.object({
  kind: z.literal("item"),
  id: z.string().uuid(),
  label: z.string().min(1).max(100).optional(),
  url: urlSchema.optional(),
  page_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  open_in_new_tab: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

const reorderSchema = z.object({
  kind: z.literal("reorder"),
  group_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  ordered_ids: z.array(z.string().uuid()).min(1).max(30),
});

type Supa = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function requireSite(websiteId: string) {
  const session = await auth();
  const sessionUser = getSessionUser(session);
  if (!sessionUser) return { error: "Unauthorized" as const, status: 401 };
  const site = await getActiveWebsite(sessionUser.id);
  if (!site || site.id !== websiteId) {
    return { error: "Website tidak ditemukan" as const, status: 404 };
  }
  return { site };
}

/** Pastikan grup topnav + footer ada (website baru / sebelum migrasi 029). */
async function ensureDefaultGroups(supabase: Supa, websiteId: string) {
  const { data } = await supabase
    .from("navigation_groups")
    .select("id, key")
    .eq("website_id", websiteId);
  const keys = new Set((data ?? []).map((g) => g.key as string));
  const missing: Array<{ key: string; title: string; sort_order: number }> = [];
  if (!keys.has("topnav")) missing.push({ key: "topnav", title: "Menu Utama (Topnav)", sort_order: 0 });
  if (!keys.has("footer")) missing.push({ key: "footer", title: "Footer", sort_order: 1 });
  if (missing.length > 0) {
    const { error } = await supabase
      .from("navigation_groups")
      .insert(missing.map((m) => ({ website_id: websiteId, ...m })));
    if (error) {
      console.error("ensureDefaultGroups insert error:", error.code, error.message);
    }
  }
}

function toNavItem(row: NavigationItem) {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    isExternal: /^https?:\/\//.test(row.url),
    enabled: row.enabled,
    children: (row.children ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      url: c.url,
      isExternal: /^https?:\/\//.test(c.url),
      enabled: c.enabled,
    })),
  };
}

/**
 * Sinkron grup topnav/footer -> custom_config header/footer agar situs live
 * langsung ikut (termasuk submenu sebagai children).
 */
async function syncToWebsiteConfig(supabase: Supa, websiteId: string) {
  const { data: groups } = await supabase
    .from("navigation_groups")
    .select("id, key")
    .eq("website_id", websiteId);
  if (!groups || groups.length === 0) return;

  const { data: items } = await supabase
    .from("navigation_items")
    .select("*")
    .in(
      "group_id",
      groups.map((g) => g.id),
    )
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  const rows = (items ?? []) as NavigationItem[];

  const buildTree = (groupId: string) => {
    const top = rows.filter((r) => r.group_id === groupId && !r.parent_id);
    return top.map((t) => ({
      ...t,
      children: rows.filter((r) => r.parent_id === t.id),
    }));
  };

  const topnav = groups.find((g) => g.key === "topnav");
  const footer = groups.find((g) => g.key === "footer");

  const { data: latest } = await supabase
    .from("user_templates")
    .select("id, custom_config")
    .eq("website_id", websiteId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return;

  const cfg = (latest.custom_config ?? {}) as Record<string, unknown>;
  const header = (cfg.header ?? {}) as Record<string, unknown>;
  const footerCfg = (cfg.footer ?? {}) as Record<string, unknown>;

  await supabase
    .from("user_templates")
    .update({
      custom_config: {
        ...cfg,
        header: {
          ...header,
          navItems: topnav ? buildTree(topnav.id).map(toNavItem) : header.navItems,
        },
        footer: {
          ...footerCfg,
          navItems: footer ? buildTree(footer.id).map(toNavItem) : footerCfg.navItems,
        },
        updated_at: undefined,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", latest.id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const checked = await requireSite(websiteId);
  if ("error" in checked) {
    return NextResponse.json({ success: false, error: checked.error }, { status: checked.status });
  }

  const supabase = await createServerSupabaseClient();
  await ensureDefaultGroups(supabase, websiteId);

  const { data: groups, error: gErr } = await supabase
    .from("navigation_groups")
    .select("*")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true });
  if (gErr) {
    return NextResponse.json({ success: false, error: "Gagal memuat navigasi" }, { status: 500 });
  }

  const { data: items, error: iErr } = await supabase
    .from("navigation_items")
    .select("*")
    .in("group_id", (groups ?? []).map((g) => g.id))
    .order("sort_order", { ascending: true });
  if (iErr) {
    return NextResponse.json({ success: false, error: "Gagal memuat item navigasi" }, { status: 500 });
  }

  const rows = (items ?? []) as NavigationItem[];
  const result = ((groups ?? []) as NavigationGroup[]).map((g) => ({
    ...g,
    items: rows
      .filter((r) => r.group_id === g.id && !r.parent_id)
      .map((t) => ({ ...t, children: rows.filter((r) => r.parent_id === t.id) })),
  }));

  return NextResponse.json({ success: true, data: result });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const checked = await requireSite(websiteId);
  if ("error" in checked) {
    return NextResponse.json({ success: false, error: checked.error }, { status: checked.status });
  }

  const body = await request.json().catch(() => null);
  const kind = (body as { kind?: string } | null)?.kind;
  const supabase = await createServerSupabaseClient();
  await ensureDefaultGroups(supabase, websiteId);

  if (kind === "group") {
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { count: groupCount } = await supabase
      .from("navigation_groups")
      .select("id", { count: "exact", head: true })
      .eq("website_id", websiteId);
    if ((groupCount ?? 0) >= 10) {
      return NextResponse.json({ success: false, error: "Maksimal 10 grup navigasi" }, { status: 403 });
    }
    // sort_order dinamis (max+1) agar urutan antar grup custom stabil.
    const { data: lastGroup } = await supabase
      .from("navigation_groups")
      .select("sort_order")
      .eq("website_id", websiteId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSort = (lastGroup?.sort_order ?? 1) + 1;
    const { data, error } = await supabase
      .from("navigation_groups")
      .insert({ website_id: websiteId, key: "custom", title: parsed.data.title, sort_order: nextSort })
      .select()
      .single();
    if (error) {
      console.error("Create navigation group error:", error.code, error.message);
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Grup dengan tipe ini sudah ada" },
          { status: 409 },
        );
      }
      return NextResponse.json({ success: false, error: "Gagal membuat grup" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data, message: "Grup navigasi dibuat" });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { group_id, label, url, page_id, parent_id, open_in_new_tab } = parsed.data;

  const { data: group } = await supabase
    .from("navigation_groups")
    .select("id")
    .eq("id", group_id)
    .eq("website_id", websiteId)
    .maybeSingle();
  if (!group) {
    return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
  }

  // Submenu: parent harus top-level di grup yang sama (max depth 1, max 5 anak)
  if (parent_id) {
    const { data: parent } = await supabase
      .from("navigation_items")
      .select("id, group_id, parent_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (!parent || parent.group_id !== group_id || parent.parent_id) {
      return NextResponse.json(
        { success: false, error: "Induk submenu tidak valid (maksimal 1 level)" },
        { status: 400 },
      );
    }
    const { count } = await supabase
      .from("navigation_items")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parent_id);
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ success: false, error: "Maksimal 5 submenu per induk" }, { status: 403 });
    }
  } else {
    const { count } = await supabase
      .from("navigation_items")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group_id)
      .is("parent_id", null);
    if ((count ?? 0) >= 10) {
      return NextResponse.json({ success: false, error: "Maksimal 10 menu utama per grup" }, { status: 403 });
    }
  }

  const { data: siblings } = await supabase
    .from("navigation_items")
    .select("sort_order")
    .eq("group_id", group_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (siblings?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("navigation_items")
    .insert({
      group_id,
      parent_id: parent_id ?? null,
      label: label.trim(),
      url: url.trim(),
      page_id: page_id ?? null,
      open_in_new_tab: open_in_new_tab ?? /^https?:\/\//.test(url),
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) {
    console.error("Create navigation item error:", error.code, error.message);
    return NextResponse.json({ success: false, error: "Gagal menambah menu" }, { status: 500 });
  }

  await syncToWebsiteConfig(supabase, websiteId);
  return NextResponse.json({ success: true, data, message: "Menu ditambahkan" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const checked = await requireSite(websiteId);
  if ("error" in checked) {
    return NextResponse.json({ success: false, error: checked.error }, { status: checked.status });
  }

  const body = await request.json().catch(() => null);
  const kind = (body as { kind?: string } | null)?.kind;
  const supabase = await createServerSupabaseClient();

  if (kind === "group") {
    const parsed = patchGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from("navigation_groups")
      .update({ title: parsed.data.title, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("website_id", websiteId)
      .select()
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data, message: "Grup diperbarui" });
  }

  if (kind === "reorder") {
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { group_id, parent_id, ordered_ids } = parsed.data;
    const { data: group } = await supabase
      .from("navigation_groups")
      .select("id")
      .eq("id", group_id)
      .eq("website_id", websiteId)
      .maybeSingle();
    if (!group) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }
    let query = supabase.from("navigation_items").select("id").eq("group_id", group_id);
    query = parent_id ? query.eq("parent_id", parent_id) : query.is("parent_id", null);
    const { data: current } = await query;
    const currentIds = new Set((current ?? []).map((c) => c.id));
    if (currentIds.size !== ordered_ids.length || !ordered_ids.every((id) => currentIds.has(id))) {
      return NextResponse.json({ success: false, error: "Urutan tidak cocok dengan data" }, { status: 400 });
    }
    for (let i = 0; i < ordered_ids.length; i++) {
      await supabase.from("navigation_items").update({ sort_order: i }).eq("id", ordered_ids[i]);
    }
    await syncToWebsiteConfig(supabase, websiteId);
    return NextResponse.json({ success: true, message: "Urutan menu diperbarui" });
  }

  const parsed = patchItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id, parent_id, ...rest } = parsed.data;

  // Validasi pindah induk (tetap max depth 1, grup sama)
  if (parent_id !== undefined) {
    const { data: item } = await supabase.from("navigation_items").select("id, group_id").eq("id", id).maybeSingle();
    if (!item) {
      return NextResponse.json({ success: false, error: "Menu tidak ditemukan" }, { status: 404 });
    }
    if (parent_id) {
      if (parent_id === id) {
        return NextResponse.json({ success: false, error: "Menu tidak bisa menjadi induk dirinya" }, { status: 400 });
      }
      const { data: parent } = await supabase
        .from("navigation_items")
        .select("id, group_id, parent_id")
        .eq("id", parent_id)
        .maybeSingle();
      if (!parent || parent.group_id !== item.group_id || parent.parent_id) {
        return NextResponse.json(
          { success: false, error: "Induk submenu tidak valid (maksimal 1 level)" },
          { status: 400 },
        );
      }
      // Item yang sudah punya anak tidak boleh jadi anak (cegah cucu)
      const { count } = await supabase
        .from("navigation_items")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", id);
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { success: false, error: "Menu yang punya submenu tidak bisa jadi submenu" },
          { status: 400 },
        );
      }
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (rest.label !== undefined) patch.label = rest.label.trim();
  if (rest.url !== undefined) patch.url = rest.url.trim();
  if (rest.page_id !== undefined) patch.page_id = rest.page_id;
  if (parent_id !== undefined) patch.parent_id = parent_id;
  if (rest.open_in_new_tab !== undefined) patch.open_in_new_tab = rest.open_in_new_tab;
  if (rest.enabled !== undefined) patch.enabled = rest.enabled;

  const { data, error } = await supabase
    .from("navigation_items")
    .update(patch)
    .eq("id", id)
    .select("*, navigation_groups!inner(website_id)")
    .single();
  if (error || !data) {
    return NextResponse.json({ success: false, error: "Menu tidak ditemukan" }, { status: 404 });
  }
  const websiteIdOfItem = (data as unknown as { navigation_groups: { website_id: string } })
    .navigation_groups.website_id;
  if (websiteIdOfItem !== websiteId) {
    return NextResponse.json({ success: false, error: "Menu tidak ditemukan" }, { status: 404 });
  }

  await syncToWebsiteConfig(supabase, websiteId);
  return NextResponse.json({ success: true, data, message: "Menu diperbarui" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const checked = await requireSite(websiteId);
  if ("error" in checked) {
    return NextResponse.json({ success: false, error: checked.error }, { status: checked.status });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!id || (kind !== "group" && kind !== "item")) {
    return NextResponse.json({ success: false, error: "Parameter kind/id tidak valid" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (kind === "group") {
    const { data: group } = await supabase
      .from("navigation_groups")
      .select("id, key")
      .eq("id", id)
      .eq("website_id", websiteId)
      .maybeSingle();
    if (!group) {
      return NextResponse.json({ success: false, error: "Grup tidak ditemukan" }, { status: 404 });
    }
    if (group.key === "topnav" || group.key === "footer") {
      return NextResponse.json(
        { success: false, error: "Grup Menu Utama & Footer tidak bisa dihapus" },
        { status: 403 },
      );
    }
    const { error } = await supabase.from("navigation_groups").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: "Gagal menghapus grup" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Grup dihapus" });
  }

  // Hapus item milik website ini (anak ikut terhapus via CASCADE)
  const { data: item } = await supabase
    .from("navigation_items")
    .select("id, group_id, navigation_groups!inner(website_id)")
    .eq("id", id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ success: false, error: "Menu tidak ditemukan" }, { status: 404 });
  }
  const ownerWebsite = (item as unknown as { navigation_groups: { website_id: string } })
    .navigation_groups.website_id;
  if (ownerWebsite !== websiteId) {
    return NextResponse.json({ success: false, error: "Menu tidak ditemukan" }, { status: 404 });
  }
  const { error } = await supabase.from("navigation_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ success: false, error: "Gagal menghapus menu" }, { status: 500 });
  }

  await syncToWebsiteConfig(supabase, websiteId);
  return NextResponse.json({ success: true, message: "Menu dihapus" });
}
