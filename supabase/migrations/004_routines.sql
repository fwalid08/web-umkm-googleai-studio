-- Squashed migration baseline (2026-10-07).
-- Generated from verified remote schema dump. Replaces migrations 000-053.
-- Deprecated objects removed: bookings, navigation_groups/items, layout_nodes,
-- design_styles, templates_library, old unprefixed tables (now prefixed),
-- intermediate rename dance. Demo/template seeds dropped (incompatible with
-- final schema; re-seed via app seed scripts).

-- 004: Functions + triggers.

-- Match pg_dump behavior so bodies are not validated at creation time.
SET check_function_bodies = false;

CREATE OR REPLACE FUNCTION "public"."check_product_limit"("p_user_id" "uuid", "p_website_id" "uuid") RETURNS TABLE("ok" boolean, "current_count" integer, "max_limit" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_tier TEXT;
    v_plan_max INTEGER;
    v_count INTEGER;
    v_max INTEGER;
BEGIN
    -- Get user tier and plan max (tolerates pre-013 DBs without the column)
    BEGIN
        SELECT u.tier, COALESCE(p.max_products, 0)
        INTO v_tier, v_plan_max
        FROM users u
        LEFT JOIN plans p ON p.id = u.plan_id
        WHERE u.id = p_user_id;
    EXCEPTION WHEN undefined_column THEN
        SELECT u.tier, 0 INTO v_tier, v_plan_max
        FROM users u
        WHERE u.id = p_user_id;
    END;

    -- Fallback tier limits
    v_max := CASE
        WHEN v_plan_max > 0 THEN v_plan_max
        WHEN v_tier = 'free' THEN 5
        WHEN v_tier = 'starter' THEN 50
        WHEN v_tier = 'growth' THEN 200
        WHEN v_tier = 'enterprise' THEN 9999
        ELSE 5
    END;

    -- Count current products for website
    SELECT COUNT(*) INTO v_count
    FROM products
    WHERE website_id = p_website_id;

    ok := v_count < v_max;
    current_count := v_count;
    max_limit := v_max;
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."decrement_product_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'decrement_product_stock: p_quantity harus > 0 (diberikan %)', p_quantity;
    END IF;

    UPDATE products
    SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - p_quantity END,
        updated_at = now()
    WHERE id = p_product_id
      AND (stock = -1 OR stock >= p_quantity)
      AND is_active = true;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."increment_product_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'increment_product_stock: p_quantity harus > 0 (diberikan %)', p_quantity;
    END IF;

    UPDATE products
    SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock + p_quantity END,
        updated_at = now()
    WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."log_stock_movement"("p_product_id" "uuid", "p_type" "text", "p_quantity" integer, "p_reference_id" "uuid" DEFAULT NULL::"uuid", "p_reference_type" "text" DEFAULT NULL::"text", "p_note" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO stock_movements (product_id, type, quantity, reference_id, reference_type, note)
    VALUES (p_product_id, p_type, p_quantity, p_reference_id, p_reference_type, p_note);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."reorder_products"("p_product_ids" "uuid"[], "p_orders" integer[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF array_length(p_product_ids, 1) IS DISTINCT FROM array_length(p_orders, 1) THEN
        RAISE EXCEPTION 'reorder_products: arrays must have equal length';
    END IF;
    UPDATE products AS p
    SET sort_order = v.ord,
        updated_at = now()
    FROM (
        SELECT unnest(p_product_ids) AS pid, unnest(p_orders) AS ord
    ) AS v
    WHERE p.id = v.pid;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."uuid_generate_v4"() RETURNS "uuid"
    LANGUAGE "sql"
    AS $$ SELECT extensions.uuid_generate_v4() $$;


CREATE OR REPLACE TRIGGER "product_variants_updated_at" BEFORE UPDATE ON "public"."prod_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "products_updated_at" BEFORE UPDATE ON "public"."prod_products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "tier_limits_updated_at" BEFORE UPDATE ON "public"."bill_tier_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_domain_orders_updated_at" BEFORE UPDATE ON "public"."dom_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."ord_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."bill_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_website_settings_updated_at" BEFORE UPDATE ON "public"."ws_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_websites_updated_at" BEFORE UPDATE ON "public"."ws_websites" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
