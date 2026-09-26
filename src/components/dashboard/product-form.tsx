"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { Product } from "@/types/products";

/** Kategori default (dipakai dashboard & builder) — jangan duplikasi literal di tempat lain. */
export const DEFAULT_PRODUCT_CATEGORIES = [
  "Umum",
  "Makanan",
  "Minuman",
  "Fashion",
  "Aksesoris",
  "Kerajinan",
  "Lainnya",
];

/** Preview gambar di form: tersimpan (sudah ada di server) atau file baru yang dipilih user. */
type ImageEntry =
  | { kind: "saved"; id: string; url: string }
  | { kind: "new"; file: File; url: string };

export interface ProductFormProps {
  /** Initial product data for editing */
  initialData?: Product | null;
  /** Callback when form is submitted */
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Submit button text */
  submitText?: string;
  /** Whether form is in loading state */
  loading?: boolean;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxFileSizeMb?: number;
  /** Available categories for datalist */
  categories?: string[];
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  submitText,
  loading = false,
  maxImages = 5,
  maxFileSizeMb = 2,
  categories = DEFAULT_PRODUCT_CATEGORIES,
}: ProductFormProps) {
  const { t } = useLang();
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("Umum");
  const [formStock, setFormStock] = useState("0");
  const [formLowStockThreshold, setFormLowStockThreshold] = useState("5");
  const [formIsActive, setFormIsActive] = useState(true);
  // Satu array untuk semua preview — mencegah index mismatch antara file baru & gambar tersimpan.
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormCat("Umum");
    setFormStock("0");
    setFormLowStockThreshold("5");
    setFormIsActive(true);
    setImageEntries([]);
    setRemovedImageIds([]);
    setErrors({});
  }, []);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setFormName(initialData.name);
      setFormPrice(initialData.price.toString());
      setFormDesc(initialData.description || "");
      setFormCat(initialData.category || "Umum");
      setFormStock(initialData.stock.toString());
      setFormLowStockThreshold(initialData.low_stock_threshold.toString());
      setFormIsActive(initialData.is_active);
      setImageEntries(
        (initialData.images || []).map((img) => ({ kind: "saved" as const, id: img.id, url: img.public_url }))
      );
      setRemovedImageIds([]);
    } else {
      resetForm();
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formName.trim()) newErrors.name = t("products.errNameRequired");
    if (!formPrice) newErrors.price = t("products.errPriceRequired");
    else if (Number(formPrice) < 0) newErrors.price = t("products.errPriceNegative");
    if (formStock && Number(formStock) < -1) newErrors.stock = t("products.errStockMin");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Validasi dulu, baru potong ke slot yang tersedia — file invalid tidak ikut masuk payload.
    const validFiles = files.filter((file) => {
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        alert(t("products.errTooLarge", { name: file.name, size: maxFileSizeMb }));
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        alert(t("products.errInvalidType", { name: file.name }));
        return false;
      }
      return true;
    });
    const remainingSlots = Math.max(0, maxImages - imageEntries.length);
    const newFiles = validFiles.slice(0, remainingSlots);

    setImageEntries((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ kind: "new" as const, file, url: URL.createObjectURL(file) })),
    ]);
    e.target.value = ""; // reset supaya file yang sama bisa dipilih ulang setelah dihapus
  };

  const removeImage = (index: number) => {
    const entry = imageEntries[index];
    if (!entry) return;
    if (entry.kind === "saved") {
      // Gambar tersimpan → minta server hapus saat submit (remove_image_ids).
      setRemovedImageIds((ids) => (ids.includes(entry.id) ? ids : [...ids, entry.id]));
    } else {
      URL.revokeObjectURL(entry.url);
    }
    setImageEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", formName.trim());
      formData.append("price", formPrice);
      formData.append("description", formDesc.trim());
      formData.append("category", formCat.trim() || "Umum");
      formData.append("stock", formStock);
      formData.append("low_stock_threshold", formLowStockThreshold);
      formData.append("is_active", formIsActive.toString());

      if (initialData?.id) {
        formData.append("id", initialData.id);
      }

      imageEntries.forEach((entry) => {
        if (entry.kind === "new") formData.append("images", entry.file);
      });
      removedImageIds.forEach((imageId) => {
        formData.append("remove_image_ids", imageId);
      });

      const result = await onSubmit(formData);
      if (result.success) {
        onCancel();
      } else {
        setErrors({ submit: result.error || t("products.errGeneric") });
      }
    } catch (err) {
      setErrors({ submit: t("common.networkError") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("products.productName")} *</Label>
        <Input
          id="name"
          type="text"
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder={t("products.namePlaceholder")}
          disabled={saving || loading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && <p id="name-error" className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">{t("products.price")} *</Label>
          <Input
            id="price"
            type="number"
            required
            min={0}
            step={500}
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            placeholder={t("products.pricePlaceholder")}
            disabled={saving || loading}
            aria-invalid={!!errors.price}
            aria-describedby={errors.price ? "price-error" : undefined}
          />
          {errors.price && <p id="price-error" className="text-sm text-red-600">{errors.price}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">{t("products.stock")}</Label>
          <Input
            id="stock"
            type="number"
            min={-1}
            step={1}
            value={formStock}
            onChange={(e) => setFormStock(e.target.value)}
            placeholder={t("products.stockPlaceholder")}
            disabled={saving || loading}
            aria-invalid={!!errors.stock}
            aria-describedby={errors.stock ? "stock-error" : undefined}
          />
          {errors.stock && <p id="stock-error" className="text-sm text-red-600">{errors.stock}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">{t("products.category")}</Label>
          <Input
            id="category"
            type="text"
            value={formCat}
            onChange={(e) => setFormCat(e.target.value)}
            placeholder={t("products.categoryPlaceholder")}
            disabled={saving || loading}
            list="product-categories"
          />
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold">{t("products.lowStockThreshold")}</Label>
          <Input
            id="low_stock_threshold"
            type="number"
            min={0}
            step={1}
            value={formLowStockThreshold}
            onChange={(e) => setFormLowStockThreshold(e.target.value)}
            placeholder={t("products.thresholdPlaceholder")}
            disabled={saving || loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("products.description")}</Label>
        <Textarea
          id="description"
          rows={3}
          value={formDesc}
          onChange={(e) => setFormDesc(e.target.value)}
          placeholder={t("products.descriptionPlaceholder")}
          disabled={saving || loading}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="images">
          {t("products.images")} ({t("products.maxImages", { count: maxImages })}, {t("products.maxFileSize", { size: maxFileSizeMb })})
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageChange}
            className="hidden"
            disabled={saving || loading || imageEntries.length >= maxImages}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => document.getElementById("images")?.click()}
            disabled={saving || loading || imageEntries.length >= maxImages}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>
              {imageEntries.length >= maxImages
                ? t("products.maxImages", { count: maxImages })
                : t("products.uploadImages")}
            </span>
          </Button>
          <p className="text-xs text-gray-500 text-center">
            {t("products.formatHint", { size: maxFileSizeMb })}
          </p>

          {imageEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {imageEntries.map((entry, index) => (
                <div key={index} className="relative group">
                  <img
                    src={entry.url}
                    alt={t("products.imagePreview", { index: index + 1 })}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    aria-label={`${t("products.removeImage")} ${index + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="is_active">{t("products.status")}</Label>
        <select
          id="is_active"
          value={formIsActive.toString()}
          onChange={(e) => setFormIsActive(e.target.value === "true")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          disabled={saving || loading}
        >
          <option value="true">{t("products.active")}</option>
          <option value="false">{t("products.inactive")}</option>
        </select>
      </div>

      {errors.submit && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving || loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving || loading}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t("products.saving")}
            </>
          ) : (
            submitText ?? t("products.saveProduct")
          )}
        </Button>
      </div>
    </form>
  );
}