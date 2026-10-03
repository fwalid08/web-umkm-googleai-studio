-- 036_consolidate_templates_unified.sql
-- Consolidate templates: extend templates_library, migrate system templates, drop templates table

-- ============================================================
-- 1. EXTEND templates_library SCHEMA
-- ============================================================
ALTER TABLE templates_library 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) CHECK (category IN ('food','fashion','handicraft','retail','services')),
ADD COLUMN IF NOT EXISTS tier_requirement VARCHAR(20) CHECK (tier_requirement IN ('free','starter','growth','enterprise')),
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Index untuk query onboarding
CREATE INDEX IF NOT EXISTS idx_templates_library_category_tier 
ON templates_library (category, tier_requirement) 
WHERE scope = 'public';

-- ============================================================
-- 2. UPDATE RLS POLICY UNTUK TIER GATING
-- ============================================================
DROP POLICY IF EXISTS "Users manage own templates" ON templates_library;

CREATE POLICY "Templates library access" ON templates_library
  FOR ALL USING (
    -- Owner full access
    user_id = auth.uid() 
    OR 
    -- Public templates dengan tier gating
    (scope = 'public' AND (
      tier_requirement IS NULL 
      OR tier_requirement = 'free'
      OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (
          u.tier = 'enterprise' 
          OR (u.tier = 'growth' AND tier_requirement IN ('free','starter','growth'))
          OR (u.tier = 'starter' AND tier_requirement IN ('free','starter'))
        )
      )
    ))
  );

-- ============================================================
-- 3. MIGRATE DATA: INSERT 5 SYSTEM TEMPLATES KE templates_library
-- ============================================================
-- Get admin user_id for seeding
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try admin@saas.com first
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@saas.com' LIMIT 1;
  
  -- Fallback: first enterprise user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users WHERE tier = 'enterprise' LIMIT 1;
  END IF;
  
  -- Fallback: first starter user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users WHERE tier = 'starter' LIMIT 1;
  END IF;
  
  -- Fallback: first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users LIMIT 1;
  END IF;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found for seeding templates';
  END IF;

  -- ============================================================
  -- FOOD TEMPLATE
  -- ============================================================
  INSERT INTO templates_library (
    user_id, website_id, name, description, category, tier_requirement, 
    is_system_template, sort_order, template_data, scope
  ) VALUES (
    admin_user_id, NULL, 
    'Food Template', 
    'Template untuk usaha makanan & minuman: warung, cafe, catering, bakery',
    'food', 'free', true, 1,
    jsonb_build_object(
      'theme', jsonb_build_object(
        'palette', jsonb_build_object(
          'primary', '#EA580C', 'secondary', '#FEF3C7', 'accent', '#F97316',
          'background', '#FFF7ED', 'text', '#1C1917', 'text_light', '#78716C', 'border', '#FED7AA'
        ),
        'typography', jsonb_build_object('heading_font', 'Poppins', 'body_font', 'Inter', 'base_size', 16, 'scale_ratio', 1.25),
        'components', jsonb_build_object('borderRadius', 8, 'buttonStyle', 'solid', 'shadowStyle', 'md', 'navStyle', 'solid', 'footerStyle', 'columns'),
        'effects', jsonb_build_object('gradientBackgrounds', true)
      ),
      'headers', jsonb '[]',
      'footers', jsonb '[]',
      'sections', (
        SELECT sections_config FROM templates WHERE name = 'food'
      ),
      'animations', jsonb '[]',
      'behaviours', jsonb '[]',
      'assets', jsonb '[]',
      'customCss', ''
    ),
    'public'
  ) ON CONFLICT DO NOTHING;

  -- ============================================================
  -- FASHION TEMPLATE
  -- ============================================================
  INSERT INTO templates_library (
    user_id, website_id, name, description, category, tier_requirement, 
    is_system_template, sort_order, template_data, scope
  ) VALUES (
    admin_user_id, NULL, 
    'Fashion Template', 
    'Template untuk usaha fashion: baju, sepatu, tas, aksesoris, hijab',
    'fashion', 'starter', true, 2,
    jsonb_build_object(
      'theme', jsonb_build_object(
        'palette', jsonb_build_object(
          'primary', '#7C3AED', 'secondary', '#F3E8FF', 'accent', '#A855F7',
          'background', '#FAF5FF', 'text', '#1C1917', 'text_light', '#78716C', 'border', '#E9D5FF'
        ),
        'typography', jsonb_build_object('heading_font', 'Playfair Display', 'body_font', 'Inter', 'base_size', 16, 'scale_ratio', 1.2),
        'components', jsonb_build_object('borderRadius', 12, 'buttonStyle', 'gradient', 'shadowStyle', 'lg', 'navStyle', 'glass', 'footerStyle', 'centered'),
        'effects', jsonb_build_object('glassmorphism', true, 'gradientBackgrounds', true)
      ),
      'headers', jsonb '[]',
      'footers', jsonb '[]',
      'sections', (
        SELECT sections_config FROM templates WHERE name = 'fashion'
      ),
      'animations', jsonb '[]',
      'behaviours', jsonb '[]',
      'assets', jsonb '[]',
      'customCss', ''
    ),
    'public'
  ) ON CONFLICT DO NOTHING;

  -- ============================================================
  -- HANDICRAFT TEMPLATE
  -- ============================================================
  INSERT INTO templates_library (
    user_id, website_id, name, description, category, tier_requirement, 
    is_system_template, sort_order, template_data, scope
  ) VALUES (
    admin_user_id, NULL, 
    'Handicraft Template', 
    'Template untuk kerajinan tangan: anyaman, keramik, ukir kayu, batik, dll',
    'handicraft', 'free', true, 3,
    jsonb_build_object(
      'theme', jsonb_build_object(
        'palette', jsonb_build_object(
          'primary', '#92400E', 'secondary', '#FEF3C7', 'accent', '#D97706',
          'background', '#FFFDF5', 'text', '#1C1917', 'text_light', '#78716C', 'border', '#FDE68A'
        ),
        'typography', jsonb_build_object('heading_font', 'Merriweather', 'body_font', 'Inter', 'base_size', 16, 'scale_ratio', 1.15),
        'components', jsonb_build_object('borderRadius', 16, 'buttonStyle', 'solid', 'shadowStyle', 'md', 'navStyle', 'bordered', 'footerStyle', 'centered'),
        'effects', jsonb_build_object()
      ),
      'headers', jsonb '[]',
      'footers', jsonb '[]',
      'sections', (
        SELECT sections_config FROM templates WHERE name = 'handicraft'
      ),
      'animations', jsonb '[]',
      'behaviours', jsonb '[]',
      'assets', jsonb '[]',
      'customCss', ''
    ),
    'public'
  ) ON CONFLICT DO NOTHING;

  -- ============================================================
  -- RETAIL TEMPLATE
  -- ============================================================
  INSERT INTO templates_library (
    user_id, website_id, name, description, category, tier_requirement, 
    is_system_template, sort_order, template_data, scope
  ) VALUES (
    admin_user_id, NULL, 
    'Retail Template', 
    'Template untuk toko retail: minimarket, toko kelontong, fashion retail, elektronik',
    'retail', 'free', true, 4,
    jsonb_build_object(
      'theme', jsonb_build_object(
        'palette', jsonb_build_object(
          'primary', '#0891B2', 'secondary', '#CFFAFE', 'accent', '#06B6D4',
          'background', '#F0FDFF', 'text', '#1C1917', 'text_light', '#78716C', 'border', '#A5F3FC'
        ),
        'typography', jsonb_build_object('heading_font', 'Inter', 'body_font', 'Inter', 'base_size', 15, 'scale_ratio', 1.2),
        'components', jsonb_build_object('borderRadius', 8, 'buttonStyle', 'solid', 'shadowStyle', 'sm', 'navStyle', 'solid', 'footerStyle', 'simple'),
        'effects', jsonb_build_object('borderWidth', 1)
      ),
      'headers', jsonb '[]',
      'footers', jsonb '[]',
      'sections', (
        SELECT sections_config FROM templates WHERE name = 'retail'
      ),
      'animations', jsonb '[]',
      'behaviours', jsonb '[]',
      'assets', jsonb '[]',
      'customCss', ''
    ),
    'public'
  ) ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SERVICES TEMPLATE
  -- ============================================================
  INSERT INTO templates_library (
    user_id, website_id, name, description, category, tier_requirement, 
    is_system_template, sort_order, template_data, scope
  ) VALUES (
    admin_user_id, NULL, 
    'Services Template', 
    'Template untuk jasa: bengkel, salon, laundry, katering, les privat, repair HP',
    'services', 'free', true, 5,
    jsonb_build_object(
      'theme', jsonb_build_object(
        'palette', jsonb_build_object(
          'primary', '#15803D', 'secondary', '#DCFCE7', 'accent', '#22C55E',
          'background', '#F0FDF4', 'text', '#1C1917', 'text_light', '#78716C', 'border', '#86EFAC'
        ),
        'typography', jsonb_build_object('heading_font', 'Inter', 'body_font', 'Inter', 'base_size', 16, 'scale_ratio', 1.25),
        'components', jsonb_build_object('borderRadius', 8, 'buttonStyle', 'solid', 'shadowStyle', 'md', 'navStyle', 'solid', 'footerStyle', 'columns'),
        'effects', jsonb_build_object()
      ),
      'headers', jsonb '[]',
      'footers', jsonb '[]',
      'sections', (
        SELECT sections_config FROM templates WHERE name = 'services'
      ),
      'animations', jsonb '[]',
      'behaviours', jsonb '[]',
      'assets', jsonb '[]',
      'customCss', ''
    ),
    'public'
  ) ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- 4. MIGRATE user_templates FK: match by category/name
-- ============================================================
ALTER TABLE user_templates 
ADD COLUMN IF NOT EXISTS template_library_id UUID REFERENCES templates_library(id);

UPDATE user_templates ut
SET template_library_id = (
  SELECT tl.id
  FROM templates_library tl
  JOIN templates t ON t.id = ut.template_id
  WHERE tl.category = t.name AND tl.is_system_template = true
  LIMIT 1
);

-- ============================================================
-- 5. DROP TABLE templates CASCADE
-- ============================================================
DROP TABLE IF EXISTS templates CASCADE;

-- ============================================================
-- 6. RENAME COLUMN (Optional - for clarity)
-- ============================================================
-- ALTER TABLE user_templates RENAME COLUMN template_id TO template_legacy_id;
-- Keep template_library_id as the primary FK

-- ============================================================
-- 7. CLEANUP: Remove unused columns from user_templates if needed
-- ============================================================
-- ALTER TABLE user_templates DROP COLUMN IF EXISTS template_legacy_id;