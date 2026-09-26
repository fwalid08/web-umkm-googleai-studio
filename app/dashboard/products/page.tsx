"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Store,
  Plus,
  Search,
  MessageCircle,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ProductForm, DEFAULT_PRODUCT_CATEGORIES } from "@/components/dashboard/product-form";
import { useLang } from "@/lib/i18n";
import { tenantUrl } from "@/lib/urls";
import { PRODUCT_TIER_LIMITS, type Product } from "@/types/products";

/**
 * Info limit produk dari GET /api/user/products (F3-3).
 * Client hanya menampilkan — enforcement tetap di API.
 */
interface TierLimitInfo {
  currentCount: number;
  maxLimit: number;
  maxImagesPerProduct: number;
  maxFileSizeMb: number;
  tier: string;
  upgradeUrl?: string;
}

export default function ProductsPage() {
  const { t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [websiteName, setWebsiteName] = useState("");
  const [websiteId, setWebsiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [limit, setLimit] = useState(20);
  const [tierLimit, setTierLimit] = useState<TierLimitInfo | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Bulk actions
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (websiteId) params.set("websiteId", websiteId);

      const res = await fetch(`/api/user/products?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setWebsiteName(json.data.website_name || t("products.defaultWebsiteName"));
        setWebsiteId(json.data.website_id || "");
        setTotalProducts(json.data.total || 0);
        setTotalPages(json.data.total_pages || 1);
        // F3-3: batas tier datang dari API (plan-aware), bukan dihitung di client.
        const limits = json.data.limits;
        setTierLimit(
          limits
            ? {
                currentCount: limits.currentCount ?? 0,
                maxLimit: limits.maxLimit ?? PRODUCT_TIER_LIMITS.free.maxProducts,
                maxImagesPerProduct: limits.maxImagesPerProduct ?? PRODUCT_TIER_LIMITS.free.maxImagesPerProduct,
                maxFileSizeMb: limits.maxFileSizeMb ?? PRODUCT_TIER_LIMITS.free.maxFileSizeMb,
                tier: limits.tier ?? "free",
                upgradeUrl: limits.upgradeUrl,
              }
            : null
        );
      } else {
        setError(json.error || t("products.loadFailed"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCategory, websiteId, t]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Kategori untuk datalist form: default + kategori yang sudah dipakai produk.
  const categoryOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...categories])),
    [categories]
  );

  const atProductLimit = !!tierLimit && tierLimit.currentCount >= tierLimit.maxLimit;
  const tierLimits = tierLimit ?? { ...PRODUCT_TIER_LIMITS.free, currentCount: 0, maxLimit: PRODUCT_TIER_LIMITS.free.maxProducts, tier: "free" as const };

  const openAddModal = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setModalOpen(true);
  };

  /**
   * F3-3: satu implementasi form (ProductForm) + satu jalur REST.
   * PUT kalau form mengirim `id` (mode edit), POST kalau produk baru.
   */
  const handleProductSubmit = async (
    formData: FormData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const isEdit = !!formData.get("id");
      const res = await fetch("/api/user/products", {
        method: isEdit ? "PUT" : "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || (isEdit ? t("products.updateFailed") : t("products.createFailed")),
        };
      }

      // Server mengirim warning (mis. gambar melebihi batas tier) — beri tahu user.
      if (json.warning) alert(json.warning);

      setModalOpen(false);
      await loadProducts();
      return { success: true };
    } catch {
      return { success: false, error: t("common.networkError") };
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch("/api/user/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          is_active: !product.is_active,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadProducts();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t("products.confirmDelete"))) return;
    try {
      const res = await fetch(`/api/user/products?id=${productId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        loadProducts();
      }
    } catch {
      // ignore
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedProducts.length === 0) return;
    if (action === "delete" && !confirm(t("products.confirmBulkDelete", { count: selectedProducts.length }))) return;

    setBulkActionLoading(true);
    try {
      const updates = selectedProducts.map((id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return Promise.resolve();

        if (action === "delete") {
          return fetch(`/api/user/products?id=${id}`, { method: "DELETE" });
        }
        return fetch("/api/user/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            is_active: action === "activate",
          }),
        });
      });

      await Promise.all(updates);
      setSelectedProducts([]);
      loadProducts();
    } catch {
      // ignore
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const testWaLink = (product: Product) => {
    const text = encodeURIComponent(
      `Halo, saya ingin memesan ${product.name} (Rp ${product.price.toLocaleString("id-ID")}). Apakah produk masih tersedia?`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  };

  const getStockBadge = (product: Product) => {
    if (product.stock === -1) return <Badge variant="outline" className="text-xs">Unlimited</Badge>;
    if (product.stock === 0) return <Badge variant="destructive" className="text-xs">Habis</Badge>;
    if (product.stock <= product.low_stock_threshold) return <Badge variant="warning" className="text-xs">Sisa {product.stock}</Badge>;
    return <Badge variant="success" className="text-xs">Stok: {product.stock}</Badge>;
  };

  const primaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.is_primary);
    return primary?.public_url || product.images?.[0]?.public_url;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("products.title")}</h1>
            <Badge variant="outline" className="text-xs">
              {websiteName}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{t("products.subtitle")}</p>
        </div>

        {/* Tier Limit Banner */}
        {atProductLimit && tierLimit && (
          <div className="w-full sm:w-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <span className="text-sm text-amber-800">
                {t("products.limitReached", { current: tierLimit.currentCount, max: tierLimit.maxLimit })}
                {tierLimit.upgradeUrl && (
                  <a href={tierLimit.upgradeUrl} className="underline hover:text-amber-700 ml-2">
                    {t("products.upgrade")}
                  </a>
                )}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={openAddModal}
          className="gap-2"
          disabled={atProductLimit}
          title={atProductLimit ? t("products.upgradeToAddMore") : undefined}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{t("products.addProduct")}</span>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Tier Limit Info */}
      {tierLimit && !atProductLimit && (
        <div className="text-sm text-gray-500">
          {t("products.tierQuota", {
            current: tierLimit.currentCount,
            max: tierLimit.maxLimit,
            tier: tierLimit.tier,
          })}
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">{t("products.totalProducts")}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">{t("products.activeProducts")}</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {products.filter((p) => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">{t("products.lowStock")}</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {products.filter((p) => p.stock !== -1 && p.stock <= p.low_stock_threshold && p.stock > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">{t("products.outOfStock")}</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {products.filter((p) => p.stock === 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            aria-label={t("products.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-auto h-9" aria-label={t("products.category")}>
              <SelectValue placeholder={t("products.filterAllCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("products.filterAllCategories")} ({totalProducts})
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div
          role="region"
          aria-label={t("products.bulkActions")}
          className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm font-medium text-blue-800">
            {t("products.selectedCount", { count: selectedProducts.length })}
          </span>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction("activate")} disabled={bulkActionLoading}>
            <Check className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t("products.bulkActivate")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction("deactivate")} disabled={bulkActionLoading}>
            <X className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t("products.bulkDeactivate")}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")} disabled={bulkActionLoading}>
            <Trash className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t("products.bulkDelete")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
            Batal
          </Button>
        </div>
      )}

      {/* Products Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Store className="h-10 w-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <CardTitle className="text-base">
              {search || selectedCategory !== "all" ? t("products.noProductsSearch") : t("products.noProducts")}
            </CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              {search || selectedCategory !== "all"
                ? t("products.noResultsHint")
                : t("products.noProductsDesc")}
            </CardDescription>
            <Button onClick={openAddModal} className="mt-4 gap-2" disabled={atProductLimit}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t("products.addFirstProduct")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <Card
                key={prod.id}
                className={`hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between p-4 ${
                  selectedProducts.includes(prod.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(prod.id)}
                        onChange={() => toggleSelectProduct(prod.id)}
                        aria-label={t("products.selectProduct", { name: prod.name })}
                        className="mt-0.5 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {prod.category}
                          </Badge>
                          {getStockBadge(prod)}
                          <Badge
                            variant={prod.is_active ? "success" : "secondary"}
                            className="text-xs gap-1"
                          >
                            {prod.is_active ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                {t("products.active")}
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" aria-hidden="true" />
                                {t("products.inactive")}
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-bold text-gray-900 shrink-0 whitespace-nowrap">
                      Rp {prod.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {primaryImage(prod) && (
                    <div className="mb-3">
                      <img
                        src={primaryImage(prod)}
                        alt={prod.name}
                        loading="lazy"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {prod.description || t("products.noDescription")}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1"
                  >
                    <a
                      href={testWaLink(prod)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t("products.testWhatsApp")}: ${prod.name}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t("products.testWhatsApp")}</span>
                    </a>
                  </Button>

                  <div className="flex items-center gap-1 ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-gray-900"
                          aria-label={t("products.productActions", { name: prod.name })}
                        >
                          <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(prod)}>
                          <Edit2 className="w-4 h-4 mr-2" aria-hidden="true" /> {t("products.editProduct")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(prod)}>
                          {prod.is_active ? (
                            <>
                              <X className="w-4 h-4 mr-2" aria-hidden="true" /> {t("products.bulkDeactivate")}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" aria-hidden="true" /> {t("products.bulkActivate")}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(prod.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" /> {t("products.deleteProduct")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2"
              aria-label={t("products.page", { current: page, total: totalPages })}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={t("products.prevPage")}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-gray-600">
                {t("products.page", { current: page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label={t("products.nextPage")}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}

      {/* Modal Tambah/Edit Produk — F3-3: satu sumber form (ProductForm) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? t("products.editProduct") : t("products.addProduct")}</DialogTitle>
            <DialogDescription>
              {editProduct ? t("products.editDesc") : t("products.addDesc")}
            </DialogDescription>
          </DialogHeader>

          <ProductForm
            initialData={editProduct}
            onSubmit={handleProductSubmit}
            onCancel={() => setModalOpen(false)}
            submitText={t("products.saveProduct")}
            maxImages={tierLimits.maxImagesPerProduct}
            maxFileSizeMb={tierLimits.maxFileSizeMb}
            categories={categoryOptions}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
