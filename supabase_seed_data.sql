-- ==============================================================================
-- InvestN / Peak Health: Production Seed Data
-- Run this in your Supabase SQL Editor to populate the system with real data.
-- ==============================================================================

-- Optional: Clear existing mock data before seeding
-- TRUNCATE TABLE public.orders CASCADE;
-- TRUNCATE TABLE public.products CASCADE;

-- 1. Seed Products Catalog
INSERT INTO public.products (name, category, tagline, description, price_usd, popular, image_url) VALUES 
('Semaglutide Weekly', 'Weight Loss', 'The Gold Standard for Weight Loss', 'GLP-1 receptor agonist that targets areas of the brain that regulate appetite and food intake. Most patients lose 15-20% of their body weight.', 245.00, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80'),
('Tirzepatide Weekly', 'Weight Loss', 'Next Generation Weight Management', 'Dual GIP and GLP-1 receptor agonist. The most effective weight loss medication available today.', 395.00, false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80'),
('Testosterone Cypionate', 'Men''s Health', 'Gold Standard TRT', 'Restore your natural energy, focus, and drive with optimal hormone replacement therapy.', 120.00, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80'),
('Finasteride + Minoxidil', 'Hair Loss', 'Stop Hair Loss & Regrow', 'The ultimate dual-action topical solution to block DHT and stimulate hair follicles.', 45.00, false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80'),
('Tretinoin Cream 0.05%', 'Skincare', 'Anti-Aging & Acne', 'Prescription-strength retinoid that accelerates cell turnover for flawless skin.', 60.00, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80')
ON CONFLICT DO NOTHING;

-- 2. Seed Orders (with Dynamic Intake JSON and Zoom Consultation times)
INSERT INTO public.orders (
    order_number, patient_name, patient_country, sub_brand, medication, dosage_instructions, 
    category, status, ordered_date, pharmacy, amount, doctor, intake_answers, consultation_time
) VALUES 

-- PATIENT 1: Needs Doctor Review (With Zoom Scheduled)
('RX-T8M4K1', 'Emily Chen', '🇺🇸 US', 'GlowRx', 'Semaglutide Weekly', 'Inject 0.25mg subcutaneously once weekly', 
'Weight Loss', 'order_submitted', 'May 07, 2026', 'VialsRX', 245.00, 'Pending Assignment', 
'{"What are your primary weight-loss goals?": "Lose 20lbs for my wedding", "Any history of MEN-2?": "No", "Current weight?": "185 lbs", "Target weight?": "165 lbs"}',
'Tomorrow at 10:30 AM'),

-- PATIENT 2: Needs Doctor Review (No Zoom)
('RX-J9F2P5', 'Marcus Johnson', '🇺🇸 US', 'Peak Health', 'Testosterone Cypionate', 'Inject 100mg once weekly', 
'Men''s Health', 'order_submitted', 'May 07, 2026', 'Peak Pharmacy', 120.00, 'Pending Assignment', 
'{"Describe your symptoms": "Low energy, brain fog, poor sleep", "Recent bloodwork attached?": "Yes", "Any prostate issues?": "No"}',
null),

-- PATIENT 3: Doctor is actively reviewing
('RX-L3W7Q2', 'Sophia Rodriguez', '🇬🇧 UK', 'VitalCare', 'Tirzepatide Weekly', 'Inject 2.5mg once weekly', 
'Weight Loss', 'doctor_reviewing', 'May 07, 2026', 'VialsRX', 395.00, 'Dr. Sarah Johnson', 
'{"What are your primary weight-loss goals?": "Post-pregnancy weight loss", "Any history of MEN-2?": "No", "Current weight?": "210 lbs"}',
null),

-- PATIENT 4: Rx Sent to Pharmacy (Waiting for Admin to fulfill)
('RX-B5N1V8', 'James Wilson', '🇺🇸 US', 'Peak Health', 'Finasteride + Minoxidil', 'Apply 1ml twice daily to scalp', 
'Hair Loss', 'rx_sent', 'May 06, 2026', 'Peak Pharmacy', 45.00, 'Dr. Michael Chen', 
'{"How long have you been experiencing hair loss?": "2 years", "Receding hairline or crown?": "Both"}',
null),

-- PATIENT 5: Shipped (Patient Tracking visible)
('RX-Z2X9M4', 'Olivia Taylor', '🇦🇪 UAE', 'GlowRx', 'Tretinoin Cream 0.05%', 'Apply pea-sized amount nightly', 
'Skincare', 'shipped', 'May 05, 2026', 'Global Scripts', 60.00, 'Dr. Amira Hassan', 
'{"Primary skin concerns?": "Fine lines and occasional breakouts", "Have you used retinoids before?": "Yes, over the counter retinol"}',
null);

-- Add Carrier and Tracking to the shipped order
UPDATE public.orders 
SET tracking = '9400109205568012345678', carrier = 'USPS', tracking_url = 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400109205568012345678'
WHERE order_number = 'RX-Z2X9M4';

-- PATIENT 6: Delivered
INSERT INTO public.orders (
    order_number, patient_name, patient_country, sub_brand, medication, dosage_instructions, 
    category, status, ordered_date, pharmacy, amount, doctor, tracking, carrier, intake_answers
) VALUES 
('RX-P7C4D1', 'David Smith', '🇺🇸 US', 'Peak Health', 'Semaglutide Weekly', 'Inject 0.5mg once weekly', 
'Weight Loss', 'delivered', 'April 28, 2026', 'VialsRX', 245.00, 'Dr. Sarah Johnson', '1Z9999999999999999', 'UPS',
'{"What are your primary weight-loss goals?": "Need to lower BMI", "Any history of MEN-2?": "No"}');
