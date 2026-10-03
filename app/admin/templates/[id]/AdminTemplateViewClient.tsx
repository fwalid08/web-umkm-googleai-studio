"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Download, ExternalLink, Copy, Check, X, Loader2, FileText, Eye, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TemplateTheme {
  palette?: Record<string, string>;
  typography?: Record<string, unknown>;
  components?: Record<string, unknown>;
  effects?: Record<string, unknown>;
}

interface TemplateData {
  theme?: TemplateTheme;
  sections?: unknown[];
  headers?: unknown[];
  footers?: unknown[];
  animations?: unknown[];
  behaviours?: unknown[];
  [key: string]: unknown;
}

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
  template_data: TemplateData;
  created_at: string;
  updated_at: string;
  user: { id: string; email: string; name: string; tier: string } | null;
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

interface AdminTemplateViewClientProps {
  templateId: string;
}

export function AdminTemplateViewClient({ templateId }: AdminTemplateViewClientProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`);
      const json = await res.json();
      if (json.success) {
        setTemplate(json.data);
      } else {
        toast.error(json.error || "Failed to load template");
        router.push("/admin/templates");
      }
    } catch {
      toast.error("Network error");
      router.push("/admin/templates");
    } finally {
      setLoading(false);
    }
  }, [templateId, router]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, { method: "DELETE" });
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
        router.push("/admin/templates");
        router.refresh();
      } else {
        toast.error(json?.error || `Failed to delete (HTTP ${res.status})`);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = async () => {
    if (!template) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, "-").toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const copyJson = () => {
    if (!template) return;
    navigator.clipboard.writeText(JSON.stringify(template.template_data, null, 2));
    toast.success("JSON copied to clipboard");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="h-96 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!template) return null;

  const sectionsCount = Array.isArray(template.template_data?.sections) ? template.template_data.sections.length : 0;
  const hasTheme = !!(template.template_data?.theme && typeof template.template_data.theme === "object");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {template.thumbnail_url && (
            <img
              src={template.thumbnail_url}
              alt=""
              className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-slate-700"
            />
          )}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{template.name}</h1>
              <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[template.tier_requirement || "free"])}>
                {template.tier_requirement || "free"}
              </Badge>
              <Badge variant="secondary" className={cn("text-xs", SCOPE_COLORS[template.scope])}>
                {template.scope}
              </Badge>
              {template.is_system_template && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  System
                </Badge>
              )}
            </div>
            <p className="text-gray-500 dark:text-slate-400 mt-1">{template.description || "No description"}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-slate-400">
              <span>Category: <span className="font-medium text-gray-900 dark:text-white">{template.category}</span></span>
              <span>Sections: <span className="font-medium text-gray-900 dark:text-white">{sectionsCount}</span></span>
              <span>Theme: <span className="font-medium text-gray-900 dark:text-white">{hasTheme ? "Yes" : "No"}</span></span>
              <span>Created: <span className="font-medium text-gray-900 dark:text-white">{new Date(template.created_at).toLocaleDateString("id-ID")}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MoreVertical className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/templates/${templateId}/edit`} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Template
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport} disabled={exporting} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export JSON"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyJson} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Copy JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setJsonDialogOpen(true)} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Full JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/admin/templates" className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Template Configuration</h2>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-xs text-gray-600 dark:text-slate-300 max-h-96 overflow-auto border border-gray-200 dark:border-slate-700">
              <pre>{JSON.stringify(template.template_data, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-slate-400">ID</dt>
                <dd className="font-mono text-gray-900 dark:text-white break-all">{template.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Owner</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {template.user ? `${template.user.name} (${template.user.email})` : "System"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Scope</dt>
                <dd>
                  <Badge variant="secondary" className={cn(SCOPE_COLORS[template.scope])}>
                    {template.scope}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">System Template</dt>
                <dd>
                  <Badge variant="secondary" className={cn(template.is_system_template ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200")}>
                    {template.is_system_template ? "Yes" : "No"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Sort Order</dt>
                <dd className="font-mono text-gray-900 dark:text-white">{template.sort_order}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Created</dt>
                <dd className="text-gray-900 dark:text-white">{new Date(template.created_at).toLocaleString("id-ID")}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Updated</dt>
                <dd className="text-gray-900 dark:text-white">{new Date(template.updated_at).toLocaleString("id-ID")}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Preview</h2>
            {template.template_data?.theme ? (
              <div className="space-y-3">
                {template.template_data.theme.palette && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Color Palette</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(template.template_data.theme.palette as Record<string, string>).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 dark:bg-slate-900" style={{ backgroundColor: value }}>
                          <span className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600" style={{ backgroundColor: value }} />
                          <span className="text-xs font-mono text-gray-700 dark:text-slate-200 capitalize">{key}</span>
                          <span className="text-xs font-mono text-gray-500 dark:text-slate-400">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {template.template_data.theme.typography && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Typography</p>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(template.template_data.theme.typography as Record<string, unknown>).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-gray-500 dark:text-slate-400 capitalize">{key.replace("_", " ")}</dt>
                          <dd className="font-mono text-gray-900 dark:text-white">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-sm">No theme configuration</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Full Template JSON</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <pre className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-xs text-gray-600 dark:text-slate-300 max-h-[60vh] overflow-auto border border-gray-200 dark:border-slate-700">
              {JSON.stringify(template.template_data, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonDialogOpen(false)}>Close</Button>
            <Button onClick={copyJson}><Copy className="h-4 w-4 mr-2" />Copy JSON</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-slate-400 py-4">
            Are you sure you want to delete <strong>{template.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}