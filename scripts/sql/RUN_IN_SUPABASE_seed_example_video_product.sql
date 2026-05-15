-- =============================================================================
-- OPTIONAL — Enable video path on Semaglutide for testing
-- Run AFTER RUN_IN_SUPABASE_video_scheduling_bundle.sql
-- Replace YOUR_CALENDLY_URL with a real https://calendly.com/... or https://cal.com/... link
-- =============================================================================

UPDATE public.products
SET features = COALESCE(features, '{}'::jsonb) || jsonb_build_object(
  'requires_video_consult', true,
  'video_required_states', '[]'::jsonb,
  'scheduling_embed_url', 'YOUR_CALENDLY_URL'
)
WHERE name ILIKE '%Semaglutide%'
  AND active = true;

-- Verify
SELECT name,
       features->>'requires_video_consult' AS requires_video,
       features->>'scheduling_embed_url' AS scheduling_url
FROM public.products
WHERE name ILIKE '%Semaglutide%'
  AND active = true;
