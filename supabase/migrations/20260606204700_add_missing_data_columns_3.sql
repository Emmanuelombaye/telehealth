ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dea_schedule TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS pharmacy_name TEXT;
