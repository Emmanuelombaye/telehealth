-- RPM: time-series readings from patient devices.
-- Apply once in Supabase SQL editor. Idempotent.

CREATE TABLE IF NOT EXISTS public.vital_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT,
    metric TEXT NOT NULL,           -- 'bp_sys', 'bp_dia', 'hr', 'spo2', 'glucose', 'weight'
    value NUMERIC NOT NULL,
    unit TEXT,
    source TEXT,                    -- 'apple_health', 'fitbit', 'cuff', 'manual'
    flagged BOOLEAN DEFAULT false,  -- elevated / abnormal flag
    recorded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vital_readings_patient_idx ON public.vital_readings(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS vital_readings_flagged_idx ON public.vital_readings(flagged) WHERE flagged = true;

ALTER TABLE public.vital_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patient sees own vitals" ON public.vital_readings;
CREATE POLICY "Patient sees own vitals" ON public.vital_readings
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patient inserts own vitals" ON public.vital_readings;
CREATE POLICY "Patient inserts own vitals" ON public.vital_readings
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Clinical staff sees all vitals" ON public.vital_readings;
CREATE POLICY "Clinical staff sees all vitals" ON public.vital_readings
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('doctor','brand_admin','super_admin','pharmacy')
      )
    );
