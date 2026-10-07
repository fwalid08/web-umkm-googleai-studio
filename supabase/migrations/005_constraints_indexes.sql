-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 005: Column alters, FK constraints, indexes.

ALTER TABLE "public"."acc_accounts" OWNER TO "postgres";

ALTER TABLE "public"."acc_journals" OWNER TO "postgres";

ALTER TABLE "public"."acc_ledgers" OWNER TO "postgres";

ALTER TABLE "public"."acc_reports" OWNER TO "postgres";

ALTER TABLE "public"."acc_tax_calculations" OWNER TO "postgres";

ALTER TABLE "public"."anl_exports" OWNER TO "postgres";

ALTER TABLE "public"."anl_reports" OWNER TO "postgres";

ALTER TABLE "public"."bill_plans" OWNER TO "postgres";

ALTER TABLE "public"."bill_subscriptions" OWNER TO "postgres";

ALTER TABLE "public"."bill_tier_limits" OWNER TO "postgres";

ALTER TABLE "public"."bld_template_tiers" OWNER TO "postgres";

ALTER TABLE "public"."bld_templates" OWNER TO "postgres";

ALTER TABLE "public"."bld_user_templates" OWNER TO "postgres";

ALTER TABLE "public"."dom_orders" OWNER TO "postgres";

ALTER TABLE "public"."hrm_attendance" OWNER TO "postgres";

ALTER TABLE "public"."hrm_employees" OWNER TO "postgres";

ALTER TABLE "public"."hrm_shifts" OWNER TO "postgres";

ALTER TABLE "public"."mod_features" OWNER TO "postgres";

ALTER TABLE "public"."mod_global_subs" OWNER TO "postgres";

ALTER TABLE "public"."mod_pack_features" OWNER TO "postgres";

ALTER TABLE "public"."mod_packs" OWNER TO "postgres";

ALTER TABLE "public"."mod_site_prices" OWNER TO "postgres";

ALTER TABLE "public"."mod_sub_addons" OWNER TO "postgres";

ALTER TABLE "public"."mod_usage" OWNER TO "postgres";

ALTER TABLE "public"."ong_rates_cache" OWNER TO "postgres";

ALTER TABLE "public"."ong_usage_log" OWNER TO "postgres";

ALTER TABLE "public"."ord_customers" OWNER TO "postgres";

ALTER TABLE "public"."ord_orders" OWNER TO "postgres";

ALTER TABLE "public"."pay_payslips" OWNER TO "postgres";

ALTER TABLE "public"."pay_refunds" OWNER TO "postgres";

ALTER TABLE "public"."pay_tax" OWNER TO "postgres";

ALTER TABLE "public"."pay_thr" OWNER TO "postgres";

ALTER TABLE "public"."pay_transactions" OWNER TO "postgres";

ALTER TABLE "public"."prod_categories" OWNER TO "postgres";

ALTER TABLE "public"."prod_images" OWNER TO "postgres";

ALTER TABLE "public"."prod_products" OWNER TO "postgres";

ALTER TABLE "public"."prod_stock_logs" OWNER TO "postgres";

ALTER TABLE "public"."prod_stock_movements" OWNER TO "postgres";

ALTER TABLE "public"."prod_variants" OWNER TO "postgres";

ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER TABLE "public"."ws_settings" OWNER TO "postgres";

ALTER TABLE "public"."ws_websites" OWNER TO "postgres";

ALTER TABLE "public"."wgt_broadcasts" OWNER TO "postgres";

ALTER TABLE "public"."wgt_deliveries" OWNER TO "postgres";

ALTER TABLE "public"."wgt_templates" OWNER TO "postgres";

ALTER TABLE "public"."ws_pages_quota" OWNER TO "postgres";

ALTER TABLE ONLY "public"."acc_accounts"
    ADD CONSTRAINT "acc_accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."acc_accounts"
    ADD CONSTRAINT "acc_accounts_user_id_code_key" UNIQUE ("user_id", "code");

ALTER TABLE ONLY "public"."acc_journals"
    ADD CONSTRAINT "acc_journals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."acc_ledgers"
    ADD CONSTRAINT "acc_ledgers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."acc_reports"
    ADD CONSTRAINT "acc_reports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."acc_tax_calculations"
    ADD CONSTRAINT "acc_tax_calculations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."anl_exports"
    ADD CONSTRAINT "anl_exports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."anl_reports"
    ADD CONSTRAINT "anl_reports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bld_template_tiers"
    ADD CONSTRAINT "bld_template_tiers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bld_template_tiers"
    ADD CONSTRAINT "bld_template_tiers_template_id_tier_key" UNIQUE ("template_id", "tier");

ALTER TABLE ONLY "public"."bld_templates"
    ADD CONSTRAINT "bld_templates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bld_user_templates"
    ADD CONSTRAINT "bld_user_templates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bld_user_templates"
    ADD CONSTRAINT "bld_user_templates_website_id_template_id_key" UNIQUE ("website_id", "template_id");

ALTER TABLE ONLY "public"."dom_orders"
    ADD CONSTRAINT "domain_orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hrm_attendance"
    ADD CONSTRAINT "hrm_attendance_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hrm_employees"
    ADD CONSTRAINT "hrm_employees_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hrm_shifts"
    ADD CONSTRAINT "hrm_shifts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."mod_features"
    ADD CONSTRAINT "mod_features_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."mod_global_subs"
    ADD CONSTRAINT "mod_global_subs_payment_reference_key" UNIQUE ("payment_reference");

ALTER TABLE ONLY "public"."mod_global_subs"
    ADD CONSTRAINT "mod_global_subs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."mod_global_subs"
    ADD CONSTRAINT "mod_global_subs_user_id_feature_id_key" UNIQUE ("user_id", "feature_id");

ALTER TABLE ONLY "public"."mod_pack_features"
    ADD CONSTRAINT "mod_pack_features_pkey" PRIMARY KEY ("pack_id", "feature_id");

ALTER TABLE ONLY "public"."mod_packs"
    ADD CONSTRAINT "mod_packs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."mod_site_prices"
    ADD CONSTRAINT "mod_site_prices_pkey" PRIMARY KEY ("site_type", "tier", "cycle");

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_payment_reference_key" UNIQUE ("payment_reference");

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_subscription_id_website_id_feature_id_key" UNIQUE ("subscription_id", "website_id", "feature_id");

ALTER TABLE ONLY "public"."mod_usage"
    ADD CONSTRAINT "mod_usage_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ong_rates_cache"
    ADD CONSTRAINT "ong_rates_cache_origin_destination_weight_courier_key" UNIQUE ("origin", "destination", "weight", "courier");

ALTER TABLE ONLY "public"."ong_rates_cache"
    ADD CONSTRAINT "ong_rates_cache_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ong_usage_log"
    ADD CONSTRAINT "ong_usage_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ord_customers"
    ADD CONSTRAINT "ord_customers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ord_customers"
    ADD CONSTRAINT "ord_customers_website_id_phone_key" UNIQUE ("website_id", "phone");

ALTER TABLE ONLY "public"."ord_orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pay_payslips"
    ADD CONSTRAINT "pay_payslips_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pay_refunds"
    ADD CONSTRAINT "pay_refunds_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pay_tax"
    ADD CONSTRAINT "pay_tax_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pay_thr"
    ADD CONSTRAINT "pay_thr_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pay_transactions"
    ADD CONSTRAINT "pay_transactions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bill_plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bill_plans"
    ADD CONSTRAINT "plans_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."prod_categories"
    ADD CONSTRAINT "prod_categories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prod_categories"
    ADD CONSTRAINT "prod_categories_website_id_slug_key" UNIQUE ("website_id", "slug");

ALTER TABLE ONLY "public"."prod_stock_logs"
    ADD CONSTRAINT "prod_stock_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prod_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prod_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prod_products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prod_stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bill_subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bill_tier_limits"
    ADD CONSTRAINT "tier_limits_pkey" PRIMARY KEY ("tier");

ALTER TABLE ONLY "public"."ws_settings"
    ADD CONSTRAINT "uq_website_settings_website_id" UNIQUE ("website_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_google_id_key" UNIQUE ("google_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_subdomain_key" UNIQUE ("subdomain");

ALTER TABLE ONLY "public"."ws_settings"
    ADD CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ws_websites"
    ADD CONSTRAINT "websites_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ws_websites"
    ADD CONSTRAINT "websites_subdomain_key" UNIQUE ("subdomain");

ALTER TABLE ONLY "public"."wgt_broadcasts"
    ADD CONSTRAINT "wgt_broadcasts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."wgt_deliveries"
    ADD CONSTRAINT "wgt_deliveries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."wgt_templates"
    ADD CONSTRAINT "wgt_templates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ws_pages_quota"
    ADD CONSTRAINT "ws_pages_quota_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ws_pages_quota"
    ADD CONSTRAINT "ws_pages_quota_website_id_key" UNIQUE ("website_id");

ALTER TABLE ONLY "public"."acc_accounts"
    ADD CONSTRAINT "acc_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."acc_accounts"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."acc_accounts"
    ADD CONSTRAINT "acc_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."acc_journals"
    ADD CONSTRAINT "acc_journals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."acc_journals"
    ADD CONSTRAINT "acc_journals_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."acc_ledgers"
    ADD CONSTRAINT "acc_ledgers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."acc_accounts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."acc_ledgers"
    ADD CONSTRAINT "acc_ledgers_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."acc_journals"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."acc_reports"
    ADD CONSTRAINT "acc_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."acc_tax_calculations"
    ADD CONSTRAINT "acc_tax_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anl_exports"
    ADD CONSTRAINT "anl_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anl_exports"
    ADD CONSTRAINT "anl_exports_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anl_reports"
    ADD CONSTRAINT "anl_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anl_reports"
    ADD CONSTRAINT "anl_reports_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bld_template_tiers"
    ADD CONSTRAINT "bld_template_tiers_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."bld_templates"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bld_user_templates"
    ADD CONSTRAINT "bld_user_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."bld_templates"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bld_user_templates"
    ADD CONSTRAINT "bld_user_templates_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dom_orders"
    ADD CONSTRAINT "dom_orders_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dom_orders"
    ADD CONSTRAINT "domain_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_active_website" FOREIGN KEY ("active_website_id") REFERENCES "public"."ws_websites"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."hrm_attendance"
    ADD CONSTRAINT "hrm_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."hrm_attendance"
    ADD CONSTRAINT "hrm_attendance_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."hrm_shifts"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."hrm_employees"
    ADD CONSTRAINT "hrm_employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."hrm_shifts"
    ADD CONSTRAINT "hrm_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_global_subs"
    ADD CONSTRAINT "mod_global_subs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."mod_features"("id");

ALTER TABLE ONLY "public"."mod_global_subs"
    ADD CONSTRAINT "mod_global_subs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_pack_features"
    ADD CONSTRAINT "mod_pack_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."mod_features"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_pack_features"
    ADD CONSTRAINT "mod_pack_features_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."mod_packs"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."mod_features"("id");

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."bill_subscriptions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_sub_addons"
    ADD CONSTRAINT "mod_sub_addons_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_usage"
    ADD CONSTRAINT "mod_usage_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."mod_features"("id");

ALTER TABLE ONLY "public"."mod_usage"
    ADD CONSTRAINT "mod_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mod_usage"
    ADD CONSTRAINT "mod_usage_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ong_usage_log"
    ADD CONSTRAINT "ong_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ong_usage_log"
    ADD CONSTRAINT "ong_usage_log_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ord_customers"
    ADD CONSTRAINT "ord_customers_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ord_orders"
    ADD CONSTRAINT "ord_orders_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ord_orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_payslips"
    ADD CONSTRAINT "pay_payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_refunds"
    ADD CONSTRAINT "pay_refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."pay_transactions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_tax"
    ADD CONSTRAINT "pay_tax_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_thr"
    ADD CONSTRAINT "pay_thr_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_transactions"
    ADD CONSTRAINT "pay_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ord_orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_transactions"
    ADD CONSTRAINT "pay_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pay_transactions"
    ADD CONSTRAINT "pay_transactions_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_categories"
    ADD CONSTRAINT "prod_categories_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_images"
    ADD CONSTRAINT "prod_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."prod_products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_products"
    ADD CONSTRAINT "prod_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."prod_categories"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."prod_products"
    ADD CONSTRAINT "prod_products_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_stock_logs"
    ADD CONSTRAINT "prod_stock_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."prod_products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_stock_logs"
    ADD CONSTRAINT "prod_stock_logs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."prod_variants"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."prod_stock_movements"
    ADD CONSTRAINT "prod_stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."prod_products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prod_variants"
    ADD CONSTRAINT "prod_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."prod_products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bill_subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."bill_plans"("id");

ALTER TABLE ONLY "public"."ws_websites"
    ADD CONSTRAINT "websites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."wgt_broadcasts"
    ADD CONSTRAINT "wgt_broadcasts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."wgt_templates"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."wgt_broadcasts"
    ADD CONSTRAINT "wgt_broadcasts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."wgt_deliveries"
    ADD CONSTRAINT "wgt_deliveries_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "public"."wgt_broadcasts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."wgt_templates"
    ADD CONSTRAINT "wgt_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ws_pages_quota"
    ADD CONSTRAINT "ws_pages_quota_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ws_settings"
    ADD CONSTRAINT "ws_settings_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."ws_websites"("id") ON DELETE CASCADE;

CREATE INDEX "idx_acc_accounts_type" ON "public"."acc_accounts" USING "btree" ("type");

CREATE INDEX "idx_acc_accounts_user" ON "public"."acc_accounts" USING "btree" ("user_id");

CREATE INDEX "idx_acc_journals_date" ON "public"."acc_journals" USING "btree" ("date");

CREATE INDEX "idx_acc_journals_reference" ON "public"."acc_journals" USING "btree" ("reference_type", "reference_id");

CREATE INDEX "idx_acc_journals_user" ON "public"."acc_journals" USING "btree" ("user_id");

CREATE INDEX "idx_acc_ledgers_account" ON "public"."acc_ledgers" USING "btree" ("account_id");

CREATE INDEX "idx_acc_ledgers_journal" ON "public"."acc_ledgers" USING "btree" ("journal_id");

CREATE INDEX "idx_acc_reports_period" ON "public"."acc_reports" USING "btree" ("period_start", "period_end");

CREATE INDEX "idx_acc_reports_type" ON "public"."acc_reports" USING "btree" ("report_type");

CREATE INDEX "idx_acc_reports_user" ON "public"."acc_reports" USING "btree" ("user_id");

CREATE INDEX "idx_acc_tax_period" ON "public"."acc_tax_calculations" USING "btree" ("period_start", "period_end");

CREATE INDEX "idx_acc_tax_user" ON "public"."acc_tax_calculations" USING "btree" ("user_id");

CREATE INDEX "idx_anl_exports_status" ON "public"."anl_exports" USING "btree" ("status");

CREATE INDEX "idx_anl_exports_user" ON "public"."anl_exports" USING "btree" ("user_id");

CREATE INDEX "idx_anl_exports_website" ON "public"."anl_exports" USING "btree" ("website_id");

CREATE INDEX "idx_anl_reports_period" ON "public"."anl_reports" USING "btree" ("period_start", "period_end");

CREATE INDEX "idx_anl_reports_user" ON "public"."anl_reports" USING "btree" ("user_id");

CREATE INDEX "idx_anl_reports_website" ON "public"."anl_reports" USING "btree" ("website_id");

CREATE INDEX "idx_bill_subscriptions_pack_id" ON "public"."bill_subscriptions" USING "btree" ("pack_id");

CREATE INDEX "idx_bill_subscriptions_site_type" ON "public"."bill_subscriptions" USING "btree" ("site_type");

CREATE INDEX "idx_bill_subscriptions_user_site_type" ON "public"."bill_subscriptions" USING "btree" ("user_id", "site_type");

CREATE INDEX "idx_bld_template_tiers_template" ON "public"."bld_template_tiers" USING "btree" ("template_id");

CREATE INDEX "idx_bld_templates_category" ON "public"."bld_templates" USING "btree" ("category");

CREATE INDEX "idx_bld_templates_site_types" ON "public"."bld_templates" USING "gin" ("site_types");

CREATE INDEX "idx_bld_user_templates_template" ON "public"."bld_user_templates" USING "btree" ("template_id");

CREATE INDEX "idx_bld_user_templates_website" ON "public"."bld_user_templates" USING "btree" ("website_id");

CREATE INDEX "idx_dom_orders_domain" ON "public"."dom_orders" USING "btree" ("domain");

CREATE INDEX "idx_dom_orders_status" ON "public"."dom_orders" USING "btree" ("status");

CREATE INDEX "idx_dom_orders_website_id" ON "public"."dom_orders" USING "btree" ("website_id");

CREATE INDEX "idx_domain_orders_domain" ON "public"."dom_orders" USING "btree" ("domain");

CREATE INDEX "idx_domain_orders_expires_at" ON "public"."dom_orders" USING "btree" ("expires_at") WHERE (("status")::"text" = 'active'::"text");

CREATE INDEX "idx_domain_orders_status" ON "public"."dom_orders" USING "btree" ("status");

CREATE INDEX "idx_domain_orders_user_id" ON "public"."dom_orders" USING "btree" ("user_id");

CREATE INDEX "idx_domain_orders_verification" ON "public"."dom_orders" USING "btree" ("verification_token") WHERE ("verification_token" IS NOT NULL);

CREATE INDEX "idx_domain_orders_website_id" ON "public"."dom_orders" USING "btree" ("website_id");

CREATE INDEX "idx_hrm_attendance_date" ON "public"."hrm_attendance" USING "btree" ("date");

CREATE INDEX "idx_hrm_attendance_employee" ON "public"."hrm_attendance" USING "btree" ("employee_id");

CREATE INDEX "idx_hrm_attendance_status" ON "public"."hrm_attendance" USING "btree" ("status");

CREATE INDEX "idx_hrm_employees_status" ON "public"."hrm_employees" USING "btree" ("status");

CREATE INDEX "idx_hrm_employees_user" ON "public"."hrm_employees" USING "btree" ("user_id");

CREATE INDEX "idx_hrm_shifts_user" ON "public"."hrm_shifts" USING "btree" ("user_id");

CREATE INDEX "idx_mod_features_scope" ON "public"."mod_features" USING "btree" ("scope");

CREATE INDEX "idx_mod_features_site_types" ON "public"."mod_features" USING "gin" ("site_types");

CREATE INDEX "idx_mod_global_subs_feature" ON "public"."mod_global_subs" USING "btree" ("feature_id");

CREATE INDEX "idx_mod_global_subs_user" ON "public"."mod_global_subs" USING "btree" ("user_id");

CREATE INDEX "idx_mod_global_subs_user_feature" ON "public"."mod_global_subs" USING "btree" ("user_id", "feature_id");

CREATE INDEX "idx_mod_pack_features_feature" ON "public"."mod_pack_features" USING "btree" ("feature_id");

CREATE INDEX "idx_mod_pack_features_pack" ON "public"."mod_pack_features" USING "btree" ("pack_id");

CREATE INDEX "idx_mod_packs_site_type" ON "public"."mod_packs" USING "btree" ("site_type");

CREATE INDEX "idx_mod_sub_addons_sub" ON "public"."mod_sub_addons" USING "btree" ("subscription_id");

CREATE INDEX "idx_mod_sub_addons_website" ON "public"."mod_sub_addons" USING "btree" ("website_id");

CREATE INDEX "idx_mod_sub_addons_website_feature" ON "public"."mod_sub_addons" USING "btree" ("website_id", "feature_id");

CREATE INDEX "idx_mod_usage_lookup" ON "public"."mod_usage" USING "btree" ("user_id", "website_id", "feature_id", "created_at");

CREATE INDEX "idx_mod_usage_website_feature_time" ON "public"."mod_usage" USING "btree" ("website_id", "feature_id", "created_at");

CREATE INDEX "idx_ong_rates_cache_expires" ON "public"."ong_rates_cache" USING "btree" ("expires_at");

CREATE INDEX "idx_ong_rates_cache_lookup" ON "public"."ong_rates_cache" USING "btree" ("origin", "destination", "weight", "courier");

CREATE INDEX "idx_ong_usage_log_user" ON "public"."ong_usage_log" USING "btree" ("user_id", "created_at");

CREATE INDEX "idx_ong_usage_log_website" ON "public"."ong_usage_log" USING "btree" ("website_id", "created_at");

CREATE INDEX "idx_ord_customers_phone" ON "public"."ord_customers" USING "btree" ("phone");

CREATE INDEX "idx_ord_customers_website" ON "public"."ord_customers" USING "btree" ("website_id");

CREATE INDEX "idx_ord_orders_customer_phone" ON "public"."ord_orders" USING "btree" ("customer_phone");

CREATE INDEX "idx_ord_orders_status" ON "public"."ord_orders" USING "btree" ("status");

CREATE INDEX "idx_ord_orders_website_id" ON "public"."ord_orders" USING "btree" ("website_id");

CREATE INDEX "idx_orders_order_date" ON "public"."ord_orders" USING "btree" ("order_date");

CREATE INDEX "idx_orders_status" ON "public"."ord_orders" USING "btree" ("status");

CREATE INDEX "idx_orders_user_id" ON "public"."ord_orders" USING "btree" ("user_id");

CREATE INDEX "idx_orders_user_status" ON "public"."ord_orders" USING "btree" ("user_id", "status");

CREATE INDEX "idx_orders_website_id" ON "public"."ord_orders" USING "btree" ("website_id");

CREATE INDEX "idx_pay_payslips_employee" ON "public"."pay_payslips" USING "btree" ("employee_id");

CREATE INDEX "idx_pay_payslips_period" ON "public"."pay_payslips" USING "btree" ("period_start", "period_end");

CREATE INDEX "idx_pay_payslips_status" ON "public"."pay_payslips" USING "btree" ("status");

CREATE INDEX "idx_pay_refunds_transaction" ON "public"."pay_refunds" USING "btree" ("transaction_id");

CREATE INDEX "idx_pay_tax_employee" ON "public"."pay_tax" USING "btree" ("employee_id");

CREATE INDEX "idx_pay_tax_period" ON "public"."pay_tax" USING "btree" ("period_start", "period_end");

CREATE INDEX "idx_pay_thr_employee" ON "public"."pay_thr" USING "btree" ("employee_id");

CREATE INDEX "idx_pay_thr_year" ON "public"."pay_thr" USING "btree" ("year");

CREATE INDEX "idx_pay_transactions_order" ON "public"."pay_transactions" USING "btree" ("order_id");

CREATE INDEX "idx_pay_transactions_status" ON "public"."pay_transactions" USING "btree" ("status");

CREATE INDEX "idx_pay_transactions_user" ON "public"."pay_transactions" USING "btree" ("user_id");

CREATE INDEX "idx_pay_transactions_website" ON "public"."pay_transactions" USING "btree" ("website_id");

CREATE INDEX "idx_prod_categories_website" ON "public"."prod_categories" USING "btree" ("website_id");

CREATE INDEX "idx_prod_images_product" ON "public"."prod_images" USING "btree" ("product_id");

CREATE INDEX "idx_prod_products_status" ON "public"."prod_products" USING "btree" ("status");

CREATE INDEX "idx_prod_products_website_id" ON "public"."prod_products" USING "btree" ("website_id");

CREATE INDEX "idx_prod_stock_logs_created" ON "public"."prod_stock_logs" USING "btree" ("created_at");

CREATE INDEX "idx_prod_stock_logs_product" ON "public"."prod_stock_logs" USING "btree" ("product_id");

CREATE INDEX "idx_prod_stock_movements_created" ON "public"."prod_stock_movements" USING "btree" ("created_at");

CREATE INDEX "idx_prod_stock_movements_product" ON "public"."prod_stock_movements" USING "btree" ("product_id");

CREATE INDEX "idx_prod_variants_product" ON "public"."prod_variants" USING "btree" ("product_id");

CREATE INDEX "idx_product_images_primary" ON "public"."prod_images" USING "btree" ("product_id", "is_primary") WHERE ("is_primary" = true);

CREATE INDEX "idx_product_images_product_id" ON "public"."prod_images" USING "btree" ("product_id");

CREATE INDEX "idx_product_variants_product_id" ON "public"."prod_variants" USING "btree" ("product_id");

CREATE INDEX "idx_product_variants_sku" ON "public"."prod_variants" USING "btree" ("sku") WHERE ("sku" IS NOT NULL);

CREATE INDEX "idx_products_category" ON "public"."prod_products" USING "btree" ("website_id", "category");

CREATE INDEX "idx_products_sort_order" ON "public"."prod_products" USING "btree" ("website_id", "sort_order");

CREATE INDEX "idx_products_website_active" ON "public"."prod_products" USING "btree" ("website_id", "is_active") WHERE ("is_active" = true);

CREATE INDEX "idx_products_website_id" ON "public"."prod_products" USING "btree" ("website_id");

CREATE INDEX "idx_stock_movements_created_at" ON "public"."prod_stock_movements" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_stock_movements_product_id" ON "public"."prod_stock_movements" USING "btree" ("product_id");

CREATE INDEX "idx_sub_payment_ref" ON "public"."bill_subscriptions" USING "btree" ("payment_reference");

CREATE INDEX "idx_sub_user" ON "public"."bill_subscriptions" USING "btree" ("user_id");

CREATE INDEX "idx_subscriptions_status" ON "public"."bill_subscriptions" USING "btree" ("status");

CREATE INDEX "idx_subscriptions_user_id" ON "public"."bill_subscriptions" USING "btree" ("user_id");

CREATE INDEX "idx_users_auth_provider" ON "public"."users" USING "btree" ("auth_provider");

CREATE INDEX "idx_users_custom_domain" ON "public"."users" USING "btree" ("custom_domain");

CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");

CREATE INDEX "idx_users_google_id" ON "public"."users" USING "btree" ("google_id");

CREATE INDEX "idx_users_subdomain" ON "public"."users" USING "btree" ("subdomain");

CREATE INDEX "idx_website_settings_website_id" ON "public"."ws_settings" USING "btree" ("website_id");

CREATE INDEX "idx_websites_custom_domain" ON "public"."ws_websites" USING "btree" ("custom_domain");

CREATE INDEX "idx_websites_subdomain" ON "public"."ws_websites" USING "btree" ("subdomain");

CREATE INDEX "idx_websites_template_slug" ON "public"."ws_websites" USING "btree" ("template_slug");

CREATE INDEX "idx_websites_user_id" ON "public"."ws_websites" USING "btree" ("user_id");

CREATE INDEX "idx_websites_verification_token" ON "public"."ws_websites" USING "btree" ("custom_domain_verification_token");

CREATE INDEX "idx_wgt_broadcasts_status" ON "public"."wgt_broadcasts" USING "btree" ("status");

CREATE INDEX "idx_wgt_broadcasts_user" ON "public"."wgt_broadcasts" USING "btree" ("user_id");

CREATE INDEX "idx_wgt_deliveries_broadcast" ON "public"."wgt_deliveries" USING "btree" ("broadcast_id");

CREATE INDEX "idx_wgt_deliveries_status" ON "public"."wgt_deliveries" USING "btree" ("status");

CREATE INDEX "idx_wgt_templates_category" ON "public"."wgt_templates" USING "btree" ("category");

CREATE INDEX "idx_wgt_templates_user" ON "public"."wgt_templates" USING "btree" ("user_id");

CREATE INDEX "idx_ws_pages_quota_website" ON "public"."ws_pages_quota" USING "btree" ("website_id");

CREATE INDEX "idx_ws_websites_custom_domain" ON "public"."ws_websites" USING "btree" ("custom_domain");

CREATE INDEX "idx_ws_websites_site_type" ON "public"."ws_websites" USING "btree" ("site_type");

CREATE INDEX "idx_ws_websites_user_id" ON "public"."ws_websites" USING "btree" ("user_id");

CREATE UNIQUE INDEX "uq_domain_orders_payment_ref" ON "public"."dom_orders" USING "btree" ("payment_reference") WHERE ("payment_reference" IS NOT NULL);
