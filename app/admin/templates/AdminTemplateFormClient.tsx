"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tier_requirement: string | null;
  is_system_template: boolean;
  sort_order: number;
  scope: "user" | "public";
  template_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AdminTemplateFormClientProps {
  mode: "create" | "edit";
  templateId: string | null;
}

const CATEGORIES = ["food", "fashion", "handicraft", "retail", "services", "marketplace"];
const TIERS = ["free", "starter", "growth", "enterprise"];

export function AdminTemplateFormClient({ mode, templateId: propTemplateId }: AdminTemplateFormClientProps) {
  const router = useRouter();
  const params = useParams();
  const templateId = propTemplateId || (params.id as string);
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Template>>({
    name: "",
    description: "",
    category: "retail",
    tier_requirement: "free",
    thumbnail_url: "",
    is_system_template: true,
    scope: "public",
    sort_order: 0,
    template_data: {},
  });
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState("");

  const fetchTemplate = useCallback(async () => {
    if (!isEdit || !templateId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`);
      const json = await res.json();
      if (json.success) {
        const t = json.data;
        setFormData({
          name: t.name,
          description: t.description || "",
          category: t.category || "retail",
          tier_requirement: t.tier_requirement || "free",
          thumbnail_url: t.thumbnail_url || "",
          is_system_template: t.is_system_template,
          scope: t.scope,
          sort_order: t.sort_order || 0,
          template_data: t.template_data || {},
        });
        setJsonValue(JSON.stringify(t.template_data || {}, null, 2));
      } else {
        toast.error(json.error || "Failed to load template");
        router.back();
      }
    } catch {
      toast.error("Network error");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [isEdit, templateId, router]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => ({ ...prev, template_data: parsed }));
    } catch {
      // Invalid JSON, keep previous valid data
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (formData.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        category: formData.category,
        tier_requirement: formData.tier_requirement,
        thumbnail_url: formData.thumbnail_url || "",
        is_system_template: formData.is_system_template,
        scope: formData.scope,
        sort_order: formData.sort_order,
        template_data: formData.template_data,
      };

      const url = isEdit ? `/api/admin/templates/${templateId}` : "/api/admin/templates";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(isEdit ? "Template updated" : "Template created");
        router.push("/admin/templates");
        router.refresh();
      } else {
        toast.error(json.error || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter template name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category || "retail"} onValueChange={(v) => handleChange("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier_requirement">Tier Requirement</Label>
            <Select value={formData.tier_requirement || "free"} onValueChange={(v) => handleChange("tier_requirement", v)}>
              <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select value={formData.scope || "public"} onValueChange={(v) => handleChange("scope", v)}>
              <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (visible to all users)</SelectItem>
                <SelectItem value="user">User (private)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order || 0}
              onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_system_template">System Template</Label>
            <Select value={String(formData.is_system_template)} onValueChange={(v) => handleChange("is_system_template", v === "true")}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes (system template)</SelectItem>
                <SelectItem value="false">No (user template)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Template description"
            rows={3}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input
            id="thumbnail_url"
            value={formData.thumbnail_url || ""}
            onChange={(e) => handleChange("thumbnail_url", e.target.value)}
            placeholder="https://example.com/thumbnail.png"
          />
          {formData.thumbnail_url && (
            <img src={formData.thumbnail_url} alt="Preview" className="h-24 w-auto rounded border border-gray-200 dark:border-slate-700" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Template Data (JSON)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setJsonEditorOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Edit JSON
            </Button>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 font-mono text-xs text-gray-600 dark:text-slate-300 max-h-48 overflow-auto border border-gray-200 dark:border-slate-700">
            <pre>{JSON.stringify(formData.template_data, null, 2).slice(0, 2000)}...</pre>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/templates" className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Update Template" : "Create Template"}
        </Button>
      </div>

      <Dialog open={jsonEditorOpen} onOpenChange={setJsonEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Data JSON Editor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-sm h-[60vh] bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700"
              placeholder='{"theme": {...}, "sections": [...]}'
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Edit the full template configuration. Invalid JSON will not be saved.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonEditorOpen(false)}>Cancel</Button>
            <Button onClick={() => setJsonEditorOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  );
}