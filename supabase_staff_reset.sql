-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — SELECTIVE RESET (KEEP STAFF ACCOUNTS)            ║
-- ║  Run this to wipe test data but KEEP your Admin/Staff accounts. ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. DELETE ALL DATA FROM PUBLIC TABLES (Orders, Messages, etc)
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.doctor_schedules CASCADE;
-- (We keep doctor_availability as it's system config)

-- 2. DELETE ALL NON-STAFF USERS
-- Replace these emails with your actual staff emails to keep them
DO $$
BEGIN
    DELETE FROM auth.users 
    WHERE email NOT IN (
        'brandon@peakbodyco.com',          -- Super Admin / Admin
        'brandon+doctor@peakbodyco.com',   -- Doctor Account
        'brandon+pharmacy@peakbodyco.com'  -- Pharmacy Account
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Note: Manual cleanup of users in Supabase Dashboard may be required if permissions are restricted.';
END $$;

-- 3. ENSURE ROLES ARE CORRECTLY ASSIGNED IN METADATA
-- This ensures you land in the right portals instantly
UPDATE auth.users SET raw_user_meta_data = jsonb_build_object('role', 'super_admin', 'full_name', 'Brandon (Admin)') 
WHERE email = 'brandon@peakbodyco.com';

UPDATE auth.users SET raw_user_meta_data = jsonb_build_object('role', 'doctor', 'full_name', 'Brandon (Doctor)') 
WHERE email = 'brandon+doctor@peakbodyco.com';

UPDATE auth.users SET raw_user_meta_data = jsonb_build_object('role', 'pharmacy', 'full_name', 'Brandon (Pharmacy)') 
WHERE email = 'brandon+pharmacy@peakbodyco.com';

-- 4. RE-SYNC PROFILES
TRUNCATE TABLE public.profiles CASCADE;
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    id, 
    email, 
    COALESCE((raw_user_meta_data::jsonb)->>'role', 'patient'),
    COALESCE((raw_user_meta_data::jsonb)->>'full_name', email)
FROM auth.users;

-- 5. RE-SEED DOCTOR AVAILABILITY
DELETE FROM public.doctor_availability;
INSERT INTO public.doctor_availability (id, name, specialty, avatar, available, wait_time, next_slot)
VALUES 
(1, 'Dr. Sarah Johnson', 'General Practice', 'SJ', true, '< 5 min', 'Available now'),
(2, 'Dr. Michael Chen', 'Cardiology', 'MC', true, '< 15 min', 'Today 11:00 AM'),
(3, 'Dr. Amira Hassan', 'Dermatology', 'AH', false, 'Async only', 'Tomorrow 9:00 AM'),
(4, 'Dr. Carlos Rivera', 'Endocrinology', 'CR', true, '< 30 min', 'Today 2:30 PM');

-- 6. RESULT
SELECT email, role FROM public.profiles;
