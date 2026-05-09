-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PEAK HEALTH — COMPLETE DATA WIPE & RESET                      ║
-- ║  WARNING: THIS WILL DELETE ALL ORDERS, MESSAGES, AND PROFILES  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. TRUNCATE ALL PUBLIC TABLES
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.doctor_schedules CASCADE;
TRUNCATE TABLE public.doctor_availability CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. RESET SEQUENCES (if any)
-- (None used with UUIDs, but good practice if you had integer IDs)

-- 3. THE NUCLEAR OPTION (Clears all Auth Users)
-- Note: This requires high-level permissions. If it fails, delete users manually in Supabase Dashboard.
DO $$
BEGIN
    DELETE FROM auth.users;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not auto-wipe auth.users. Please delete them manually in the Supabase Auth dashboard.';
END $$;

-- 4. RE-INITIALIZE SYSTEM TABLES (Clean with NO mock data)
INSERT INTO public.doctor_availability (id, name, specialty, avatar, available, wait_time, next_slot)
VALUES 
(1, 'Dr. Sarah Johnson', 'General Practice', 'SJ', true, '< 5 min', 'Available now'),
(2, 'Dr. Michael Chen', 'Cardiology', 'MC', true, '< 15 min', 'Today 11:00 AM'),
(3, 'Dr. Amira Hassan', 'Dermatology', 'AH', false, 'Async only', 'Tomorrow 9:00 AM'),
(4, 'Dr. Carlos Rivera', 'Endocrinology', 'CR', true, '< 30 min', 'Today 2:30 PM')
ON CONFLICT (id) DO NOTHING;

-- 5. FINAL CHECK
SELECT 'SYSTEM RESET COMPLETE. READY FOR FRESH SIGNUPS.' as status;
