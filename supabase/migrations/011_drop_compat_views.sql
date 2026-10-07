-- Migration 011: Drop deprecated compat views
-- All app code now uses prefixed tables directly (verified: zero .from("old")
-- in src/app non-test code). Views were a transitional shim from the rename era.

DROP VIEW IF EXISTS websites;
DROP VIEW IF EXISTS website_settings;
DROP VIEW IF EXISTS products;
DROP VIEW IF EXISTS product_images;
DROP VIEW IF EXISTS product_variants;
DROP VIEW IF EXISTS stock_movements;
DROP VIEW IF EXISTS orders;
DROP VIEW IF EXISTS domain_orders;
DROP VIEW IF EXISTS plans;
DROP VIEW IF EXISTS tier_limits;
DROP VIEW IF EXISTS subscriptions;
DROP VIEW IF EXISTS user_templates;