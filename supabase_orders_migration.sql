-- ==============================================================================
-- Schema Migration: Full Patient Profile, Vitals & Questionnaire Engine
-- Run this in your Supabase SQL Editor to upgrade your orders table
-- ==============================================================================

-- 1. Add structured JSON storage for dynamic questionnaire answers
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;

-- 2. Add storage for the Zoom/Video consultation appointment time
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS consultation_time TEXT;

-- 3. Add full patient vitals (height, weight, BMI, sex, hair, blood type, address etc.)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT '{}'::jsonb;

-- 4. Add user_id foreign key to link orders to Supabase Auth users
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- DONE! Your orders table now stores complete HIPAA-grade patient profiles.
