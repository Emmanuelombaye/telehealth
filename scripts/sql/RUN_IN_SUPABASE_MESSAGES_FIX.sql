-- =============================================================================
-- PEAK HEALTH — MESSAGES FIX (paste in Supabase SQL Editor → RUN)
-- =============================================================================
-- Fixes brand admins unable to read patient↔doctor messages for their brand.
-- Requires get_auth_role(), get_auth_brand(), sub_brand_matches_auth_brand()
-- from RUN_IN_SUPABASE_ADMIN_PORTAL_FIXES.sql (run that first if not applied).
--
-- SAFE TO RE-RUN. Does not delete messages.
-- AFTER RUN: log out and back in as brand admin, open /admin/messages
-- =============================================================================

BEGIN;

-- Ensure is_read column exists (legacy installs used `read`)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read'
  ) THEN
    UPDATE public.messages SET is_read = COALESCE(is_read, read, false) WHERE is_read IS NULL;
  END IF;
END $$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Brand admin: read-only access to threads between patients and doctors on brand orders
DROP POLICY IF EXISTS "Messages: brand admin view scoped" ON public.messages;
CREATE POLICY "Messages: brand admin view scoped" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'brand_admin'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE public.sub_brand_matches_auth_brand(o.sub_brand)
        AND o.user_id IS NOT NULL
        AND o.doctor_id IS NOT NULL
        AND messages.sender_id IN (o.user_id, o.doctor_id)
        AND messages.receiver_id IN (o.user_id, o.doctor_id)
        AND messages.sender_id <> messages.receiver_id
    )
  );

COMMIT;

-- Verification
SELECT 'messages_brand_admin_policy' AS check_name,
       polname AS policy_name
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND polname = 'Messages: brand admin view scoped';

SELECT 'messages_count' AS check_name, count(*) AS total FROM public.messages;
