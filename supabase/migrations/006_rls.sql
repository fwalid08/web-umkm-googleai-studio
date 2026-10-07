-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 006: Row Level Security enable + policies.

ALTER TABLE "public"."acc_accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."acc_journals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."acc_ledgers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."acc_reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."acc_tax_calculations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."anl_exports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."anl_reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bill_plans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bill_subscriptions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bill_tier_limits" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bld_template_tiers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bld_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bld_user_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dom_orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hrm_attendance" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hrm_employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hrm_shifts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_features" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_global_subs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_pack_features" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_packs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_site_prices" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_sub_addons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mod_usage" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ong_rates_cache" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ong_usage_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ord_customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ord_orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pay_payslips" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pay_refunds" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pay_tax" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pay_thr" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pay_transactions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_images" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_stock_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_stock_movements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prod_variants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."wgt_broadcasts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."wgt_deliveries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."wgt_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ws_pages_quota" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ws_settings" ENABLE ROW LEVEL SECURITY;
