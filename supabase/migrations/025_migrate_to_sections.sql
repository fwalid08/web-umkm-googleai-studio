UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{design_style_id}',
  '"minimalist"'::jsonb
)
WHERE custom_config ? 'design_style_id' = FALSE;

UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{sections}',
  '[]'::jsonb
)
WHERE custom_config ? 'sections' = FALSE;

UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{header}',
  '{}'::jsonb
)
WHERE custom_config ? 'header' = FALSE;

UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{footer}',
  '{}'::jsonb
)
WHERE custom_config ? 'footer' = FALSE;

UPDATE websites
SET design_style_id = 'minimalist'
WHERE design_style_id IS NULL;
