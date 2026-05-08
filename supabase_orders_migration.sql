-- ==============================================================================
-- Schema Migration: Zoom Consultation & Questionnaire Engine
-- Run this in your Supabase SQL Editor to upgrade your orders table
-- ==============================================================================

-- 1. Add structured JSON storage for dynamic questionnaire answers
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;

-- 2. Add storage for the Zoom/Video consultation appointment time
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS consultation_time TEXT;

-- DONE! Your backend is now ready for dynamic patient forms and Zoom scheduling.
