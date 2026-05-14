-- ==========================================
-- STEP 7: AUTO-DOCTOR ROUTING & STEP 9C: REFUNDS
-- ==========================================

-- 1. Ensure profiles has required columns for routing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patients_count INTEGER DEFAULT 0;

-- 2. Helper function to increment patient count
CREATE OR REPLACE FUNCTION increment_patients_count(doctor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET patients_count = patients_count + 1
  WHERE id = doctor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper function to append to order timeline (JSONB)
CREATE OR REPLACE FUNCTION append_timeline_event(status_val TEXT, message_val TEXT)
RETURNS JSONB AS $$
DECLARE
  new_event JSONB;
BEGIN
  new_event := jsonb_build_object(
    'status', status_val,
    'date', TO_CHAR(NOW(), 'MM/DD/YYYY, HH:MI:SS AM'),
    'message', message_val
  );
  RETURN new_event;
END;
$$ LANGUAGE plpgsql;

-- 4. Step 7: Auto-Routing Trigger Function
CREATE OR REPLACE FUNCTION trigger_assign_doctor_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger if status is 'order_submitted' and no doctor is assigned
  IF (NEW.status = 'order_submitted' AND NEW.doctor_id IS NULL) THEN
    PERFORM net.http_post(
      url := 'https://' || current_setting('app.supabase_project_id') || '.supabase.co/functions/v1/assign-doctor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json', 
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'order_id', NEW.id, 
        'patient_state', NEW.patient_state
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Step 9C: Auto-Refund Trigger Function
CREATE OR REPLACE FUNCTION trigger_process_refund_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger if status changes to 'cancelled' and payment was successful
  IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.payment_status = 'paid') THEN
    PERFORM net.http_post(
      url := 'https://' || current_setting('app.supabase_project_id') || '.supabase.co/functions/v1/process-refund',
      headers := jsonb_build_object(
        'Content-Type', 'application/json', 
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'order_id', NEW.id, 
        'payment_intent_id', NEW.stripe_payment_intent_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach Triggers to Orders table
DROP TRIGGER IF EXISTS tr_assign_doctor ON public.orders;
CREATE TRIGGER tr_assign_doctor
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION trigger_assign_doctor_fn();

DROP TRIGGER IF EXISTS tr_process_refund ON public.orders;
CREATE TRIGGER tr_process_refund
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION trigger_process_refund_fn();

-- NOTE: Ensure 'pg_net' extension is enabled in your Supabase project settings.
-- CREATE EXTENSION IF NOT EXISTS pg_net;
