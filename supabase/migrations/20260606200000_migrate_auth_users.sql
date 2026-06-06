-- Migration to restore auth.users and auth.identities

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'a8a1fa68-d720-4d92-83de-89f2d13bb7aa', 'authenticated', 'authenticated', 'pharmacy@peakbodyco.com', '$2a$10$.sX2AnvbFPx2N44q8U0iReEuvlfDL1dtTTrbFOlg/1tJz2AdZZP4C', '2026-05-09 05:17:39.317946+00', '2026-05-17 06:32:26.819176+00', '{"provider":"email","providers":["email"]}', '{"sub":"a8a1fa68-d720-4d92-83de-89f2d13bb7aa","role":"pharmacy","email":"pharmacy@peakbodyco.com","full_name":"Pharmacy Fulfillment","last_name":"Fulfillment","first_name":"Pharmacy","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 05:17:39.311328+00', '2026-05-17 06:32:27.039241+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a8a1fa68-d720-4d92-83de-89f2d13bb7aa', 'a8a1fa68-d720-4d92-83de-89f2d13bb7aa', '{"sub":"a8a1fa68-d720-4d92-83de-89f2d13bb7aa","email":"pharmacy@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-17 06:32:26.819176+00', '2026-05-09 05:17:39.311328+00', '2026-05-17 06:32:27.039241+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'e90f0df8-38d1-40e8-905c-ab30a9d20fc3', 'authenticated', 'authenticated', 'brandondoctor@peakbodyco.com', '$2a$10$TTuOeEy8lLwZJLL1RlCN0OAWNjWnGcsJzRuIF4koIK4tlZ5r/9/wu', '2026-05-09 02:15:15.602744+00', '2026-05-25 16:50:29.570876+00', '{"provider":"email","providers":["email"]}', '{"sub":"e90f0df8-38d1-40e8-905c-ab30a9d20fc3","role":"doctor","email":"brandondoctor@peakbodyco.com","full_name":"ww ww","last_name":"ww","first_name":"ww","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 02:15:15.562091+00', '2026-06-02 14:03:46.581462+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'e90f0df8-38d1-40e8-905c-ab30a9d20fc3', 'e90f0df8-38d1-40e8-905c-ab30a9d20fc3', '{"sub":"e90f0df8-38d1-40e8-905c-ab30a9d20fc3","email":"brandondoctor@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-25 16:50:29.570876+00', '2026-05-09 02:15:15.562091+00', '2026-06-02 14:03:46.581462+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '6640834d-8d2e-4b27-be1f-98641c1c9aa6', 'authenticated', 'authenticated', 'manuelo3mbaye@gmail.com', '$2a$10$7mOKC8AQ6jVu.EHxGZqqDuN5t85iX6zc.wcgpdOA0M/dDyw9tR/3a', '2026-05-13 19:49:49.138432+00', '2026-05-13 19:49:49.150013+00', '{"provider":"email","providers":["email"]}', '{"sub":"6640834d-8d2e-4b27-be1f-98641c1c9aa6","role":"patient","email":"manuelo3mbaye@gmail.com","full_name":"Emmanuel Ombaye","last_name":"Ombaye","first_name":"Emmanuel","email_verified":true,"phone_verified":false}', NULL, '2026-05-13 19:49:49.05943+00', '2026-05-13 19:49:49.194833+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '6640834d-8d2e-4b27-be1f-98641c1c9aa6', '6640834d-8d2e-4b27-be1f-98641c1c9aa6', '{"sub":"6640834d-8d2e-4b27-be1f-98641c1c9aa6","email":"manuelo3mbaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-13 19:49:49.150013+00', '2026-05-13 19:49:49.05943+00', '2026-05-13 19:49:49.194833+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '63d4abca-5f88-48df-812b-4cb9467f749a', 'authenticated', 'authenticated', 'manuelomrrbaye@gmail.com', '$2a$10$G0Yp2AYE3UB4SkxKDLW.e.XYxSS0MhVA.H/k2abaski5a43k.ztbW', '2026-05-13 23:44:45.453217+00', '2026-05-13 23:44:45.46557+00', '{"provider":"email","providers":["email"]}', '{"sub":"63d4abca-5f88-48df-812b-4cb9467f749a","role":"patient","email":"manuelomrrbaye@gmail.com","full_name":"Emmanuel Ombaye","last_name":"Ombaye","first_name":"Emmanuel","email_verified":true,"phone_verified":false}', NULL, '2026-05-13 23:44:45.400346+00', '2026-05-13 23:44:45.474985+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '63d4abca-5f88-48df-812b-4cb9467f749a', '63d4abca-5f88-48df-812b-4cb9467f749a', '{"sub":"63d4abca-5f88-48df-812b-4cb9467f749a","email":"manuelomrrbaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-13 23:44:45.46557+00', '2026-05-13 23:44:45.400346+00', '2026-05-13 23:44:45.474985+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'cdc1dba7-359b-43ab-ab50-13868f80ae07', 'authenticated', 'authenticated', 'manueldombaye@gmail.com', '$2a$10$Qe0zBKUZtP3T5PTbM/ME1uCjSo9sMEkI9F1Sy1vqbVCyH3IDjaFOe', '2026-05-14 02:29:39.823708+00', '2026-05-14 02:29:39.829345+00', '{"provider":"email","providers":["email"]}', '{"sub":"cdc1dba7-359b-43ab-ab50-13868f80ae07","role":"patient","email":"manueldombaye@gmail.com","full_name":"Emmanuel Ombaye","last_name":"Ombaye","first_name":"Emmanuel","email_verified":true,"phone_verified":false}', NULL, '2026-05-14 02:29:39.799552+00', '2026-05-14 13:14:31.637069+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'cdc1dba7-359b-43ab-ab50-13868f80ae07', 'cdc1dba7-359b-43ab-ab50-13868f80ae07', '{"sub":"cdc1dba7-359b-43ab-ab50-13868f80ae07","email":"manueldombaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-14 02:29:39.829345+00', '2026-05-14 02:29:39.799552+00', '2026-05-14 13:14:31.637069+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'fc12e2cb-ed01-46c0-a87a-ee2e4adc79cf', 'authenticated', 'authenticated', 'bresilientmgmt@gmail.com', '$2a$10$V12MRl8HdTTk9Qv6qAmooOBfiqD3GPXFKC1lPj6xEUNlT9DGPBm9.', '2026-05-09 17:22:15.292083+00', '2026-06-06 15:38:53.040989+00', '{"provider":"email","providers":["email"]}', '{"sub":"fc12e2cb-ed01-46c0-a87a-ee2e4adc79cf","role":"patient","email":"bresilientmgmt@gmail.com","full_name":"Brandon Rangel","last_name":"Rangel","first_name":"Brandon","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 17:22:15.214421+00', '2026-06-06 15:38:53.068694+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'fc12e2cb-ed01-46c0-a87a-ee2e4adc79cf', 'fc12e2cb-ed01-46c0-a87a-ee2e4adc79cf', '{"sub":"fc12e2cb-ed01-46c0-a87a-ee2e4adc79cf","email":"bresilientmgmt@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-06 15:38:53.040989+00', '2026-05-09 17:22:15.214421+00', '2026-06-06 15:38:53.068694+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'be24ea7f-06a7-4e26-bf28-767a7a33e0ac', 'authenticated', 'authenticated', 'doctor@peakbodyco.com', '$2a$10$M4pVqMXqsgyiwdwgCOUNZubyGHA7/x4BJHxubO6j5.YxQpyY0TIjS', '2026-05-09 05:17:38.004564+00', '2026-06-06 14:21:42.596643+00', '{"provider":"email","providers":["email"]}', '{"sub":"be24ea7f-06a7-4e26-bf28-767a7a33e0ac","role":"doctor","email":"doctor@peakbodyco.com","phone":"","address":"","language":"English","timezone":"America/New_York","full_name":"Clinical Provider","last_name":"Provider","specialty":"ddd","first_name":"Clinical","date_of_birth":"","email_verified":true,"phone_verified":false,"doctor_notification_prefs":{"messages":false,"rpmVitals":true,"labResults":false,"emailDigest":false,"queueAlerts":false,"videoVisits":true}}', NULL, '2026-05-09 05:17:37.94685+00', '2026-06-06 15:34:03.587068+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'be24ea7f-06a7-4e26-bf28-767a7a33e0ac', 'be24ea7f-06a7-4e26-bf28-767a7a33e0ac', '{"sub":"be24ea7f-06a7-4e26-bf28-767a7a33e0ac","email":"doctor@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-06 14:21:42.596643+00', '2026-05-09 05:17:37.94685+00', '2026-06-06 15:34:03.587068+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'eb462bcc-9b76-4bd0-a356-7f0d4d816541', 'authenticated', 'authenticated', 'ww@gmail.com', '$2a$10$uRAjspF66xYpqEOgqDuTH.YKzSEdM2ntiuQ2YH4QZmAJLiiOt08IC', '2026-05-15 18:13:07.757911+00', '2026-05-15 18:13:07.773017+00', '{"provider":"email","providers":["email"]}', '{"sub":"eb462bcc-9b76-4bd0-a356-7f0d4d816541","role":"patient","email":"ww@gmail.com","phone":"111111","full_name":"ww ww","last_name":"ww","first_name":"ww","date_of_birth":"2026-05-22","email_verified":true,"phone_verified":false}', NULL, '2026-05-15 18:13:07.685524+00', '2026-05-16 00:14:23.017342+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'eb462bcc-9b76-4bd0-a356-7f0d4d816541', 'eb462bcc-9b76-4bd0-a356-7f0d4d816541', '{"sub":"eb462bcc-9b76-4bd0-a356-7f0d4d816541","email":"ww@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-15 18:13:07.773017+00', '2026-05-15 18:13:07.685524+00', '2026-05-16 00:14:23.017342+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'f26ac66f-e65f-4817-a4eb-afec995d0d7b', 'authenticated', 'authenticated', 'admin@peakbodyco.com', '$2a$10$XvKD33W5X0fofvUIAmoUcu60hy2kbVjNJp3mYGSUZ2frxTHNzvXMu', '2026-05-10 19:58:11.811809+00', '2026-06-06 15:40:51.106759+00', '{"provider":"email","providers":["email"]}', '{"sub":"f26ac66f-e65f-4817-a4eb-afec995d0d7b","role":"brand_admin","email":"admin@peakbodyco.com","full_name":"Brand Administrator","last_name":"Administrator","first_name":"Brand","email_verified":true,"phone_verified":false}', NULL, '2026-05-10 19:58:11.777225+00', '2026-06-06 19:36:46.304662+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'f26ac66f-e65f-4817-a4eb-afec995d0d7b', 'f26ac66f-e65f-4817-a4eb-afec995d0d7b', '{"sub":"f26ac66f-e65f-4817-a4eb-afec995d0d7b","email":"admin@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-06 15:40:51.106759+00', '2026-05-10 19:58:11.777225+00', '2026-06-06 19:36:46.304662+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'b007a354-2047-46c3-a2d3-8073bde95793', 'authenticated', 'authenticated', 'testing@gmail.com', '$2a$10$O6lUYAOpnJfvqqJ23oL5MO5ZBrSkCSHuUxjstSmil.u7p/KHPPcKG', '2026-05-09 01:02:27.729615+00', '2026-05-22 06:03:18.108324+00', '{"provider":"email","providers":["email"]}', '{"sub":"b007a354-2047-46c3-a2d3-8073bde95793","role":"patient","email":"testing@gmail.com","full_name":"testing testing","last_name":"testing","first_name":"testing","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 01:02:27.678701+00', '2026-05-30 01:15:10.165743+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'b007a354-2047-46c3-a2d3-8073bde95793', 'b007a354-2047-46c3-a2d3-8073bde95793', '{"sub":"b007a354-2047-46c3-a2d3-8073bde95793","email":"testing@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-22 06:03:18.108324+00', '2026-05-09 01:02:27.678701+00', '2026-05-30 01:15:10.165743+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'abfc29e2-a156-40f5-a6f9-a163cae00c12', 'authenticated', 'authenticated', 'migos@gmail.com', '$2a$10$jIHa0WZuPR3eB9cVAR/kruULYx9kD3RkUjMWCRFs2VFU3xDzDoDya', '2026-05-22 01:26:52.27451+00', '2026-05-22 01:26:52.28422+00', '{"provider":"email","providers":["email"]}', '{"sub":"abfc29e2-a156-40f5-a6f9-a163cae00c12","role":"patient","email":"migos@gmail.com","phone":"0790063154","last_name":"Migos","first_name":"Migos","date_of_birth":"2026-05-06","email_verified":true,"phone_verified":false}', NULL, '2026-05-22 01:26:52.209757+00', '2026-05-22 01:26:52.324413+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'abfc29e2-a156-40f5-a6f9-a163cae00c12', 'abfc29e2-a156-40f5-a6f9-a163cae00c12', '{"sub":"abfc29e2-a156-40f5-a6f9-a163cae00c12","email":"migos@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-22 01:26:52.28422+00', '2026-05-22 01:26:52.209757+00', '2026-05-22 01:26:52.324413+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '6a99bc1b-9a87-4037-b44c-4499cde66089', 'authenticated', 'authenticated', 'peter@emberflowai.com', '$2a$10$d5DnNVbxNzVk8JG.9/IQW.qqLUmW2Lgc/h4K8foV2W3DAdA3gYM0K', '2026-05-16 21:03:14.289272+00', '2026-05-16 21:06:24.641529+00', '{"provider":"email","providers":["email"]}', '{"sub":"6a99bc1b-9a87-4037-b44c-4499cde66089","role":"patient","email":"peter@emberflowai.com","full_name":"Peter Berrettini","last_name":"Berrettini","first_name":"Peter","email_verified":true,"phone_verified":false}', NULL, '2026-05-16 21:03:14.210831+00', '2026-05-16 21:06:24.654085+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '6a99bc1b-9a87-4037-b44c-4499cde66089', '6a99bc1b-9a87-4037-b44c-4499cde66089', '{"sub":"6a99bc1b-9a87-4037-b44c-4499cde66089","email":"peter@emberflowai.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-16 21:06:24.641529+00', '2026-05-16 21:03:14.210831+00', '2026-05-16 21:06:24.654085+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '9bc00627-e52e-450f-8803-ec289cfa27f2', 'authenticated', 'authenticated', '111manuelombaye@gmail.com', '$2a$10$UK7YADHS87xnACoC/rmavOGGdxIirSi63JMEW7lWvzhsryFm7u26W', '2026-05-13 20:17:47.61922+00', '2026-05-13 20:17:47.624329+00', '{"provider":"email","providers":["email"]}', '{"sub":"9bc00627-e52e-450f-8803-ec289cfa27f2","role":"patient","email":"111manuelombaye@gmail.com","full_name":"Emmanuel Ombaye","last_name":"Ombaye","first_name":"Emmanuel","email_verified":true,"phone_verified":false}', NULL, '2026-05-13 20:17:47.563238+00', '2026-05-14 00:12:22.591866+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '9bc00627-e52e-450f-8803-ec289cfa27f2', '9bc00627-e52e-450f-8803-ec289cfa27f2', '{"sub":"9bc00627-e52e-450f-8803-ec289cfa27f2","email":"111manuelombaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-13 20:17:47.624329+00', '2026-05-13 20:17:47.563238+00', '2026-05-14 00:12:22.591866+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '77355e17-14b0-4454-a30e-e1d1fc2b7a69', 'authenticated', 'authenticated', '2223manuelombaye@gmail.com', '$2a$10$2w.QUe0AXy/vpLEzSSt1V.dV.0oKHcfrcueDSZ9uPRy7GHmcmrAKm', '2026-05-12 08:14:40.543681+00', '2026-05-12 08:14:40.556141+00', '{"provider":"email","providers":["email"]}', '{"sub":"77355e17-14b0-4454-a30e-e1d1fc2b7a69","role":"patient","email":"2223manuelombaye@gmail.com","phone":"0790063154","last_name":"Ombaye","first_name":"Emmanuel","date_of_birth":"2022-02-12","email_verified":true,"phone_verified":false}', NULL, '2026-05-12 08:14:40.445891+00', '2026-05-12 08:14:40.605811+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '77355e17-14b0-4454-a30e-e1d1fc2b7a69', '77355e17-14b0-4454-a30e-e1d1fc2b7a69', '{"sub":"77355e17-14b0-4454-a30e-e1d1fc2b7a69","email":"2223manuelombaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-12 08:14:40.556141+00', '2026-05-12 08:14:40.445891+00', '2026-05-12 08:14:40.605811+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'ddb73b33-563e-4ca1-a8dc-3dc73697b56a', 'authenticated', 'authenticated', 'peakb661@gmail.com', '$2a$10$kV1CgqsNTIg4yxy77e4txeFTp6tlHMX2LQqsv.t5OT55kMXxXXmyO', '2026-06-01 23:54:36.951817+00', '2026-06-01 23:54:36.962881+00', '{"provider":"email","providers":["email"]}', '{"sub":"ddb73b33-563e-4ca1-a8dc-3dc73697b56a","role":"patient","email":"peakb661@gmail.com","phone":"1111112222","brand_id":"c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c","last_name":"brandon","first_name":"peak","date_of_birth":"2026-06-02","email_verified":true,"phone_verified":false}', NULL, '2026-06-01 23:54:36.89776+00', '2026-06-02 01:28:04.602079+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'ddb73b33-563e-4ca1-a8dc-3dc73697b56a', 'ddb73b33-563e-4ca1-a8dc-3dc73697b56a', '{"sub":"ddb73b33-563e-4ca1-a8dc-3dc73697b56a","email":"peakb661@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-01 23:54:36.962881+00', '2026-06-01 23:54:36.89776+00', '2026-06-02 01:28:04.602079+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'f7ef4ab5-8ea1-47fd-887e-f1dd2d392ec4', 'authenticated', 'authenticated', 'ye@gmail.com', '$2a$10$mnVtjSFNph2kiwNxST.QVOP/cz1n6cT5N7kl/twjE37R.fcGOJI/a', '2026-05-15 09:33:25.750257+00', '2026-05-15 09:33:25.764142+00', '{"provider":"email","providers":["email"]}', '{"sub":"f7ef4ab5-8ea1-47fd-887e-f1dd2d392ec4","role":"patient","email":"ye@gmail.com","phone":"0790063154","last_name":"ombaye","first_name":"manuel","date_of_birth":"2026-05-08","email_verified":true,"phone_verified":false}', NULL, '2026-05-15 09:33:25.627018+00', '2026-05-17 10:28:36.322572+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'f7ef4ab5-8ea1-47fd-887e-f1dd2d392ec4', 'f7ef4ab5-8ea1-47fd-887e-f1dd2d392ec4', '{"sub":"f7ef4ab5-8ea1-47fd-887e-f1dd2d392ec4","email":"ye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-15 09:33:25.764142+00', '2026-05-15 09:33:25.627018+00', '2026-05-17 10:28:36.322572+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '1a91edc6-8b3b-445f-9b96-cdc2e0ce4b18', 'authenticated', 'authenticated', 'brandon@gmail.com', '$2a$10$cQzt6Mmfq4CPaeGarlzVuOIu7W.UrRxBL3O4Ibb.5cpOuSULBwdhG', '2026-05-09 04:44:04.228772+00', '2026-05-09 04:44:04.236673+00', '{"provider":"email","providers":["email"]}', '{"sub":"1a91edc6-8b3b-445f-9b96-cdc2e0ce4b18","role":"patient","email":"brandon@gmail.com","full_name":"ww ww","last_name":"ww","first_name":"ww","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 04:44:04.194265+00', '2026-05-09 04:44:04.250632+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '1a91edc6-8b3b-445f-9b96-cdc2e0ce4b18', '1a91edc6-8b3b-445f-9b96-cdc2e0ce4b18', '{"sub":"1a91edc6-8b3b-445f-9b96-cdc2e0ce4b18","email":"brandon@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-09 04:44:04.236673+00', '2026-05-09 04:44:04.194265+00', '2026-05-09 04:44:04.250632+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'a5eaf666-3e55-4049-8a4f-fd24a7ec00c9', 'authenticated', 'authenticated', 'hhhmanuelombaye@gmail.com', '$2a$10$I1YvwREm2fDcle/uVmQQH.wWir2sR9QJsofGZQTQg5VFX5882VonO', '2026-05-14 02:21:40.177403+00', '2026-05-14 02:21:40.185857+00', '{"provider":"email","providers":["email"]}', '{"sub":"a5eaf666-3e55-4049-8a4f-fd24a7ec00c9","role":"patient","email":"hhhmanuelombaye@gmail.com","full_name":"dddddd vfggg","last_name":"vfggg","first_name":"dddddd","email_verified":true,"phone_verified":false}', NULL, '2026-05-14 02:21:40.121656+00', '2026-05-14 13:13:40.886924+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5eaf666-3e55-4049-8a4f-fd24a7ec00c9', 'a5eaf666-3e55-4049-8a4f-fd24a7ec00c9', '{"sub":"a5eaf666-3e55-4049-8a4f-fd24a7ec00c9","email":"hhhmanuelombaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-14 02:21:40.185857+00', '2026-05-14 02:21:40.121656+00', '2026-05-14 13:13:40.886924+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '33f0f94d-2c54-4698-bfb7-1cc39a02bd9a', 'authenticated', 'authenticated', 'bb@gmail.com', '$2a$10$J/DUqg2YijMvun2M.e2T3.ylszj9KN87wc97xrFxKBDK62FzKPaxm', '2026-05-09 10:42:16.235698+00', '2026-05-09 10:42:16.246278+00', '{"provider":"email","providers":["email"]}', '{"sub":"33f0f94d-2c54-4698-bfb7-1cc39a02bd9a","role":"patient","email":"bb@gmail.com","phone":"5588996680#","last_name":"Bb","first_name":"Bb","date_of_birth":"2026-05-13","email_verified":true,"phone_verified":false}', NULL, '2026-05-09 10:42:16.19484+00', '2026-05-09 10:42:16.286334+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '33f0f94d-2c54-4698-bfb7-1cc39a02bd9a', '33f0f94d-2c54-4698-bfb7-1cc39a02bd9a', '{"sub":"33f0f94d-2c54-4698-bfb7-1cc39a02bd9a","email":"bb@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-09 10:42:16.246278+00', '2026-05-09 10:42:16.19484+00', '2026-05-09 10:42:16.286334+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '696b4b0b-fced-4b4b-a5ff-70a0083a88eb', 'authenticated', 'authenticated', 'manuelombaye@gmail.com', '$2a$10$D9GjjSMbvEiGEfCnEcAYO.FoOeh4qjhnHeetd3wx580.3mHEnEG3O', '2026-05-10 14:43:45.568619+00', '2026-05-14 20:19:06.484967+00', '{"provider":"email","providers":["email"]}', '{"sub":"696b4b0b-fced-4b4b-a5ff-70a0083a88eb","role":"patient","email":"manuelombaye@gmail.com","phone":"2222222","last_name":"Ombaye","first_name":"Emmanuel","date_of_birth":"2026-05-18","email_verified":true,"phone_verified":false}', NULL, '2026-05-10 14:43:45.514167+00', '2026-05-14 20:19:06.516268+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '696b4b0b-fced-4b4b-a5ff-70a0083a88eb', '696b4b0b-fced-4b4b-a5ff-70a0083a88eb', '{"sub":"696b4b0b-fced-4b4b-a5ff-70a0083a88eb","email":"manuelombaye@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-14 20:19:06.484967+00', '2026-05-10 14:43:45.514167+00', '2026-05-14 20:19:06.516268+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '130ed391-7c03-4815-ba01-b5a17eb50bd0', 'authenticated', 'authenticated', 'testpatient@example.com', '$2a$10$57bnbpcxjwlZPaKEQfLgz.spuXVwOEpQCkFRSAeGq16Ty0idiOHQy', '2026-05-16 02:03:23.662712+00', '2026-05-16 02:03:23.6706+00', '{"provider":"email","providers":["email"]}', '{"sub":"130ed391-7c03-4815-ba01-b5a17eb50bd0","role":"patient","email":"testpatient@example.com","full_name":"Test Patient","last_name":"Patient","first_name":"Test","email_verified":true,"phone_verified":false}', NULL, '2026-05-16 02:03:23.614809+00', '2026-05-16 02:03:23.674319+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '130ed391-7c03-4815-ba01-b5a17eb50bd0', '130ed391-7c03-4815-ba01-b5a17eb50bd0', '{"sub":"130ed391-7c03-4815-ba01-b5a17eb50bd0","email":"testpatient@example.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-16 02:03:23.6706+00', '2026-05-16 02:03:23.614809+00', '2026-05-16 02:03:23.674319+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', '50e5f8ae-39e7-43a7-8e95-d65975e701a6', 'authenticated', 'authenticated', 'admin2@peakbodyco.com', '$2a$10$NQt.5Xox1BJ5G30d1eqVHeqv8MOjpfLcXGIdYB1eK9f9mR5KBXKRW', '2026-05-17 00:34:51.310521+00', '2026-05-17 02:01:04.342233+00', '{"provider":"email","providers":["email"]}', '{"sub":"50e5f8ae-39e7-43a7-8e95-d65975e701a6","role":"super_admin","email":"admin2@peakbodyco.com","full_name":"Super Admin","last_name":"Admin","first_name":"Super","email_verified":true,"phone_verified":false}', NULL, '2026-05-17 00:34:51.221855+00', '2026-05-17 02:59:10.269813+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '50e5f8ae-39e7-43a7-8e95-d65975e701a6', '50e5f8ae-39e7-43a7-8e95-d65975e701a6', '{"sub":"50e5f8ae-39e7-43a7-8e95-d65975e701a6","email":"admin2@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-17 02:01:04.342233+00', '2026-05-17 00:34:51.221855+00', '2026-05-17 02:59:10.269813+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'a1fa3055-f772-4723-bd5f-6273edf411bc', 'authenticated', 'authenticated', 'gotourbookingke@gmail.com', '$2a$10$UCUZoHZyflMr9mCSdRs4C.ra4pvoKiBNxQKzVr7O7tjAlsBElA9Gq', '2026-05-25 15:01:37.338192+00', '2026-05-25 15:01:37.348264+00', '{"provider":"email","providers":["email"]}', '{"sub":"a1fa3055-f772-4723-bd5f-6273edf411bc","role":"patient","email":"gotourbookingke@gmail.com","phone":"0740197272","last_name":"Bookings","first_name":"Gotour","date_of_birth":"2026-05-03","email_verified":true,"phone_verified":false}', NULL, '2026-05-25 15:01:37.257963+00', '2026-05-25 16:00:29.889052+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a1fa3055-f772-4723-bd5f-6273edf411bc', 'a1fa3055-f772-4723-bd5f-6273edf411bc', '{"sub":"a1fa3055-f772-4723-bd5f-6273edf411bc","email":"gotourbookingke@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-05-25 15:01:37.348264+00', '2026-05-25 15:01:37.257963+00', '2026-05-25 16:00:29.889052+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'b75a45fa-84ba-4218-9afb-d46fb0eccd60', 'authenticated', 'authenticated', 'partner-patient-22pfwm@example.com', '$2a$10$x7dmWKu3JngQMvy0mRHv9uhySNcDXNmDq74w12oyiRT465mfspJnm', '2026-06-03 18:43:53.006771+00', '2026-06-03 18:43:53.019211+00', '{"provider":"email","providers":["email"]}', '{"sub":"b75a45fa-84ba-4218-9afb-d46fb0eccd60","role":"patient","email":"partner-patient-22pfwm@example.com","brand_id":"c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c","full_name":"Jane NorthStar 22PFWM","last_name":"NorthStar-22PFWM","first_name":"Jane","email_verified":true,"phone_verified":false}', NULL, '2026-06-03 18:43:52.914779+00', '2026-06-03 18:43:53.070537+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'b75a45fa-84ba-4218-9afb-d46fb0eccd60', 'b75a45fa-84ba-4218-9afb-d46fb0eccd60', '{"sub":"b75a45fa-84ba-4218-9afb-d46fb0eccd60","email":"partner-patient-22pfwm@example.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-03 18:43:53.019211+00', '2026-06-03 18:43:52.914779+00', '2026-06-03 18:43:53.070537+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, is_sso_user, deleted_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'd663b9d5-f91e-4f77-8172-6d830b975a5b', 'authenticated', 'authenticated', 'brandon@peakbodyco.com', '$2a$10$C6kr8Kfnz5fURa5CSsUDCOH03bRKe3sTDdi67UE.AD2XML164e.2S', '2026-05-17 00:41:11.920927+00', '2026-06-06 14:19:47.658376+00', '{"provider":"email","providers":["email"]}', '{"sub":"d663b9d5-f91e-4f77-8172-6d830b975a5b","role":"super_admin","email":"brandon@peakbodyco.com","brand_id":"peak","full_name":"Brandon Admin","last_name":"Admin","first_name":"Brandon","email_verified":true,"phone_verified":false}', NULL, '2026-05-17 00:41:11.880619+00', '2026-06-06 14:19:47.685886+00', NULL, NULL, 'false', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'd663b9d5-f91e-4f77-8172-6d830b975a5b', 'd663b9d5-f91e-4f77-8172-6d830b975a5b', '{"sub":"d663b9d5-f91e-4f77-8172-6d830b975a5b","email":"brandon@peakbodyco.com","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-06-06 14:19:47.658376+00', '2026-05-17 00:41:11.880619+00', '2026-06-06 14:19:47.685886+00')
ON CONFLICT (provider_id, provider) DO NOTHING;

