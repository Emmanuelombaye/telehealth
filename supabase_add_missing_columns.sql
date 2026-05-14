-- ═══════════════════════════════════════════════════════════════
-- PEAK HEALTH — Add Missing Columns to orders table (idempotent)
-- Run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════

-- Zoom / Video call columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested'
  CHECK (zoom_status IN ('not_requested','requested','confirmed','rescheduled','canceled'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_live BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_submitted_date TEXT;

-- Payment / Stripe columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending','paid','failed','refunded'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Clinical outcome columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS follow_up_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- KYC / Identity
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending'
  CHECK (kyc_status IN ('pending','verified','failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kyc_session_id TEXT;

-- Referral
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Patient email (for Resend email notifications)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_email TEXT;

-- Pharmacy note (shown in patient order tracking)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_note TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pharmacy_email TEXT;

-- Update order status enum to include 'cancelled' and 'follow_up'
-- (No enum type used — status is plain TEXT — nothing to change)

-- ═══════════════════════════════════════════════════════════════
-- notifications table: ensure 'video_consult' type is valid
-- ═══════════════════════════════════════════════════════════════
-- If the notifications.type CHECK constraint doesn't include 'video_consult', 
-- drop and recreate it:
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('appointment','lab','message','prescription','security','video_consult','other'));

-- ═══════════════════════════════════════════════════════════════
-- RLS: Allow service role to insert notifications (for edge functions)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read all notifications" ON public.notifications;
CREATE POLICY "Staff can read all notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor','brand_admin','super_admin')
    )
  );

RAISE NOTICE 'All missing columns added successfully.';
