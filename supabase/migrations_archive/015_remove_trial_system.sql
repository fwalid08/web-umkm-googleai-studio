-- 015_remove_trial_system.sql
-- Remove 14-day trial system, implement permanent Free tier with hard limits
-- Run in transaction

BEGIN;

-- 1. Add updated_at column to subscriptions (missing in initial schema)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create trigger for updated_at on subscriptions (idempotent: re-runnable)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 3. Drop trial_ends_at from users
ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;

-- 4. Update subscriptions status constraint (remove 'trialing')
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'));

-- 5. Migrate existing 'trialing' subscriptions to 'active' with tier='free'
UPDATE subscriptions 
SET status = 'active', 
    tier = 'free',
    updated_at = now()
WHERE status = 'trialing';

-- 6. Ensure all users have a subscription record (insert missing)
INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end, payment_gateway)
SELECT u.id, 'free', 'active', now(), now() + interval '1 year', 'none'
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE s.id IS NULL;

-- 7. Add tier_limits reference table (for easy querying + dynamic updates)
CREATE TABLE IF NOT EXISTS tier_limits (
    tier VARCHAR(20) PRIMARY KEY,
    max_websites INTEGER NOT NULL,
    max_products INTEGER NOT NULL,
    max_orders_monthly INTEGER NOT NULL, -- -1 = unlimited
    allow_custom_domain BOOLEAN NOT NULL DEFAULT false,
    included_domains INTEGER NOT NULL DEFAULT 0,
    allow_analytics_export BOOLEAN NOT NULL DEFAULT false,
    allow_customer_list BOOLEAN NOT NULL DEFAULT false,
    allow_stock_tracking BOOLEAN NOT NULL DEFAULT false,
    max_pages INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tier_limits (tier, max_websites, max_products, max_orders_monthly, allow_custom_domain, included_domains, allow_analytics_export, allow_customer_list, allow_stock_tracking, max_pages) VALUES
('free', 1, 5, 50, false, 0, false, false, false, 0),
('starter', 3, 50, -1, true, 1, true, true, true, 5),
('growth', 10, 200, -1, true, 3, true, true, true, 0),
('enterprise', 999, 9999, -1, true, 10, true, true, true, 0)
ON CONFLICT (tier) DO UPDATE SET
    max_websites = EXCLUDED.max_websites,
    max_products = EXCLUDED.max_products,
    max_orders_monthly = EXCLUDED.max_orders_monthly,
    allow_custom_domain = EXCLUDED.allow_custom_domain,
    included_domains = EXCLUDED.included_domains,
    allow_analytics_export = EXCLUDED.allow_analytics_export,
    allow_customer_list = EXCLUDED.allow_customer_list,
    allow_stock_tracking = EXCLUDED.allow_stock_tracking,
    max_pages = EXCLUDED.max_pages,
    updated_at = now();

-- 8. Add RLS to tier_limits (read-only for authenticated users, idempotent)
ALTER TABLE tier_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tier limits: authenticated read" ON tier_limits;
CREATE POLICY "Tier limits: authenticated read" ON tier_limits FOR SELECT TO authenticated USING (true);

-- 9. Trigger for updated_at on tier_limits (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tier_limits_updated_at') THEN
    CREATE TRIGGER tier_limits_updated_at
    BEFORE UPDATE ON tier_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 10. Log migration for audit (if audit_logs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (user_id, action, metadata, created_at)
        SELECT u.id, 'trial_removed_migrated_to_free', jsonb_build_object('migrated_at', now()), now()
        FROM users u
        JOIN subscriptions s ON s.user_id = u.id
        WHERE s.tier = 'free' AND s.status = 'active';
    END IF;
END $$;

COMMIT;