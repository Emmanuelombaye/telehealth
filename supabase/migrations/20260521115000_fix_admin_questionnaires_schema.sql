-- =============================================================================
-- Peak Health — Fix admin_questionnaires schema + products.features column
-- This corrects the base schema which had the wrong admin_questionnaires columns.
-- =============================================================================

-- Fix admin_questionnaires: add columns that the seed migration needs
-- The base schema created it without name/slug/questions - add them now
ALTER TABLE public.admin_questionnaires
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled questionnaire',
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Drop the old base schema columns that don't belong (if they exist)
ALTER TABLE public.admin_questionnaires
  DROP COLUMN IF EXISTS order_id,
  DROP COLUMN IF EXISTS patient_id,
  DROP COLUMN IF EXISTS template_id,
  DROP COLUMN IF EXISTS responses,
  DROP COLUMN IF EXISTS reviewer_id,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS sub_brand;

-- Ensure created_by column exists
ALTER TABLE public.admin_questionnaires
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix products table: add features column used by clinical seed
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Fix products table: add other commonly needed columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS dosage_info TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Ensure slug column exists on admin_questionnaires for the seed's ON CONFLICT
-- The seed uses ON CONFLICT (id) so we just need the columns to exist
-- Create a unique index on slug if it doesn't already exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_questionnaires_slug
  ON public.admin_questionnaires (slug)
  WHERE slug IS NOT NULL;
