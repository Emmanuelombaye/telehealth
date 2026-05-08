-- Add MRN and Refill Logic to Orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refill_interval_days INTEGER DEFAULT 30;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS next_refill_at TIMESTAMPTZ;

-- Add Patient Vitals JSONB if missing (some old versions might not have it)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_vitals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_answers JSONB DEFAULT '{}'::jsonb;

-- Add Zoom fields if missing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_status TEXT DEFAULT 'not_requested';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_doctor_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zoom_rescheduled_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consultation_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create a function to auto-set next_refill_at when last_approved_at is updated
CREATE OR REPLACE FUNCTION public.set_next_refill_date()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'rx_sent' AND OLD.status != 'rx_sent') OR (NEW.last_approved_at IS NOT NULL AND (OLD.last_approved_at IS NULL OR NEW.last_approved_at != OLD.last_approved_at)) THEN
        NEW.last_approved_at = COALESCE(NEW.last_approved_at, now());
        NEW.next_refill_at = NEW.last_approved_at + (NEW.refill_interval_days || ' days')::interval;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_next_refill ON public.orders;
CREATE TRIGGER trigger_set_next_refill
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_next_refill_date();
