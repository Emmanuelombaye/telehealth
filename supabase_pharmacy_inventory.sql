-- Pharmacy inventory + dispensary settings. Apply once. Idempotent.

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    strength TEXT,
    form TEXT,                  -- tablet, injection, cream, etc.
    on_hand INTEGER DEFAULT 0,
    reorder_at INTEGER DEFAULT 10,
    cost_cents INTEGER,
    supplier TEXT,
    lot_number TEXT,
    expires_on DATE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pharmacy_inventory_sku_idx ON public.pharmacy_inventory(sku);

CREATE TABLE IF NOT EXISTS public.pharmacy_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,    -- single-row settings
    pharmacy_name TEXT,
    nabp_number TEXT,
    dea_number TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    surescripts_id TEXT,
    auto_print_labels BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.pharmacy_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage inventory" ON public.pharmacy_inventory;
CREATE POLICY "Staff manage inventory" ON public.pharmacy_inventory
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('pharmacy','brand_admin','super_admin')
      )
    );

DROP POLICY IF EXISTS "Staff manage settings" ON public.pharmacy_settings;
CREATE POLICY "Staff manage settings" ON public.pharmacy_settings
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('pharmacy','brand_admin','super_admin')
      )
    );
