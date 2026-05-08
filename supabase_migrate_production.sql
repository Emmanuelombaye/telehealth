-- ============================================================
-- Peak Health TeleHealth - Production Tables Migration
-- Run this once to create all missing production tables
-- ============================================================

-- 1. Doctor Schedules
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL DEFAULT '{}',
  timezone TEXT DEFAULT 'America/New_York',
  buffer_mins INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Doctors manage own schedule" ON public.doctor_schedules
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- 2. Lab Orders
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES auth.users(id),
  patient_id UUID,
  patient_name TEXT,
  tests TEXT[],
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'results-ready')),
  ordered_by TEXT,
  ordered_date TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated users access lab orders" ON public.lab_orders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. Lab Results (for patient-facing results)
CREATE TABLE IF NOT EXISTS public.lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  lab_order_id UUID REFERENCES public.lab_orders(id),
  panel_name TEXT NOT NULL,
  ordered_by TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
  tests JSONB DEFAULT '[]'::jsonb,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Patients view own lab results" ON public.lab_results
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY IF NOT EXISTS "Doctors insert lab results" ON public.lab_results
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Doctors update lab results" ON public.lab_results
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users access their own messages" ON public.messages
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

-- 5. Patient Documents
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Other',
  size TEXT,
  url TEXT,
  storage_path TEXT,
  new BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Patients manage own documents" ON public.patient_documents
  FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);
CREATE POLICY IF NOT EXISTS "Doctors view patient documents" ON public.patient_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES auth.users(id),
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
  consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'async', 'in_person')),
  video_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated users access appointments" ON public.appointments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. Prescriptions (standalone, separate from orders)
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES auth.users(id),
  order_id TEXT,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  refills_remaining INTEGER DEFAULT 0,
  pharmacy TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  doctor_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Patients view own prescriptions" ON public.prescriptions
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY IF NOT EXISTS "Doctors manage prescriptions" ON public.prescriptions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 8. Profiles table (ensure it exists with all needed columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Storage bucket for patient documents (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', true)
-- ON CONFLICT DO NOTHING;

SELECT 'Migration complete! All production tables created.' AS result;
