-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 002: All tables (final prefixed names, full columns). No renames, no dead tables.

CREATE TABLE IF NOT EXISTS "public"."acc_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "parent_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "acc_accounts_type_check" CHECK (("type" = ANY (ARRAY['asset'::"text", 'liability'::"text", 'equity'::"text", 'revenue'::"text", 'expense'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."acc_journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "website_id" "uuid",
    "date" timestamp with time zone NOT NULL,
    "reference_type" "text",
    "reference_id" "uuid",
    "description" "text" NOT NULL,
    "total_debit" integer DEFAULT 0 NOT NULL,
    "total_credit" integer DEFAULT 0 NOT NULL,
    "is_posted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "acc_journals_reference_type_check" CHECK (("reference_type" = ANY (ARRAY['order'::"text", 'manual'::"text", 'adjustment'::"text", 'payroll'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."acc_ledgers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "debit" integer DEFAULT 0 NOT NULL,
    "credit" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."acc_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "acc_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['profit_loss'::"text", 'balance_sheet'::"text", 'cash_flow'::"text", 'trial_balance'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."acc_tax_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "tax_type" "text" NOT NULL,
    "taxable_income" integer DEFAULT 0 NOT NULL,
    "tax_amount" integer DEFAULT 0 NOT NULL,
    "calculation_detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "acc_tax_calculations_tax_type_check" CHECK (("tax_type" = ANY (ARRAY['pph21'::"text", 'pph23'::"text", 'ppn'::"text", 'final'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."anl_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "website_id" "uuid",
    "export_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "file_url" "text",
    "file_size" integer,
    "row_count" integer,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "anl_exports_export_type_check" CHECK (("export_type" = ANY (ARRAY['orders'::"text", 'products'::"text", 'customers'::"text", 'full'::"text"]))),
    CONSTRAINT "anl_exports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."anl_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "website_id" "uuid",
    "report_type" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "anl_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'custom'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."bill_plans" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "slug" character varying(50) NOT NULL,
    "price_monthly" integer DEFAULT 0 NOT NULL,
    "max_websites" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price_yearly_monthly" integer DEFAULT 0 NOT NULL,
    "max_products" integer DEFAULT 5 NOT NULL,
    "max_images_per_product" integer DEFAULT 3 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."bill_subscriptions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "tier" character varying(20),
    "price_id" character varying(100),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "payment_gateway" character varying(50),
    "payment_reference" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "snap_token" "text",
    "paid_at" timestamp with time zone,
    "billing_cycle" "text" DEFAULT 'monthly'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "site_type" "text" DEFAULT 'online_shop'::"text" NOT NULL,
    "pack_id" "text",
    CONSTRAINT "subscriptions_billing_cycle_check" CHECK ((("billing_cycle" IS NULL) OR ("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"])))),
    CONSTRAINT "subscriptions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'past_due'::character varying, 'canceled'::character varying, 'incomplete'::character varying, 'incomplete_expired'::character varying])::"text"[]))),
    CONSTRAINT "subscriptions_tier_check" CHECK ((("tier")::"text" = ANY ((ARRAY['free'::character varying, 'starter'::character varying, 'growth'::character varying, 'enterprise'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."bill_tier_limits" (
    "tier" character varying(20) NOT NULL,
    "max_websites" integer NOT NULL,
    "max_products" integer NOT NULL,
    "max_orders_monthly" integer NOT NULL,
    "allow_custom_domain" boolean DEFAULT false NOT NULL,
    "included_domains" integer DEFAULT 0 NOT NULL,
    "allow_analytics_export" boolean DEFAULT false NOT NULL,
    "allow_customer_list" boolean DEFAULT false NOT NULL,
    "allow_stock_tracking" boolean DEFAULT false NOT NULL,
    "max_pages" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."bld_template_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bld_template_tiers_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'starter'::"text", 'growth'::"text", 'enterprise'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."bld_templates" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "category" "text" NOT NULL,
    "site_types" "text"[] DEFAULT '{online_shop}'::"text"[] NOT NULL,
    "tiers" "text"[] DEFAULT '{free,starter,growth,enterprise}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."bld_user_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "template_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."dom_orders" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "website_id" "uuid" NOT NULL,
    "domain" character varying(255) NOT NULL,
    "tld" character varying(20) NOT NULL,
    "price_monthly" integer DEFAULT 0 NOT NULL,
    "price_yearly" integer DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "sandbox" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registrar" character varying(50) DEFAULT 'mock'::character varying,
    "registrar_domain_id" character varying(100),
    "nameservers" "jsonb" DEFAULT '[]'::"jsonb",
    "dns_records" "jsonb" DEFAULT '[]'::"jsonb",
    "verification_token" character varying(100),
    "auto_renew" boolean DEFAULT true NOT NULL,
    "renewal_reminder_sent_at" timestamp with time zone,
    "reseller_tier" character varying(20) DEFAULT 'reseller'::character varying,
    "payment_reference" "text",
    "payment_provider" character varying(20) DEFAULT 'midtrans'::character varying,
    "paid_at" timestamp with time zone,
    "price" integer DEFAULT 0 NOT NULL,
    "billing_cycle" "text" DEFAULT 'yearly'::"text" NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dom_orders_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "domain_orders_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending_payment'::character varying, 'registering'::character varying, 'active'::character varying, 'failed'::character varying, 'expired'::character varying, 'deleted'::character varying, 'transfer_in'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."hrm_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_id" "uuid",
    "date" timestamp with time zone NOT NULL,
    "check_in" timestamp with time zone,
    "check_out" timestamp with time zone,
    "status" "text" DEFAULT 'present'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hrm_attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'late'::"text", 'leave'::"text", 'half_day'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."hrm_employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "position" "text",
    "department" "text",
    "salary" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "hired_at" timestamp with time zone,
    "terminated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hrm_employees_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'terminated'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."hrm_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "days" "text"[] DEFAULT '{monday,tuesday,wednesday,thursday,friday}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."mod_features" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "scope" "text" NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "site_types" "text"[],
    "requires" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "conflicts" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "mod_features_scope_check" CHECK (("scope" = ANY (ARRAY['website'::"text", 'global'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."mod_global_subs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feature_id" "text" NOT NULL,
    "status" "text" DEFAULT 'incomplete'::"text" NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "price_charged" integer DEFAULT 0 NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone DEFAULT "now"(),
    "payment_reference" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mod_global_subs_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text", 'once'::"text"]))),
    CONSTRAINT "mod_global_subs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'past_due'::"text", 'canceled'::"text", 'incomplete'::"text", 'incomplete_expired'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."mod_pack_features" (
    "pack_id" "text" NOT NULL,
    "feature_id" "text" NOT NULL,
    "quota" integer,
    "included_tiers" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."mod_packs" (
    "id" "text" NOT NULL,
    "site_type" "text" NOT NULL,
    "name" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."mod_site_prices" (
    "site_type" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "cycle" "text" NOT NULL,
    "price" integer NOT NULL,
    CONSTRAINT "mod_site_prices_cycle_check" CHECK (("cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "mod_site_prices_price_check" CHECK (("price" >= 0)),
    CONSTRAINT "mod_site_prices_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'starter'::"text", 'growth'::"text", 'enterprise'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."mod_sub_addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "website_id" "uuid" NOT NULL,
    "feature_id" "text" NOT NULL,
    "status" "text" DEFAULT 'incomplete'::"text" NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "price_charged" integer DEFAULT 0 NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone DEFAULT "now"(),
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "payment_reference" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mod_sub_addons_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text", 'once'::"text"]))),
    CONSTRAINT "mod_sub_addons_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'past_due'::"text", 'canceled'::"text", 'incomplete'::"text", 'incomplete_expired'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."mod_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "website_id" "uuid",
    "feature_id" "text" NOT NULL,
    "qty" integer DEFAULT 1 NOT NULL,
    "reference_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."ong_rates_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "origin" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "weight" integer NOT NULL,
    "courier" "text" NOT NULL,
    "rates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ong_rates_cache_weight_check" CHECK (("weight" > 0))
);

CREATE TABLE IF NOT EXISTS "public"."ong_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "origin" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "weight" integer NOT NULL,
    "courier" "text",
    "results_count" integer DEFAULT 0 NOT NULL,
    "cached" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ong_usage_log_weight_check" CHECK (("weight" > 0))
);

CREATE TABLE IF NOT EXISTS "public"."ord_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "address" "text",
    "total_orders" integer DEFAULT 0 NOT NULL,
    "total_spent" integer DEFAULT 0 NOT NULL,
    "last_order_at" timestamp with time zone,
    "first_order_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."ord_orders" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "product_name" character varying(255) NOT NULL,
    "product_price" integer NOT NULL,
    "quantity" integer DEFAULT 1,
    "total_amount" integer NOT NULL,
    "status" character varying(20) DEFAULT 'baru'::character varying,
    "order_date" timestamp with time zone DEFAULT "now"(),
    "customer_name" character varying(100),
    "customer_phone" character varying(20),
    "customer_email" character varying(255),
    "payment_method" character varying(20),
    "payment_status" character varying(20) DEFAULT 'pending'::character varying,
    "delivery_address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "website_id" "uuid" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" integer DEFAULT 0 NOT NULL,
    "shipping_cost" integer DEFAULT 0 NOT NULL,
    "total" integer DEFAULT 0 NOT NULL,
    "payment_reference" "text",
    "tracking_number" "text",
    "courier" "text",
    "confirmed_at" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "ord_orders_shipping_cost_check" CHECK (("shipping_cost" >= 0)),
    CONSTRAINT "ord_orders_subtotal_check" CHECK (("subtotal" >= 0)),
    CONSTRAINT "ord_orders_total_check" CHECK (("total" >= 0)),
    CONSTRAINT "orders_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['cash'::character varying, 'cod'::character varying, 'transfer'::character varying])::"text"[]))),
    CONSTRAINT "orders_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[]))),
    CONSTRAINT "orders_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['baru'::character varying, 'konfirmasi'::character varying, 'dikirim'::character varying, 'selesai'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pay_payslips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "base_salary" integer DEFAULT 0 NOT NULL,
    "allowances" integer DEFAULT 0 NOT NULL,
    "deductions" integer DEFAULT 0 NOT NULL,
    "gross_salary" integer DEFAULT 0 NOT NULL,
    "net_salary" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pay_payslips_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'approved'::"text", 'paid'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."pay_refunds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "pay_refunds_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "pay_refunds_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."pay_tax" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "tax_type" "text" NOT NULL,
    "taxable_income" integer DEFAULT 0 NOT NULL,
    "tax_amount" integer DEFAULT 0 NOT NULL,
    "calculation_detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pay_tax_tax_type_check" CHECK (("tax_type" = ANY (ARRAY['pph21'::"text", 'pph23'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."pay_thr" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "amount" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pay_thr_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."pay_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "website_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "provider" "text" NOT NULL,
    "provider_reference" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pay_transactions_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "pay_transactions_provider_check" CHECK (("provider" = ANY (ARRAY['midtrans'::"text", 'xendit'::"text", 'manual'::"text"]))),
    CONSTRAINT "pay_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text", 'expired'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."prod_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."prod_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text" NOT NULL,
    "alt_text" character varying(200),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "width" integer,
    "height" integer,
    "file_size" bigint,
    "mime_type" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."prod_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "price" bigint NOT NULL,
    "category" character varying(100) DEFAULT 'Umum'::character varying,
    "stock" integer DEFAULT 0 NOT NULL,
    "low_stock_threshold" integer DEFAULT 5 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "compare_at_price" integer,
    "track_stock" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "category_id" "uuid",
    CONSTRAINT "prod_products_compare_at_price_check" CHECK (("compare_at_price" >= 0)),
    CONSTRAINT "prod_products_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"]))),
    CONSTRAINT "products_price_check" CHECK (("price" >= 0)),
    CONSTRAINT "products_stock_check" CHECK (("stock" >= '-1'::integer))
);

CREATE TABLE IF NOT EXISTS "public"."prod_stock_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "change_qty" integer NOT NULL,
    "previous_qty" integer NOT NULL,
    "new_qty" integer NOT NULL,
    "reason" "text" NOT NULL,
    "reference_type" "text",
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."prod_stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "type" character varying(20) NOT NULL,
    "quantity" integer NOT NULL,
    "reference_id" "uuid",
    "reference_type" character varying(50),
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stock_movements_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['in'::character varying, 'out'::character varying, 'adjust'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."prod_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "name" character varying(200) NOT NULL,
    "sku" character varying(100),
    "price_adjustment" bigint DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "low_stock_threshold" integer DEFAULT 5 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_variants_stock_check" CHECK (("stock" >= '-1'::integer))
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(100),
    "business_type" character varying(20),
    "tier" character varying(20) DEFAULT 'free'::character varying,
    "subdomain" character varying(50),
    "custom_domain" character varying(255),
    "custom_domain_verified" boolean DEFAULT false,
    "custom_domain_verified_at" timestamp with time zone,
    "current_template_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_provider" character varying(20) DEFAULT 'credentials'::character varying,
    "google_id" character varying(255),
    "avatar_url" "text",
    "plan_id" "uuid",
    "active_website_id" "uuid",
    CONSTRAINT "users_auth_provider_check" CHECK ((("auth_provider")::"text" = ANY ((ARRAY['credentials'::character varying, 'google'::character varying])::"text"[]))),
    CONSTRAINT "users_business_type_check" CHECK ((("business_type")::"text" = ANY ((ARRAY['food'::character varying, 'fashion'::character varying, 'handicraft'::character varying, 'retail'::character varying, 'services'::character varying])::"text"[]))),
    CONSTRAINT "users_tier_check" CHECK ((("tier")::"text" = ANY ((ARRAY['free'::character varying, 'starter'::character varying, 'growth'::character varying, 'enterprise'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."ws_settings" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "currency" character varying(3) DEFAULT 'IDR'::character varying NOT NULL,
    "language" character varying(5) DEFAULT 'id'::character varying NOT NULL,
    "timezone" character varying(50) DEFAULT 'Asia/Jakarta'::character varying NOT NULL,
    "payment_methods" "jsonb" DEFAULT '["whatsapp"]'::"jsonb" NOT NULL,
    "notify_whatsapp_new_order" boolean DEFAULT true NOT NULL,
    "notify_email_daily_summary" boolean DEFAULT false NOT NULL,
    "notify_email_low_stock" boolean DEFAULT true NOT NULL,
    "store_name" character varying(100),
    "store_description" "text",
    "store_phone" character varying(20),
    "store_email" character varying(100),
    "store_address" "text",
    "operational_hours" "jsonb",
    "meta_title" character varying(100),
    "meta_description" character varying(300),
    "og_image_url" character varying(500),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_template_id" "uuid"
);

CREATE TABLE IF NOT EXISTS "public"."ws_websites" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) DEFAULT 'Website Utama'::character varying NOT NULL,
    "business_type" character varying(20),
    "subdomain" character varying(50),
    "custom_domain" character varying(255),
    "custom_domain_verified" boolean DEFAULT false,
    "custom_domain_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "custom_domain_verification_token" "text",
    "template_slug" "text",
    "site_type" "text" DEFAULT 'online_shop'::"text" NOT NULL,
    "max_pages" integer DEFAULT 10 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."wgt_broadcasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "name" "text" NOT NULL,
    "target_count" integer DEFAULT 0 NOT NULL,
    "sent_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wgt_broadcasts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."wgt_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "broadcast_id" "uuid" NOT NULL,
    "phone" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider_reference" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wgt_deliveries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'delivered'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."wgt_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "content" "text" NOT NULL,
    "variables" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wgt_templates_category_check" CHECK (("category" = ANY (ARRAY['order'::"text", 'promo'::"text", 'reminder'::"text", 'general'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."ws_pages_quota" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid" NOT NULL,
    "extra_pages" integer DEFAULT 0 NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "price_charged" integer DEFAULT 0 NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ws_pages_quota_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"])))
);
