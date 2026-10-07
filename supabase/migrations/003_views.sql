-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 003: Views.
-- NOTE: legacy-name views (websites, products, orders, ...) are a DEPRECATED
-- compatibility layer. App code (170+ queries) still uses old names.
-- New code MUST use prefixed tables. Remove these views only after code migration.

CREATE OR REPLACE VIEW "public"."domain_orders" AS
 SELECT "id",
    "user_id",
    "website_id",
    "domain",
    "tld",
    "price_monthly",
    "price_yearly",
    "status",
    "sandbox",
    "expires_at",
    "created_at",
    "updated_at",
    "registrar",
    "registrar_domain_id",
    "nameservers",
    "dns_records",
    "verification_token",
    "auto_renew",
    "renewal_reminder_sent_at",
    "reseller_tier",
    "payment_reference",
    "payment_provider",
    "paid_at"
   FROM "public"."dom_orders";

CREATE OR REPLACE VIEW "public"."orders" AS
 SELECT "id",
    "user_id",
    "product_name",
    "product_price",
    "quantity",
    "total_amount",
    "status",
    "order_date",
    "customer_name",
    "customer_phone",
    "customer_email",
    "payment_method",
    "payment_status",
    "delivery_address",
    "notes",
    "created_at",
    "updated_at",
    "website_id"
   FROM "public"."ord_orders";

CREATE OR REPLACE VIEW "public"."plans" AS
 SELECT "id",
    "name",
    "slug",
    "price_monthly",
    "max_websites",
    "is_active",
    "created_at",
    "price_yearly_monthly",
    "max_products",
    "max_images_per_product"
   FROM "public"."bill_plans";

CREATE OR REPLACE VIEW "public"."product_images" AS
 SELECT "id",
    "product_id",
    "storage_path",
    "public_url",
    "alt_text",
    "sort_order",
    "is_primary",
    "width",
    "height",
    "file_size",
    "mime_type",
    "created_at"
   FROM "public"."prod_images";

CREATE OR REPLACE VIEW "public"."product_variants" AS
 SELECT "id",
    "product_id",
    "name",
    "sku",
    "price_adjustment",
    "stock",
    "low_stock_threshold",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
   FROM "public"."prod_variants";

CREATE OR REPLACE VIEW "public"."products" AS
 SELECT "id",
    "website_id",
    "name",
    "description",
    "price",
    "category",
    "stock",
    "low_stock_threshold",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
   FROM "public"."prod_products";

CREATE OR REPLACE VIEW "public"."stock_movements" AS
 SELECT "id",
    "product_id",
    "variant_id",
    "type",
    "quantity",
    "reference_id",
    "reference_type",
    "note",
    "created_at"
   FROM "public"."prod_stock_movements";

CREATE OR REPLACE VIEW "public"."subscriptions" AS
 SELECT "id",
    "user_id",
    "tier",
    "price_id",
    "status",
    "current_period_start",
    "current_period_end",
    "canceled_at",
    "payment_gateway",
    "payment_reference",
    "created_at",
    "snap_token",
    "paid_at",
    "billing_cycle",
    "updated_at"
   FROM "public"."bill_subscriptions";

CREATE OR REPLACE VIEW "public"."tier_limits" AS
 SELECT "tier",
    "max_websites",
    "max_products",
    "max_orders_monthly",
    "allow_custom_domain",
    "included_domains",
    "allow_analytics_export",
    "allow_customer_list",
    "allow_stock_tracking",
    "max_pages",
    "created_at",
    "updated_at"
   FROM "public"."bill_tier_limits";

CREATE OR REPLACE VIEW "public"."user_templates" AS
 SELECT "id",
    "website_id",
    "template_id",
    "is_active",
    "applied_at",
    "created_at"
   FROM "public"."bld_user_templates";

CREATE OR REPLACE VIEW "public"."website_settings" AS
 SELECT "id",
    "website_id",
    "currency",
    "language",
    "timezone",
    "payment_methods",
    "notify_whatsapp_new_order",
    "notify_email_daily_summary",
    "notify_email_low_stock",
    "store_name",
    "store_description",
    "store_phone",
    "store_email",
    "store_address",
    "operational_hours",
    "meta_title",
    "meta_description",
    "og_image_url",
    "created_at",
    "updated_at",
    "user_template_id"
   FROM "public"."ws_settings";

CREATE OR REPLACE VIEW "public"."websites" AS
 SELECT "id",
    "user_id",
    "name",
    "business_type",
    "subdomain",
    "custom_domain",
    "custom_domain_verified",
    "custom_domain_verified_at",
    "created_at",
    "updated_at",
    "custom_domain_verification_token",
    "template_slug"
   FROM "public"."ws_websites";
