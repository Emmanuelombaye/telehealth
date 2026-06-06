-- =============================================================================
-- Peak Health — Create missing tables: insurance_plans and patient_documents
-- Required by patient portal RLS migration (20260524120000)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.insurance_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    plan_name TEXT,
    member_id TEXT,
    group_number TEXT,
    plan_type TEXT,
    is_primary BOOLEAN DEFAULT true,
    effective_date DATE,
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their insurance plans" ON public.insurance_plans;
CREATE POLICY "Users can view their insurance plans"
    ON public.insurance_plans FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    is_new BOOLEAN DEFAULT true,
    brand_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.patient_documents;
CREATE POLICY "Users can view their own documents"
    ON public.patient_documents FOR SELECT USING (auth.uid() = patient_id);
