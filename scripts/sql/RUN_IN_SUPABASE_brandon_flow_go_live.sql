-- =============================================================================
-- BRANDON FLOW — Go-live checklist (run after video_scheduling_bundle.sql)
-- =============================================================================
-- 1) Set each active doctor Calendly/Cal.com URL (master org → per-user event links)
-- 2) Configure products in Superadmin UI OR use seed script for one test protocol
-- 3) Supabase Dashboard → Database Webhooks on `orders` → email-trigger (INSERT + UPDATE)
-- 4) Deploy edge functions: calendly-webhook, merge-scheduling-pending, assign-doctor, email-trigger
-- 5) Calendly → Webhooks → invitee.created → your calendly-webhook URL
-- =============================================================================

-- Example: attach calendar to a doctor profile (replace URL and email)
-- UPDATE public.profiles
-- SET calendly_url = 'https://calendly.com/YOUR_ORG/30min',
--     licensed_states = 'CA,NY,TX'
-- WHERE role = 'doctor' AND status = 'active'
--   AND email = 'doctor@example.com';

-- Verify schema + config
SELECT 'profiles.calendly_url' AS item,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'calendly_url'
       ) AS ok
UNION ALL
SELECT 'active doctors with calendar',
       (SELECT COUNT(*)::int > 0 FROM public.profiles
        WHERE role = 'doctor' AND status = 'active'
          AND calendly_url IS NOT NULL AND calendly_url ~ '^https?://')
UNION ALL
SELECT 'video-capable products',
       (SELECT COUNT(*)::int FROM public.products
        WHERE active = true
          AND (
            COALESCE((features->>'requires_video_consult')::boolean, false)
            OR jsonb_array_length(COALESCE(features->'video_required_states', '[]'::jsonb)) > 0
            OR COALESCE(features->>'scheduling_embed_url', '') ~ '^https?://'
          ));

SELECT name,
       features->>'requires_video_consult' AS requires_video,
       features->>'scheduling_embed_url' AS product_calendar,
       jsonb_array_length(COALESCE(features->'questionnaire', '[]'::jsonb)) AS questionnaire_count
FROM public.products
WHERE active = true
ORDER BY name;

SELECT full_name, email, calendly_url, licensed_states
FROM public.profiles
WHERE role = 'doctor' AND status = 'active';
