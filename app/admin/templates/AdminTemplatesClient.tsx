"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye, Download, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImportResultPanel, toImportResult, type ImportResult } from "@/components/admin/templates/ImportResultPanel";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  user_id: string | null;
  website_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tier_requirement: string | null;
  is_system_template: boolean;
  sort_order: number;
  scope: "user" | "public";
  created_at: string;
  updated_at: string;
  user: { id: string; email: string; name: string; tier: string } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200",
  starter: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  growth: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  enterprise: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const SCOPE_COLORS: Record<string, string> = {
  public: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  user: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export function AdminTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "public" | "user">("all");
  const [systemFilter, setSystemFilter] = useState<"all" | "system" | "user">("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: Template | null }>({ open: false, template: null });
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importCategory, setImportCategory] = useState("retail");
  const [importTier, setImportTier] = useState("free");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (tierFilter) params.set("tier_requirement", tierFilter);
      if (scopeFilter !== "all") params.set("scope", scopeFilter);
      if (systemFilter !== "all") params.set("is_system_template", systemFilter === "system" ? "true" : "false");

      const res = await fetch(`/api/admin/templates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      } else {
        toast.error(json.error || "Failed to load templates");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, categoryFilter, tierFilter, scopeFilter, systemFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (template: Template) => {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const d = (json.detached ?? {}) as { userTemplates?: number; pages?: number; websites?: number };
        const parts: string[] = [];
        if (d.pages) parts.push(`${d.pages} page${d.pages > 1 ? "s" : ""}`);
        if (d.websites) parts.push(`${d.websites} website${d.websites > 1 ? "s" : ""}`);
        if (d.userTemplates) parts.push(`${d.userTemplates} saved config${d.userTemplates > 1 ? "s" : ""}`);
        toast.success(
          parts.length > 0 ? `Template deleted (detached from ${parts.join(", ")})` : "Template deleted",
        );
        fetchTemplates();
      } else {
        toast.error(json?.error || `Failed to delete (HTTP ${res.status})`);
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importName.trim()) {
      const msg = "Please select a file and enter a name";
      setImportResult({ ok: false, message: msg, warnings: [], autofilled: [] });
      toast.error(msg);
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("name", importName.trim());
      formData.append("category", importCategory);
      formData.append("tier_requirement", importTier);

      const res = await fetch("/api/admin/templates/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);
      const result = toImportResult(json, `Import failed (HTTP ${res.status})`);
      setImportResult(result);
      if (result.ok) {
        toast.success(result.message);
        setImportFile(null);
        setImportName("");
        fetchTemplates();
      } else {
        toast.error(result.message);
      }
    } catch {
      const msg = "Network error";
      setImportResult({ ok: false, message: msg, warnings: [], autofilled: [] });
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const closeImportDialog = (open: boolean) => {
    setImportDialog(open);
    if (!open) {
      setImportFile(null);
      setImportName("");
      setImportResult(null);
      setImportCategory("retail");
      setImportTier("free");
    }
  };

  const categories = ["food", "fashion", "handicraft", "retail", "services", "marketplace"];
  const tiers = ["free", "starter", "growth", "enterprise"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setImportDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Import Template
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTemplates()}
              className="pl-10"
            />
          </div>

          <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as "all" | "public" | "user")}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Scopes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Select value={systemFilter} onValueChange={(v) => setSystemFilter(v as "all" | "system" | "user")}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tiers</SelectItem>
              {tiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tier</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Scope</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">System</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="p-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-slate-400">
                    Loading templates...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-slate-400">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {template.thumbnail_url && (
                          <img
                            src={template.thumbnail_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-slate-700"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        {template.category || "retail"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", TIER_COLORS[template.tier_requirement || "free"])}
                      >
                        {template.tier_requirement || "free"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", SCOPE_COLORS[template.scope])}
                      >
                        {template.scope}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {template.is_system_template ? (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                          No
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {template.user ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{template.user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{template.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-slate-400">System</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(template.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/templates/${template.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/templates/${template.id}/edit`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/api/admin/templates/${template.id}/export`}
                              className="flex items-center gap-2 w-full"
                              download
                            >
                              <Download className="h-4 w-4" />
                              Export
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ open: true, template })}
                            className="text-red-600 focus:text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-gray-700 dark:text-slate-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-slate-400 py-4">
            Are you sure you want to delete <strong>{deleteDialog.template?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, template: null })}>Cancel</Button>
            <Button variant="destructive" onClick={() => { handleDelete(deleteDialog.template!); setDeleteDialog({ open: false, template: null }); }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialog} onOpenChange={closeImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import System Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-name">Template Name</Label>
              <Input
                id="import-name"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">ZIP File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".zip"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                ZIP must contain template.json and optional assets/ folder, thumbnail.png, behaviours/ folder
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="import-category">Category</Label>
                <Select value={importCategory} onValueChange={setImportCategory}>
                  <SelectTrigger id="import-category"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {["food", "fashion", "retail", "handicraft", "services"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-tier">Min. Tier</Label>
                <Select value={importTier} onValueChange={setImportTier}>
                  <SelectTrigger id="import-tier"><SelectValue placeholder="Tier" /></SelectTrigger>
                  <SelectContent>
                    {["free", "starter", "growth", "enterprise"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Higher tiers can also use it (cumulative).
                </p>
              </div>
            </div>
            <ImportResultPanel result={importResult} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeImportDialog(false)}>
                {importResult?.ok ? "Done" : "Cancel"}
              </Button>
              <Button type="submit" disabled={importing}>
                {importing ? "Importing..." : importResult?.ok ? "Import Again" : "Import"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}