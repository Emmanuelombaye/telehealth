-- Add doctor_id column to orders table to link each order to a specific medical provider for messaging
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
