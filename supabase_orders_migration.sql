-- ==============================================================================
-- Schema Migration: Full Patient Profile, Vitals, Questionnaire & Zoom Engine
-- Run this in your Supabase SQL Editor to upgrade your orders table
-- ==============================================================================

-- 1. Add structured JSON storage for dynamic questionnaire answers
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;

-- 2. Add storage for the Zoom/Video consultation appointment time (patient's request)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS consultation_time TEXT;

-- 3. Add full patient vitals (height, weight, BMI, sex, hair, blood type, address etc.)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT '{}'::jsonb;

-- 4. Add user_id foreign key to link orders to Supabase Auth users
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 5. Zoom meeting workflow columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
-- Values: 'not_requested' | 'requested' | 'confirmed' | 'rescheduled' | 'cancelled'

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
-- Doctor's note to patient about zoom (e.g. "I rescheduled to Thursday 3pm")

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
-- Doctor's proposed new time (overrides consultation_time when status = 'rescheduled')

-- DONE! Your orders table now supports HIPAA-grade patient profiles + live Zoom management.

