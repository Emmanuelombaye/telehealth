-- =============================================================================
-- Peak Health — BASE SCHEMA (runs first, creates all core tables)
-- Timestamp: 20200101000000 (ensures this runs before all other migrations)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES (users table — linked to auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'patient',
    brand_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- 2. BRANDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT,
    country TEXT,
    timezone TEXT,
    status TEXT DEFAULT 'active',
    plan TEXT DEFAULT 'Starter',
    since_date TEXT,
    patients_count INTEGER DEFAULT 0,
    doctors_count INTEGER DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    mrr NUMERIC DEFAULT 0,
    growth NUMERIC DEFAULT 0,
    products JSONB DEFAULT '[]'::jsonb,
    gateways JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    revenue_data JSONB DEFAULT '[]'::jsonb,
    orders_data JSONB DEFAULT '{"total":0,"pending":0,"shipped":0,"completed":0}'::jsonb,
    compliance JSONB DEFAULT '{"hipaa":false,"gdpr":false,"soc2":false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.brands;
CREATE POLICY "Enable read access for authenticated users"
    ON public.brands FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for super_admin" ON public.brands;
CREATE POLICY "Enable insert for super_admin"
    ON public.brands FOR INSERT TO authenticated
    WITH CHECK (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

DROP POLICY IF EXISTS "Enable update for super_admin" ON public.brands;
CREATE POLICY "Enable update for super_admin"
    ON public.brands FOR UPDATE TO authenticated
    USING (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

-- =============================================================================
-- 3. PRODUCTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    active BOOLEAN DEFAULT true,
    requires_prescription BOOLEAN DEFAULT false,
    brand_id TEXT,
    sub_brand TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products public read active" ON public.products;
CREATE POLICY "Products public read active"
    ON public.products FOR SELECT TO anon, authenticated
    USING (COALESCE(active, true) = true);

-- =============================================================================
-- 4. ORDERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','completed','cancelled','refunded')),
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'usd',
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    sub_brand TEXT,
    brand_id TEXT,
    shipping_address JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    video_required BOOLEAN DEFAULT false,
    enrollment_status TEXT DEFAULT 'pending',
    doctor_id UUID REFERENCES auth.users(id),
    pharmacy_id UUID,
    consultation_type TEXT,
    consult_routing_snapshot JSONB DEFAULT '{}'::jsonb,
    shipping_state TEXT,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders: patient view own" ON public.orders;
CREATE POLICY "Orders: patient view own" ON public.orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Orders: patient insert own" ON public.orders;
CREATE POLICY "Orders: patient insert own" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. APPOINTMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','canceled','no_show')),
    consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video','async','in_person')),
    video_url TEXT,
    zoom_meeting_id TEXT,
    calendly_event_uri TEXT,
    notes TEXT,
    brand_id TEXT,
    sub_brand TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.appointments;
CREATE POLICY "Enable read for authenticated users"
    ON public.appointments FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.appointments;
CREATE POLICY "Enable insert for authenticated users"
    ON public.appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- 6. MEDICAL RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES public.appointments(id),
    vitals JSONB DEFAULT '{}'::jsonb,
    allergies TEXT[],
    current_medications TEXT[],
    diagnoses TEXT[],
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.medical_records;
CREATE POLICY "Enable read for authenticated users"
    ON public.medical_records FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 7. PRESCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    refills_remaining INTEGER DEFAULT 0,
    pharmacy_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','fulfilled','expired','cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.prescriptions;
CREATE POLICY "Enable read for authenticated users"
    ON public.prescriptions FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 8. MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.messages;
CREATE POLICY "Enable read for authenticated users"
    ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
CREATE POLICY "Enable insert for authenticated users"
    ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =============================================================================
-- 9. INTAKE FORMS / QUESTIONNAIRES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intake_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES public.appointments(id),
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.intake_forms;
CREATE POLICY "Enable read for authenticated users"
    ON public.intake_forms FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 10. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    unread BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 11. FAMILY MEMBERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relation TEXT NOT NULL,
    age INTEGER,
    access_level TEXT DEFAULT 'View Only' CHECK (access_level IN ('Full','View Only','Emergency')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own family" ON public.family_members;
CREATE POLICY "Users view own family"
    ON public.family_members FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own family" ON public.family_members;
CREATE POLICY "Users manage own family"
    ON public.family_members FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 12. LAB RESULTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    test_name TEXT NOT NULL,
    lab_name TEXT,
    result_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'final' CHECK (status IN ('pending','partial','final')),
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients view own labs" ON public.lab_results;
CREATE POLICY "Patients view own labs"
    ON public.lab_results FOR SELECT USING (auth.uid() = patient_id);

-- =============================================================================
-- 13. DOCUMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own docs" ON public.documents;
CREATE POLICY "Users view own docs"
    ON public.documents FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own docs" ON public.documents;
CREATE POLICY "Users manage own docs"
    ON public.documents FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 14. INSURANCE INFO
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    plan_type TEXT,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own insurance" ON public.insurance_info;
CREATE POLICY "Users view own insurance"
    ON public.insurance_info FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own insurance" ON public.insurance_info;
CREATE POLICY "Users manage own insurance"
    ON public.insurance_info FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 15. IDENTITY VERIFICATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
    document_type TEXT,
    document_front_url TEXT,
    document_back_url TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own identity" ON public.identity_verification;
CREATE POLICY "Users view own identity"
    ON public.identity_verification FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 16. ADMIN QUESTIONNAIRES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    patient_id UUID REFERENCES auth.users(id),
    template_id UUID,
    responses JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','reviewed','approved','rejected')),
    reviewer_id UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    brand_id TEXT,
    sub_brand TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_questionnaires ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 17. BILLING CLAIMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.billing_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    amount NUMERIC(10,2),
    status TEXT DEFAULT 'pending',
    stripe_invoice_id TEXT,
    brand_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.billing_claims ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 18. DOCTOR INVITATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    brand_id TEXT,
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 19. CONSULT ROUTING RULES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.consult_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT,
    state TEXT,
    product_category TEXT,
    routing_type TEXT DEFAULT 'async' CHECK (routing_type IN ('async','video','in_person')),
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.consult_routing_rules ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 20. VITAL READINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vital_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    recorded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vital_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients view own vitals" ON public.vital_readings;
CREATE POLICY "Patients view own vitals"
    ON public.vital_readings FOR SELECT USING (auth.uid() = patient_id);

-- =============================================================================
-- 21. AFFILIATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    referly_id TEXT,
    commission_rate NUMERIC DEFAULT 0.10,
    status TEXT DEFAULT 'active',
    brand_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 22. CLINICAL INTAKE TEMPLATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_intake_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    brand_id TEXT,
    questions JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clinical_intake_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Seed: Initial brands data
-- =============================================================================
INSERT INTO public.brands (name, slug, domain, country, timezone, status, plan, since_date, patients_count, doctors_count, staff_count, mrr, growth, products, gateways, languages, revenue_data, orders_data, compliance)
VALUES
  ('Peak Health', 'peak-health', 'peak-health.io', '🇺🇸 United States', 'America/New_York', 'active', 'Enterprise', 'Jan 2025',
   0, 0, 0, 0, 0,
   '["Weight Loss", "ED Treatment", "Hair Loss", "Anxiety & Sleep"]'::jsonb,
   '["Stripe"]'::jsonb,
   '["English"]'::jsonb,
   '[]'::jsonb,
   '{"total":0,"pending":0,"shipped":0,"completed":0}'::jsonb,
   '{"hipaa":true,"gdpr":false,"soc2":false}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
