-- ==============================================================================
-- Peak Health: Family Access Table Migration
-- ==============================================================================

-- 1. Create the Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relation TEXT,
    age INTEGER,
    access_level TEXT DEFAULT 'View Only', -- Full, View Only, Restricted
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own family" ON public.family_members;
CREATE POLICY "Users can view own family" ON public.family_members
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add family" ON public.family_members;
CREATE POLICY "Users can add family" ON public.family_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update family" ON public.family_members;
CREATE POLICY "Users can update family" ON public.family_members
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete family" ON public.family_members;
CREATE POLICY "Users can delete family" ON public.family_members
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Insert Mock Data for Verification
-- (Optional: Replace 'user_id' with a real one if testing manually)
-- INSERT INTO public.family_members (full_name, relation, age, access_level) VALUES 
-- ('Sarah Montgomery', 'Spouse', 32, 'Full'),
-- ('James Montgomery', 'Child', 8, 'View Only');
