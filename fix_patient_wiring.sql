-- ==============================================================================
-- PEAK HEALTH: FIX PATIENT PORTAL WIRING (INTAKE & MESSAGES)
-- This script aligns the database schema with the Frontend expectations.
-- ==============================================================================

-- 1. FIX INTAKE FORMS SCHEMA
-- The frontend expects 'title', 'required', and 'pending'/'completed' statuses.
ALTER TABLE public.intake_forms 
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true;

-- Update the CHECK constraint for status
ALTER TABLE public.intake_forms DROP CONSTRAINT IF EXISTS intake_forms_status_check;
ALTER TABLE public.intake_forms ADD CONSTRAINT intake_forms_status_check 
    CHECK (status IN ('pending', 'completed', 'submitted', 'reviewed'));

-- 2. FIX MESSAGES SCHEMA & RLS
-- Ensure messages can be sent between profiles (staff and patients)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

-- We allow messages to reference either profiles or auth.users for flexibility, 
-- but we'll stick to profiles for joining names/avatars.
ALTER TABLE public.messages 
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. ENSURE RLS FOR INTAKE FORMS
-- Patients should be able to see and create their own forms.
DROP POLICY IF EXISTS "Patients can manage their own intake forms" ON public.intake_forms;
CREATE POLICY "Patients can manage their own intake forms" ON public.intake_forms
    FOR ALL USING (auth.uid() = patient_id);

-- 4. AUTO-WELCOME MESSAGE (Trigger)
-- This function sends a welcome message from the system admin to every new user.
CREATE OR REPLACE FUNCTION public.handle_new_patient_welcome()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
BEGIN
    -- Try to find a super_admin or admin to send the message from
    SELECT id INTO admin_id FROM public.profiles WHERE role IN ('super_admin', 'admin') LIMIT 1;
    
    -- If no admin found, use the first user or skip
    IF admin_id IS NOT NULL AND admin_id != NEW.id THEN
        INSERT INTO public.messages (sender_id, receiver_id, content, read)
        VALUES (admin_id, NEW.id, 'Welcome to Peak Health! I am your clinical coordinator. If you have any questions about your intake or prescriptions, feel free to message me here.', false);
    END IF;
    
    -- Also seed initial intake forms for the new user
    INSERT INTO public.intake_forms (patient_id, title, status, required)
    VALUES 
        (NEW.id, 'General Health Intake', 'pending', true),
        (NEW.id, 'Medical History & Symptoms', 'pending', true);
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON public.profiles;
CREATE TRIGGER on_auth_user_created_welcome
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_patient_welcome();

-- 5. SEED DATA FOR EXISTING USERS (If they have no forms/messages)
INSERT INTO public.intake_forms (patient_id, title, status, required)
SELECT p.id, 'General Health Intake', 'pending', true
FROM public.profiles p
WHERE p.role = 'patient' 
AND NOT EXISTS (SELECT 1 FROM public.intake_forms f WHERE f.patient_id = p.id);

INSERT INTO public.intake_forms (patient_id, title, status, required)
SELECT p.id, 'Medical History & Symptoms', 'pending', true
FROM public.profiles p
WHERE p.role = 'patient' 
AND NOT EXISTS (SELECT 1 FROM public.intake_forms f WHERE f.title = 'Medical History & Symptoms' AND f.patient_id = p.id);
