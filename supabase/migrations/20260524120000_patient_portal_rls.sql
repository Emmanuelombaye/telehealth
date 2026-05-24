-- Patient portal: insurance plan self-service + document viewed flag
-- Required for /patient/insurance Add Plan and /patient/documents NEW badge clear

-- insurance_plans: patients can add and edit their own plan
DROP POLICY IF EXISTS "Users can insert their insurance plans" ON public.insurance_plans;
CREATE POLICY "Users can insert their insurance plans"
  ON public.insurance_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their insurance plans" ON public.insurance_plans;
CREATE POLICY "Users can update their insurance plans"
  ON public.insurance_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- patient_documents: patients can mark documents as viewed (new = false)
DROP POLICY IF EXISTS "Users can update their own documents" ON public.patient_documents;
CREATE POLICY "Users can update their own documents"
  ON public.patient_documents
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);
