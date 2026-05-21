-- Peak Health — clinical intake questionnaires + conditional routing on products
-- Idempotent seed. Safe to re-run. Matches src/lib/clinicalIntakeTemplates.ts

-- -----------------------------------------------------------------------------
-- 1) Admin questionnaire templates (link from Products → questionnaire_id)
-- -----------------------------------------------------------------------------
INSERT INTO public.admin_questionnaires (id, name, slug, status, brand_id, questions)
VALUES
  (
    'a1000001-0001-4000-8000-000000000001'::uuid,
    'GLP-1 Weight Management Intake',
    'peak-wl-glp1-v1',
    'live',
    NULL,
    '[
      {"id":"wl_goal","title":"What is your primary weight-loss goal?","type":"choice","required":true,"options":["Lose 10–20 lbs","Lose 20–50 lbs","Lose 50+ lbs","Maintain current weight"]},
      {"id":"wl_pregnant","title":"Are you currently pregnant or planning pregnancy in the next 12 months?","type":"yes_no","required":true,"requireVideoWhen":["Yes"],"blockSubmitWhen":["Yes"]},
      {"id":"wl_breastfeeding","title":"Are you currently breastfeeding?","type":"yes_no","required":true,"showIf":{"questionId":"wl_pregnant","values":["No"]}},
      {"id":"wl_mtc_men2","title":"Personal or family history of MTC or MEN 2?","type":"yes_no","required":true,"blockSubmitWhen":["Yes"]},
      {"id":"wl_type1_diabetes","title":"Do you have type 1 diabetes?","type":"yes_no","required":true,"requireVideoWhen":["Yes"]},
      {"id":"wl_heart_failure","title":"Have you ever been diagnosed with heart failure?","type":"yes_no","required":true,"requireVideoWhen":["Yes"]},
      {"id":"wl_chest_pain","title":"Chest pain or shortness of breath with exertion (past 3 months)?","type":"yes_no","required":true,"requireVideoWhen":["Yes"]},
      {"id":"wl_pancreatitis","title":"History of pancreatitis?","type":"yes_no","required":true,"blockSubmitWhen":["Yes"]},
      {"id":"wl_current_glp","title":"Currently on a GLP-1 medication?","type":"yes_no","required":true},
      {"id":"wl_glp_med","title":"Which GLP-1 and dose?","type":"text","required":true,"showIf":{"questionId":"wl_current_glp","values":["Yes"]}},
      {"id":"wl_suicidal_ideation","title":"Thoughts of self-harm in the past 30 days?","type":"yes_no","required":true,"blockSubmitWhen":["Yes"]},
      {"id":"wl_other_meds","title":"Daily medications and supplements","type":"text","required":true}
    ]'::jsonb
  ),
  (
    'a1000001-0001-4000-8000-000000000002'::uuid,
    'Hair Loss & Restoration Intake',
    'peak-hair-v1',
    'live',
    NULL,
    '[
      {"id":"hl_onset","title":"When did thinning begin?","type":"choice","required":true,"options":["Less than 3 months","3–12 months","More than 1 year"]},
      {"id":"hl_scalp_infection","title":"Active scalp infection or pain?","type":"yes_no","required":true,"requireVideoWhen":["Yes"]},
      {"id":"hl_pregnant","title":"Pregnant, breastfeeding, or trying to conceive?","type":"yes_no","required":true,"blockSubmitWhen":["Yes"]}
    ]'::jsonb
  ),
  (
    'a1000001-0001-4000-8000-000000000003'::uuid,
    'Sexual Wellness Intake',
    'peak-sw-v1',
    'live',
    NULL,
    '[
      {"id":"sw_primary_concern","title":"What are you seeking help for?","type":"choice","required":true,"options":["Erectile dysfunction","Low libido","Premature ejaculation","Performance anxiety"]},
      {"id":"sw_nitrates","title":"Take nitrate heart medications?","type":"yes_no","required":true,"blockSubmitWhen":["Yes"]},
      {"id":"sw_cardiac_symptoms","title":"Chest pain with sexual activity (6 months)?","type":"yes_no","required":true,"requireVideoWhen":["Yes"]}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  questions = EXCLUDED.questions,
  updated_at = timezone('utc'::text, now());

-- -----------------------------------------------------------------------------
-- 2) Attach full questionnaire + answerTriggers to active products by category
-- -----------------------------------------------------------------------------
UPDATE public.products
SET features = COALESCE(features, '{}'::jsonb)
  || jsonb_build_object(
    'questionnaire_id', 'peak-wl-glp1-v1',
    'questionnaire', (SELECT questions FROM public.admin_questionnaires WHERE slug = 'peak-wl-glp1-v1' LIMIT 1),
    'video_clinical_rules', jsonb_build_object(
      'bmiMin', 27,
      'answerTriggers', jsonb_build_array(
        jsonb_build_object('questionId','wl_pregnant','values',jsonb_build_array('Yes'),'message','Pregnancy requires a live video visit.','flagManualReview',true),
        jsonb_build_object('questionId','wl_mtc_men2','values',jsonb_build_array('Yes'),'blockSubmit',true,'message','MTC/MEN2 excludes GLP-1 online enrollment.'),
        jsonb_build_object('questionId','wl_type1_diabetes','values',jsonb_build_array('Yes'),'message','Type 1 diabetes requires a video consultation.'),
        jsonb_build_object('questionId','wl_chest_pain','values',jsonb_build_array('Yes'),'flagManualReview',true),
        jsonb_build_object('questionId','wl_suicidal_ideation','values',jsonb_build_array('Yes'),'blockSubmit',true)
      )
    )
  )
WHERE active = true
  AND (
    category ILIKE '%weight%'
    OR name ILIKE '%semaglutide%'
    OR name ILIKE '%tirzepatide%'
    OR name ILIKE '%glp%'
  );

UPDATE public.products
SET features = COALESCE(features, '{}'::jsonb)
  || jsonb_build_object(
    'questionnaire_id', 'peak-hair-v1',
    'questionnaire', (SELECT questions FROM public.admin_questionnaires WHERE slug = 'peak-hair-v1' LIMIT 1)
  )
WHERE active = true AND category ILIKE '%hair%';

UPDATE public.products
SET features = COALESCE(features, '{}'::jsonb)
  || jsonb_build_object(
    'questionnaire_id', 'peak-sw-v1',
    'questionnaire', (SELECT questions FROM public.admin_questionnaires WHERE slug = 'peak-sw-v1' LIMIT 1),
    'video_clinical_rules', jsonb_build_object(
      'answerTriggers', jsonb_build_array(
        jsonb_build_object('questionId','sw_nitrates','values',jsonb_build_array('Yes'),'blockSubmit',true,'message','Nitrates are unsafe with ED medications.'),
        jsonb_build_object('questionId','sw_cardiac_symptoms','values',jsonb_build_array('Yes'),'flagManualReview',true)
      )
    )
  )
WHERE active = true AND (category ILIKE '%sexual%' OR category ILIKE '%men%');
