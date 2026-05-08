-- Disable RLS for the MVP demo
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability DISABLE ROW LEVEL SECURITY;

-- Delete existing to avoid duplicates if run multiple times
DELETE FROM public.orders;

-- Insert Mock Data
INSERT INTO public.orders (
    order_number, patient_name, patient_avatar, patient_age, patient_country, sub_brand, 
    medication, dosage_instructions, category, status, ordered_date, pharmacy, amount, 
    doctor, urgent, intake_complete, intake_notes, wait_mins, time, mrn, timeline
) VALUES 
(
    'RX-G7K2M9', 'Sophie Bennett', 'SB', 34, '🇺🇸 US', 'GlowRx', 
    'Semaglutide 0.25mg', 'Inject 0.25mg subcutaneously once weekly', 'Weight Loss', 
    'order_submitted', 'May 07, 2026', 'VialsRX', '$245', 'Pending assignment', 
    true, true, 'First visit. Intake submitted 2 hrs ago. BMI 31.', 12, '09:00 AM', 'D31118621',
    '[{"status": "order_submitted", "date": "May 07, 9:14 AM"}]'::jsonb
),
(
    'RX-44810', 'Elena Rodriguez', 'ER', 28, '🇺🇸 USA', 'GlowRx', 
    'Tretinoin 0.05% Cream', 'Apply a pea-sized amount to the face nightly. Avoid eyes and mouth.', 'Skincare', 
    'doctor_reviewing', 'May 10, 2026', 'Curexa Pharmacy', '$45.00', 'Pending Assignment', 
    false, true, 'Using for acne and fine lines. No current irritation but has sensitive skin.', 5, '09:15 AM', 'MRN-10046',
    '[{"status": "order_submitted", "date": "May 10, 2026 - 09:15 AM"}, {"status": "doctor_reviewing", "date": "May 10, 2026 - 09:45 AM"}]'::jsonb
),
(
    'RX-V3N8P1', 'Caleb Montgomery', 'CM', 28, '🇬🇧 UK', 'VitalCare', 
    'Sildenafil 50mg', 'Take one tablet 1 hour before sexual activity', 'Men''s Health', 
    'doctor_reviewing', 'May 06, 2026', 'VialsRX', '$35', 'Dr. Marcus Thorne', 
    false, true, 'Returning patient. Refill request.', 5, '09:30 AM', 'S43385633',
    '[{"status": "order_submitted", "date": "May 06, 8:30 AM"}, {"status": "doctor_reviewing", "date": "May 06, 10:15 AM"}]'::jsonb
),
(
    'RX-V8F4L2', 'Isaiah Jackson', 'IJ', 55, '🇦🇺 AU', 'VitalCare', 
    'Finasteride 1mg', 'One tablet daily, with or without food', 'Hair', 
    'rx_sent', 'May 05, 2026', 'VialsRX', '$25', 'Dr. Amira Hassan', 
    false, true, 'Hair thinning at crown. Started 6 months ago.', 0, '10:30 AM', 'A31393595',
    '[{"status": "order_submitted", "date": "May 05, 7:42 AM"}, {"status": "doctor_reviewing", "date": "May 05, 8:00 AM"}, {"status": "rx_sent", "date": "May 05, 2:45 PM"}]'::jsonb
),
(
    'RX-T9L3Q4', 'John Carter', 'JC', 42, '🇨🇦 CA', 'PeakBody', 
    'Testosterone Cypionate 200mg/mL', 'Inject 0.5mL intramuscularly once weekly', 'Men''s Health', 
    'shipped', 'May 04, 2026', 'Truepill', '$120', 'Dr. Harrison Vance', 
    false, true, 'TRT protocol ongoing. Labs look good.', 0, '11:15 AM', 'T99283746',
    '[{"status": "order_submitted", "date": "May 04, 9:00 AM"}, {"status": "doctor_reviewing", "date": "May 04, 9:30 AM"}, {"status": "rx_sent", "date": "May 04, 10:00 AM"}, {"status": "shipped", "date": "May 04, 2:00 PM"}]'::jsonb
);
