ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS portal_origin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_usd NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medication TEXT;
