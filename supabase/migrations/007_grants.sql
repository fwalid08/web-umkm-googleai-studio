-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 007: Ownership, grants, comments, session preamble leftovers.

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

ALTER FUNCTION "public"."check_product_limit"("p_user_id" "uuid", "p_website_id" "uuid") OWNER TO "postgres";

ALTER FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";

ALTER FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";

ALTER FUNCTION "public"."log_stock_movement"("p_product_id" "uuid", "p_type" "text", "p_quantity" integer, "p_reference_id" "uuid", "p_reference_type" "text", "p_note" "text") OWNER TO "postgres";

ALTER FUNCTION "public"."reorder_products"("p_product_ids" "uuid"[], "p_orders" integer[]) OWNER TO "postgres";

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

ALTER FUNCTION "public"."uuid_generate_v4"() OWNER TO "postgres";

ALTER VIEW "public"."domain_orders" OWNER TO "postgres";

ALTER VIEW "public"."orders" OWNER TO "postgres";

ALTER VIEW "public"."plans" OWNER TO "postgres";

ALTER VIEW "public"."product_images" OWNER TO "postgres";

ALTER VIEW "public"."product_variants" OWNER TO "postgres";

ALTER VIEW "public"."products" OWNER TO "postgres";

ALTER VIEW "public"."stock_movements" OWNER TO "postgres";

ALTER VIEW "public"."subscriptions" OWNER TO "postgres";

ALTER VIEW "public"."tier_limits" OWNER TO "postgres";

ALTER VIEW "public"."user_templates" OWNER TO "postgres";

ALTER VIEW "public"."website_settings" OWNER TO "postgres";

ALTER VIEW "public"."websites" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."check_product_limit"("p_user_id" "uuid", "p_website_id" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."check_product_limit"("p_user_id" "uuid", "p_website_id" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."check_product_limit"("p_user_id" "uuid", "p_website_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."log_stock_movement"("p_product_id" "uuid", "p_type" "text", "p_quantity" integer, "p_reference_id" "uuid", "p_reference_type" "text", "p_note" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."log_stock_movement"("p_product_id" "uuid", "p_type" "text", "p_quantity" integer, "p_reference_id" "uuid", "p_reference_type" "text", "p_note" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."log_stock_movement"("p_product_id" "uuid", "p_type" "text", "p_quantity" integer, "p_reference_id" "uuid", "p_reference_type" "text", "p_note" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."reorder_products"("p_product_ids" "uuid"[], "p_orders" integer[]) TO "anon";

GRANT ALL ON FUNCTION "public"."reorder_products"("p_product_ids" "uuid"[], "p_orders" integer[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."reorder_products"("p_product_ids" "uuid"[], "p_orders" integer[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "anon";

GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "service_role";

GRANT ALL ON TABLE "public"."acc_accounts" TO "anon";

GRANT ALL ON TABLE "public"."acc_accounts" TO "authenticated";

GRANT ALL ON TABLE "public"."acc_accounts" TO "service_role";

GRANT ALL ON TABLE "public"."acc_journals" TO "anon";

GRANT ALL ON TABLE "public"."acc_journals" TO "authenticated";

GRANT ALL ON TABLE "public"."acc_journals" TO "service_role";

GRANT ALL ON TABLE "public"."acc_ledgers" TO "anon";

GRANT ALL ON TABLE "public"."acc_ledgers" TO "authenticated";

GRANT ALL ON TABLE "public"."acc_ledgers" TO "service_role";

GRANT ALL ON TABLE "public"."acc_reports" TO "anon";

GRANT ALL ON TABLE "public"."acc_reports" TO "authenticated";

GRANT ALL ON TABLE "public"."acc_reports" TO "service_role";

GRANT ALL ON TABLE "public"."acc_tax_calculations" TO "anon";

GRANT ALL ON TABLE "public"."acc_tax_calculations" TO "authenticated";

GRANT ALL ON TABLE "public"."acc_tax_calculations" TO "service_role";

GRANT ALL ON TABLE "public"."anl_exports" TO "anon";

GRANT ALL ON TABLE "public"."anl_exports" TO "authenticated";

GRANT ALL ON TABLE "public"."anl_exports" TO "service_role";

GRANT ALL ON TABLE "public"."anl_reports" TO "anon";

GRANT ALL ON TABLE "public"."anl_reports" TO "authenticated";

GRANT ALL ON TABLE "public"."anl_reports" TO "service_role";

GRANT ALL ON TABLE "public"."bill_plans" TO "anon";

GRANT ALL ON TABLE "public"."bill_plans" TO "authenticated";

GRANT ALL ON TABLE "public"."bill_plans" TO "service_role";

GRANT ALL ON TABLE "public"."bill_subscriptions" TO "anon";

GRANT ALL ON TABLE "public"."bill_subscriptions" TO "authenticated";

GRANT ALL ON TABLE "public"."bill_subscriptions" TO "service_role";

GRANT ALL ON TABLE "public"."bill_tier_limits" TO "anon";

GRANT ALL ON TABLE "public"."bill_tier_limits" TO "authenticated";

GRANT ALL ON TABLE "public"."bill_tier_limits" TO "service_role";

GRANT ALL ON TABLE "public"."bld_template_tiers" TO "anon";

GRANT ALL ON TABLE "public"."bld_template_tiers" TO "authenticated";

GRANT ALL ON TABLE "public"."bld_template_tiers" TO "service_role";

GRANT ALL ON TABLE "public"."bld_templates" TO "anon";

GRANT ALL ON TABLE "public"."bld_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."bld_templates" TO "service_role";

GRANT ALL ON TABLE "public"."bld_user_templates" TO "anon";

GRANT ALL ON TABLE "public"."bld_user_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."bld_user_templates" TO "service_role";

GRANT ALL ON TABLE "public"."dom_orders" TO "anon";

GRANT ALL ON TABLE "public"."dom_orders" TO "authenticated";

GRANT ALL ON TABLE "public"."dom_orders" TO "service_role";

GRANT ALL ON TABLE "public"."domain_orders" TO "anon";

GRANT ALL ON TABLE "public"."domain_orders" TO "authenticated";

GRANT ALL ON TABLE "public"."domain_orders" TO "service_role";

GRANT ALL ON TABLE "public"."hrm_attendance" TO "anon";

GRANT ALL ON TABLE "public"."hrm_attendance" TO "authenticated";

GRANT ALL ON TABLE "public"."hrm_attendance" TO "service_role";

GRANT ALL ON TABLE "public"."hrm_employees" TO "anon";

GRANT ALL ON TABLE "public"."hrm_employees" TO "authenticated";

GRANT ALL ON TABLE "public"."hrm_employees" TO "service_role";

GRANT ALL ON TABLE "public"."hrm_shifts" TO "anon";

GRANT ALL ON TABLE "public"."hrm_shifts" TO "authenticated";

GRANT ALL ON TABLE "public"."hrm_shifts" TO "service_role";

GRANT ALL ON TABLE "public"."mod_features" TO "anon";

GRANT ALL ON TABLE "public"."mod_features" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_features" TO "service_role";

GRANT ALL ON TABLE "public"."mod_global_subs" TO "anon";

GRANT ALL ON TABLE "public"."mod_global_subs" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_global_subs" TO "service_role";

GRANT ALL ON TABLE "public"."mod_pack_features" TO "anon";

GRANT ALL ON TABLE "public"."mod_pack_features" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_pack_features" TO "service_role";

GRANT ALL ON TABLE "public"."mod_packs" TO "anon";

GRANT ALL ON TABLE "public"."mod_packs" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_packs" TO "service_role";

GRANT ALL ON TABLE "public"."mod_site_prices" TO "anon";

GRANT ALL ON TABLE "public"."mod_site_prices" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_site_prices" TO "service_role";

GRANT ALL ON TABLE "public"."mod_sub_addons" TO "anon";

GRANT ALL ON TABLE "public"."mod_sub_addons" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_sub_addons" TO "service_role";

GRANT ALL ON TABLE "public"."mod_usage" TO "anon";

GRANT ALL ON TABLE "public"."mod_usage" TO "authenticated";

GRANT ALL ON TABLE "public"."mod_usage" TO "service_role";

GRANT ALL ON TABLE "public"."ong_rates_cache" TO "anon";

GRANT ALL ON TABLE "public"."ong_rates_cache" TO "authenticated";

GRANT ALL ON TABLE "public"."ong_rates_cache" TO "service_role";

GRANT ALL ON TABLE "public"."ong_usage_log" TO "anon";

GRANT ALL ON TABLE "public"."ong_usage_log" TO "authenticated";

GRANT ALL ON TABLE "public"."ong_usage_log" TO "service_role";

GRANT ALL ON TABLE "public"."ord_customers" TO "anon";

GRANT ALL ON TABLE "public"."ord_customers" TO "authenticated";

GRANT ALL ON TABLE "public"."ord_customers" TO "service_role";

GRANT ALL ON TABLE "public"."ord_orders" TO "anon";

GRANT ALL ON TABLE "public"."ord_orders" TO "authenticated";

GRANT ALL ON TABLE "public"."ord_orders" TO "service_role";

GRANT ALL ON TABLE "public"."orders" TO "anon";

GRANT ALL ON TABLE "public"."orders" TO "authenticated";

GRANT ALL ON TABLE "public"."orders" TO "service_role";

GRANT ALL ON TABLE "public"."pay_payslips" TO "anon";

GRANT ALL ON TABLE "public"."pay_payslips" TO "authenticated";

GRANT ALL ON TABLE "public"."pay_payslips" TO "service_role";

GRANT ALL ON TABLE "public"."pay_refunds" TO "anon";

GRANT ALL ON TABLE "public"."pay_refunds" TO "authenticated";

GRANT ALL ON TABLE "public"."pay_refunds" TO "service_role";

GRANT ALL ON TABLE "public"."pay_tax" TO "anon";

GRANT ALL ON TABLE "public"."pay_tax" TO "authenticated";

GRANT ALL ON TABLE "public"."pay_tax" TO "service_role";

GRANT ALL ON TABLE "public"."pay_thr" TO "anon";

GRANT ALL ON TABLE "public"."pay_thr" TO "authenticated";

GRANT ALL ON TABLE "public"."pay_thr" TO "service_role";

GRANT ALL ON TABLE "public"."pay_transactions" TO "anon";

GRANT ALL ON TABLE "public"."pay_transactions" TO "authenticated";

GRANT ALL ON TABLE "public"."pay_transactions" TO "service_role";

GRANT ALL ON TABLE "public"."plans" TO "anon";

GRANT ALL ON TABLE "public"."plans" TO "authenticated";

GRANT ALL ON TABLE "public"."plans" TO "service_role";

GRANT ALL ON TABLE "public"."prod_categories" TO "anon";

GRANT ALL ON TABLE "public"."prod_categories" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_categories" TO "service_role";

GRANT ALL ON TABLE "public"."prod_images" TO "anon";

GRANT ALL ON TABLE "public"."prod_images" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_images" TO "service_role";

GRANT ALL ON TABLE "public"."prod_products" TO "anon";

GRANT ALL ON TABLE "public"."prod_products" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_products" TO "service_role";

GRANT ALL ON TABLE "public"."prod_stock_logs" TO "anon";

GRANT ALL ON TABLE "public"."prod_stock_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_stock_logs" TO "service_role";

GRANT ALL ON TABLE "public"."prod_stock_movements" TO "anon";

GRANT ALL ON TABLE "public"."prod_stock_movements" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_stock_movements" TO "service_role";

GRANT ALL ON TABLE "public"."prod_variants" TO "anon";

GRANT ALL ON TABLE "public"."prod_variants" TO "authenticated";

GRANT ALL ON TABLE "public"."prod_variants" TO "service_role";

GRANT ALL ON TABLE "public"."product_images" TO "anon";

GRANT ALL ON TABLE "public"."product_images" TO "authenticated";

GRANT ALL ON TABLE "public"."product_images" TO "service_role";

GRANT ALL ON TABLE "public"."product_variants" TO "anon";

GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";

GRANT ALL ON TABLE "public"."product_variants" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";

GRANT ALL ON TABLE "public"."products" TO "authenticated";

GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON TABLE "public"."stock_movements" TO "anon";

GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";

GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";

GRANT ALL ON TABLE "public"."subscriptions" TO "anon";

GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";

GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";

GRANT ALL ON TABLE "public"."tier_limits" TO "anon";

GRANT ALL ON TABLE "public"."tier_limits" TO "authenticated";

GRANT ALL ON TABLE "public"."tier_limits" TO "service_role";

GRANT ALL ON TABLE "public"."user_templates" TO "anon";

GRANT ALL ON TABLE "public"."user_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."user_templates" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";

GRANT ALL ON TABLE "public"."users" TO "authenticated";

GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."ws_settings" TO "anon";

GRANT ALL ON TABLE "public"."ws_settings" TO "authenticated";

GRANT ALL ON TABLE "public"."ws_settings" TO "service_role";

GRANT ALL ON TABLE "public"."website_settings" TO "anon";

GRANT ALL ON TABLE "public"."website_settings" TO "authenticated";

GRANT ALL ON TABLE "public"."website_settings" TO "service_role";

GRANT ALL ON TABLE "public"."ws_websites" TO "anon";

GRANT ALL ON TABLE "public"."ws_websites" TO "authenticated";

GRANT ALL ON TABLE "public"."ws_websites" TO "service_role";

GRANT ALL ON TABLE "public"."websites" TO "anon";

GRANT ALL ON TABLE "public"."websites" TO "authenticated";

GRANT ALL ON TABLE "public"."websites" TO "service_role";

GRANT ALL ON TABLE "public"."wgt_broadcasts" TO "anon";

GRANT ALL ON TABLE "public"."wgt_broadcasts" TO "authenticated";

GRANT ALL ON TABLE "public"."wgt_broadcasts" TO "service_role";

GRANT ALL ON TABLE "public"."wgt_deliveries" TO "anon";

GRANT ALL ON TABLE "public"."wgt_deliveries" TO "authenticated";

GRANT ALL ON TABLE "public"."wgt_deliveries" TO "service_role";

GRANT ALL ON TABLE "public"."wgt_templates" TO "anon";

GRANT ALL ON TABLE "public"."wgt_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."wgt_templates" TO "service_role";

GRANT ALL ON TABLE "public"."ws_pages_quota" TO "anon";

GRANT ALL ON TABLE "public"."ws_pages_quota" TO "authenticated";

GRANT ALL ON TABLE "public"."ws_pages_quota" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

COMMENT ON SCHEMA "public" IS 'standard public schema';

COMMENT ON TABLE "public"."users" IS 'RLS enabled. Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS for admin ops. Anon users need auth.uid() match.';

SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

SET default_tablespace = '';

SET default_table_access_method = "heap";
