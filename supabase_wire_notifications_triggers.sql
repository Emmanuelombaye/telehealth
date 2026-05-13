-- ==============================================================================
-- PEAK HEALTH: AUTOMATED NOTIFICATION TRIGGERS
-- ==============================================================================

-- 1. Function to handle Order Status Notifications
CREATE OR REPLACE FUNCTION public.handle_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.notifications (user_id, type, title, body)
        VALUES (
            NEW.user_id,
            'appointment',
            'Order Update',
            CASE 
                WHEN NEW.status = 'medical_review' THEN 'Your order is now being reviewed by a physician.'
                WHEN NEW.status = 'rx_sent' THEN 'Your treatment has been approved and sent to the pharmacy!'
                WHEN NEW.status = 'shipped' THEN 'Great news! Your package is on its way.'
                WHEN NEW.status = 'delivered' THEN 'Your order has been delivered.'
                ELSE 'Your order status has changed to ' || NEW.status
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to handle New Prescription Notifications
CREATE OR REPLACE FUNCTION public.handle_prescription_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
        NEW.patient_id,
        'prescription',
        'New Prescription Issued',
        'Dr. ' || (SELECT last_name FROM auth.users JOIN public.profiles ON auth.users.id = public.profiles.id WHERE auth.users.id = NEW.doctor_id) || ' has issued a new prescription for ' || NEW.medication
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_order_notification();

DROP TRIGGER IF EXISTS on_new_prescription ON public.prescriptions;
CREATE TRIGGER on_new_prescription
    AFTER INSERT ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_prescription_notification();
