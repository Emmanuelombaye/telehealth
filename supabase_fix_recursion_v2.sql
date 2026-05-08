-- FINAL FIX FOR RLS RECURSION ERROR (42P17)
-- This script replaces recursive profile policies with JWT-based checks.

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create non-recursive policies
-- We use auth.uid() directly without selecting from the same table.

-- Patients can view their own profile
CREATE POLICY "profiles_individual_select" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Admins and Doctors can view all profiles
-- We check the role from the JWT metadata (set during signup) to avoid recursion
CREATE POLICY "profiles_staff_select" 
ON profiles FOR SELECT 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin', 'doctor', 'brand_admin')
);

-- Users can update their own profile
CREATE POLICY "profiles_individual_update" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Fix for Orders table recursion (if any)
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
CREATE POLICY "orders_staff_select" 
ON orders FOR SELECT 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin', 'doctor', 'brand_admin')
  OR auth.uid() = user_id
);

COMMIT;
