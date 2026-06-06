ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ;
ALTER TABLE public.prescriptions ALTER COLUMN medication_name DROP NOT NULL;
