-- ============================================================================
-- FitVector — Phase 2 + 3 Seed Data
-- Date: 2026-03-27
-- Description: Populates all Phase 1, 2, and 3 tables with realistic mock data
-- Prerequisite: Run 20260327000001_phase2_phase3_tables.sql migration first
-- ============================================================================

-- Clear existing seed data (idempotent re-runs)
TRUNCATE salary_reports, verified_profiles, user_reputation, community_votes,
  community_comments, community_posts, boost_credits, application_boosts,
  promoted_listings, fitvector_applications, employer_usage, candidate_votes,
  candidate_notes, human_interviews, assessment_submissions, assessments,
  ai_interviews, applicants, job_posts, company_members, companies
  CASCADE;

DO $$
DECLARE
  -- ════════════════════════════════════════════════════════════════════════
  -- Phase 1: Users (10 seekers + 6 employers)
  -- ════════════════════════════════════════════════════════════════════════
  u_priya    UUID := gen_random_uuid();
  u_rahul    UUID := gen_random_uuid();
  u_ananya   UUID := gen_random_uuid();
  u_vikram   UUID := gen_random_uuid();
  u_sneha    UUID := gen_random_uuid();
  u_arjun    UUID := gen_random_uuid();
  u_kavita   UUID := gen_random_uuid();
  u_aditya   UUID := gen_random_uuid();
  u_meera    UUID := gen_random_uuid();
  u_rohan    UUID := gen_random_uuid();
  -- Employer users
  u_tn_admin UUID := gen_random_uuid();
  u_tn_rec   UUID := gen_random_uuid();
  u_fe_admin UUID := gen_random_uuid();
  u_fe_hm    UUID := gen_random_uuid();
  u_cm_admin UUID := gen_random_uuid();
  u_cm_rec   UUID := gen_random_uuid();

  -- ════════════════════════════════════════════════════════════════════════
  -- Phase 2: Companies
  -- ════════════════════════════════════════════════════════════════════════
  c_technova  UUID := gen_random_uuid();
  c_finedge   UUID := gen_random_uuid();
  c_cloudmat  UUID := gen_random_uuid();

  -- Job Posts
  jp_tn_sfe   UUID := gen_random_uuid(); -- TechNova Sr Frontend
  jp_tn_be    UUID := gen_random_uuid(); -- TechNova Backend
  jp_tn_devop UUID := gen_random_uuid(); -- TechNova DevOps
  jp_fe_ds    UUID := gen_random_uuid(); -- FinEdge Data Scientist
  jp_fe_fs    UUID := gen_random_uuid(); -- FinEdge Full Stack
  jp_cm_sre   UUID := gen_random_uuid(); -- CloudMatrix SRE
  jp_cm_pe    UUID := gen_random_uuid(); -- CloudMatrix Platform Eng
  jp_cm_jr    UUID := gen_random_uuid(); -- CloudMatrix Junior Dev

  -- Applicants (selected IDs for FK references)
  app_01 UUID := gen_random_uuid();
  app_02 UUID := gen_random_uuid();
  app_03 UUID := gen_random_uuid();
  app_04 UUID := gen_random_uuid();
  app_05 UUID := gen_random_uuid();
  app_06 UUID := gen_random_uuid();
  app_07 UUID := gen_random_uuid();
  app_08 UUID := gen_random_uuid();
  app_09 UUID := gen_random_uuid();
  app_10 UUID := gen_random_uuid();
  app_11 UUID := gen_random_uuid();
  app_12 UUID := gen_random_uuid();
  app_13 UUID := gen_random_uuid();
  app_14 UUID := gen_random_uuid();
  app_15 UUID := gen_random_uuid();
  app_16 UUID := gen_random_uuid();
  app_17 UUID := gen_random_uuid();
  app_18 UUID := gen_random_uuid();
  app_19 UUID := gen_random_uuid();
  app_20 UUID := gen_random_uuid();
  app_21 UUID := gen_random_uuid();
  app_22 UUID := gen_random_uuid();
  app_23 UUID := gen_random_uuid();
  app_24 UUID := gen_random_uuid();
  app_25 UUID := gen_random_uuid();

  -- Assessments
  assess_react UUID := gen_random_uuid();
  assess_code  UUID := gen_random_uuid();
  assess_sys   UUID := gen_random_uuid();

  -- AI Interviews
  ai_int_01 UUID := gen_random_uuid();
  ai_int_02 UUID := gen_random_uuid();
  ai_int_03 UUID := gen_random_uuid();
  ai_int_04 UUID := gen_random_uuid();
  ai_int_05 UUID := gen_random_uuid();
  ai_int_06 UUID := gen_random_uuid();
  ai_int_07 UUID := gen_random_uuid();
  ai_int_08 UUID := gen_random_uuid();

  -- FitVector Applications
  fva_01 UUID := gen_random_uuid();
  fva_02 UUID := gen_random_uuid();
  fva_03 UUID := gen_random_uuid();
  fva_04 UUID := gen_random_uuid();
  fva_05 UUID := gen_random_uuid();

  -- Tailored resumes (for FK references)
  tr_priya UUID := gen_random_uuid();
  tr_rahul UUID := gen_random_uuid();

  -- Scraped jobs (for FK references)
  sj_01 UUID := gen_random_uuid();
  sj_02 UUID := gen_random_uuid();
  sj_03 UUID := gen_random_uuid();
  sj_04 UUID := gen_random_uuid();
  sj_05 UUID := gen_random_uuid();

BEGIN

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: Base Data
-- ══════════════════════════════════════════════════════════════════════════════

-- === Users (16) ===
INSERT INTO users (id, email, full_name, auth_provider, email_verified, user_type, plan_tier, status, onboarding_completed, created_at) VALUES
  (u_priya,    'priya.sharma@gmail.com',      'Priya Sharma',     'credentials', true, '{seeker}', 'pro',     'active', true, NOW() - INTERVAL '60 days'),
  (u_rahul,    'rahul.verma@gmail.com',        'Rahul Verma',      'credentials', true, '{seeker}', 'starter', 'active', true, NOW() - INTERVAL '55 days'),
  (u_ananya,   'ananya.patel@gmail.com',       'Ananya Patel',     'credentials', true, '{seeker}', 'free',    'active', true, NOW() - INTERVAL '50 days'),
  (u_vikram,   'vikram.singh@gmail.com',       'Vikram Singh',     'credentials', true, '{seeker}', 'pro',     'active', true, NOW() - INTERVAL '45 days'),
  (u_sneha,    'sneha.gupta@gmail.com',        'Sneha Gupta',      'credentials', true, '{seeker}', 'starter', 'active', true, NOW() - INTERVAL '40 days'),
  (u_arjun,    'arjun.reddy@gmail.com',        'Arjun Reddy',      'credentials', true, '{seeker}', 'pro',     'active', true, NOW() - INTERVAL '38 days'),
  (u_kavita,   'kavita.nair@gmail.com',        'Kavita Nair',      'credentials', true, '{seeker}', 'free',    'active', true, NOW() - INTERVAL '35 days'),
  (u_aditya,   'aditya.kumar@gmail.com',       'Aditya Kumar',     'credentials', true, '{seeker}', 'starter', 'active', true, NOW() - INTERVAL '30 days'),
  (u_meera,    'meera.iyer@gmail.com',         'Meera Iyer',       'credentials', true, '{seeker}', 'free',    'active', true, NOW() - INTERVAL '25 days'),
  (u_rohan,    'rohan.das@gmail.com',          'Rohan Das',        'credentials', true, '{seeker}', 'free',    'active', true, NOW() - INTERVAL '20 days'),
  (u_tn_admin, 'admin@technova.com',           'Arjun Mehta',      'credentials', true, '{employer}', 'pro',   'active', true, NOW() - INTERVAL '90 days'),
  (u_tn_rec,   'recruiter@technova.com',       'Priya Iyer',       'credentials', true, '{employer}', 'pro',   'active', true, NOW() - INTERVAL '85 days'),
  (u_fe_admin, 'admin@finedge.com',            'Rajesh Kapoor',    'credentials', true, '{employer}', 'starter','active', true, NOW() - INTERVAL '80 days'),
  (u_fe_hm,    'hm@finedge.com',              'Sunita Menon',     'credentials', true, '{employer}', 'starter','active', true, NOW() - INTERVAL '75 days'),
  (u_cm_admin, 'admin@cloudmatrix.com',        'Deepak Agarwal',   'credentials', true, '{employer}', 'pro',   'active', true, NOW() - INTERVAL '70 days'),
  (u_cm_rec,   'recruiter@cloudmatrix.com',    'Nisha Patel',      'credentials', true, '{employer}', 'pro',   'active', true, NOW() - INTERVAL '65 days');

-- === User Profiles (10 seekers) ===
INSERT INTO user_profiles (id, user_id, "current_role", current_company, experience_level, target_roles, target_locations, preferred_work_mode, skills, parsed_resume_json, created_at) VALUES
  (gen_random_uuid(), u_priya,  'Frontend Developer', 'Infosys',       '3_7',    '{Senior Frontend Developer,React Developer}', '{Bangalore,Remote}', 'hybrid', '{React,TypeScript,Next.js,Tailwind CSS,GraphQL,Node.js,Jest,Figma}', '{"name":"Priya Sharma","email":"priya.sharma@gmail.com","summary":"Frontend developer with 4 years of experience building performant React applications. Passionate about design systems and web performance.","experience":[{"company":"Infosys","role":"Frontend Developer","dates":"2022-present","bullets":["Built React component library used by 12 teams","Reduced page load time by 40% through code splitting","Led migration from CRA to Next.js"]}],"education":[{"institution":"VIT Vellore","degree":"B.Tech Computer Science","year":2022}],"skills":["React","TypeScript","Next.js","Tailwind CSS","GraphQL","Node.js","Jest","Figma"]}'::jsonb, NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), u_rahul,  'Backend Developer',  'TCS',           '1_3',    '{Backend Engineer,Python Developer}',          '{Mumbai,Pune}',      'onsite',  '{Python,FastAPI,PostgreSQL,Redis,Docker,AWS,Git}', '{"name":"Rahul Verma","summary":"Backend developer with 2 years experience in Python and FastAPI. Strong in database design and API architecture."}'::jsonb, NOW() - INTERVAL '55 days'),
  (gen_random_uuid(), u_ananya, 'Software Intern',    'Startup XYZ',   'fresher', '{Full Stack Developer,Frontend Developer}',    '{Pune,Bangalore}',   'hybrid',  '{JavaScript,React,Node.js,MongoDB,HTML,CSS,Git}', '{"name":"Ananya Patel","summary":"Recent CS graduate with internship experience in full-stack development. Eager to learn and grow."}'::jsonb, NOW() - INTERVAL '50 days'),
  (gen_random_uuid(), u_vikram, 'DevOps Engineer',    'Wipro',         '3_7',    '{Senior DevOps Engineer,SRE}',                 '{Hyderabad,Remote}', 'remote',  '{AWS,Kubernetes,Terraform,Docker,CI/CD,Python,Linux,Monitoring}', '{"name":"Vikram Singh","summary":"DevOps engineer with 6 years experience managing large-scale cloud infrastructure."}'::jsonb, NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), u_sneha,  'Data Analyst',       'Deloitte',      '1_3',    '{Data Scientist,ML Engineer}',                 '{Delhi,Bangalore}',  'hybrid',  '{Python,SQL,Pandas,Scikit-learn,TensorFlow,Tableau,R}', '{"name":"Sneha Gupta","summary":"Data scientist with 3 years experience in predictive modeling and business analytics."}'::jsonb, NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), u_arjun,  'SRE Engineer',       'Flipkart',      '3_7',    '{SRE,Platform Engineer}',                      '{Bangalore}',        'hybrid',  '{Go,Kubernetes,AWS,Terraform,Prometheus,Grafana,Python,Linux}', '{"name":"Arjun Reddy","summary":"Site reliability engineer with 5 years building resilient distributed systems at scale."}'::jsonb, NOW() - INTERVAL '38 days'),
  (gen_random_uuid(), u_kavita, 'Associate PM',       'Razorpay',      '3_7',    '{Product Manager,Senior PM}',                  '{Mumbai,Bangalore}', 'hybrid',  '{Product Strategy,User Research,SQL,Jira,Figma,A/B Testing}', '{"name":"Kavita Nair","summary":"Product manager with 4 years experience in fintech and payments domain."}'::jsonb, NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), u_aditya, 'ML Engineer Intern', 'IISc Research', '1_3',    '{ML Engineer,Data Scientist}',                 '{Bangalore,Remote}', 'remote',  '{Python,PyTorch,TensorFlow,NLP,Computer Vision,SQL,Docker}', '{"name":"Aditya Kumar","summary":"ML engineer with 2 years experience in NLP and computer vision projects."}'::jsonb, NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), u_meera,  'QA Engineer',        'Zoho',          '1_3',    '{QA Lead,SDET}',                               '{Chennai,Bangalore}','onsite',  '{Selenium,Cypress,Playwright,Java,Python,API Testing,Git}', '{"name":"Meera Iyer","summary":"QA engineer with 3 years of expertise in test automation and CI/CD integration."}'::jsonb, NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), u_rohan,  'Android Intern',     'Swiggy',        'fresher', '{Mobile Developer,Android Developer}',          '{Kolkata,Bangalore}','hybrid',  '{Kotlin,Android,Jetpack Compose,Firebase,REST APIs,Git}', '{"name":"Rohan Das","summary":"Mobile developer with 1 year experience building Android apps with Kotlin and Jetpack Compose."}'::jsonb, NOW() - INTERVAL '20 days');

-- === Scraped Jobs (5 selected for FK refs, 15 more inline) ===
INSERT INTO jobs (id, source, sources, fingerprint, url, title, company_name, location, work_mode, job_type, description, skills_required, salary_min, salary_max, salary_currency, is_active, posted_at, created_at) VALUES
  (sj_01, 'linkedin', '{linkedin}', 'fp-sj01', 'https://linkedin.com/jobs/1', 'Senior Software Engineer', 'Flipkart', 'Bangalore', 'hybrid', 'fulltime', 'Build scalable systems for India''s leading e-commerce platform. Work with microservices, event-driven architecture, and ML-powered recommendations.', '{Java,Spring Boot,Kafka,PostgreSQL,AWS}', 2500000, 4000000, 'INR', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (sj_02, 'naukri',   '{naukri}',   'fp-sj02', 'https://naukri.com/jobs/2',   'Frontend Developer',       'Zomato',   'Gurgaon',   'hybrid', 'fulltime', 'Join Zomato''s web team to build delightful food ordering experiences. React, TypeScript, and performance optimization.', '{React,TypeScript,CSS,Webpack}', 1200000, 2200000, 'INR', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  (sj_03, 'indeed',   '{indeed}',   'fp-sj03', 'https://indeed.com/jobs/3',   'Data Scientist',           'Paytm',    'Noida',     'onsite', 'fulltime', 'Apply ML models to fraud detection, credit scoring, and user behavior analysis. Python, SQL, and deep learning expertise required.', '{Python,SQL,TensorFlow,Spark}', 1800000, 3000000, 'INR', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (sj_04, 'glassdoor','{glassdoor}','fp-sj04', 'https://glassdoor.com/jobs/4','DevOps Engineer',          'Freshworks','Chennai',   'remote', 'fulltime', 'Manage cloud infrastructure for a global SaaS platform. Kubernetes, Terraform, and CI/CD pipelines.', '{AWS,Kubernetes,Terraform,Docker,CI/CD}', 2000000, 3500000, 'INR', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (sj_05, 'google',   '{google}',   'fp-sj05', 'https://google.com/jobs/5',   'Product Manager',          'Ola',      'Mumbai',    'hybrid', 'fulltime', 'Drive product strategy for Ola''s ride-sharing platform. Work with engineering, design, and data teams.', '{Product Strategy,SQL,A/B Testing,Jira}', 2200000, 3800000, 'INR', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- 15 more scraped jobs
INSERT INTO jobs (source, sources, fingerprint, url, title, company_name, location, work_mode, job_type, description, skills_required, salary_min, salary_max, is_active, posted_at, created_at) VALUES
  ('linkedin','{linkedin}','fp-sj06','https://linkedin.com/jobs/6','Backend Engineer','Razorpay','Bangalore','hybrid','fulltime','Build payment infrastructure that powers millions of businesses.','{Go,PostgreSQL,Kafka,gRPC}',2000000,3500000,true,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),
  ('naukri','{naukri}','fp-sj07','https://naukri.com/jobs/7','QA Automation Lead','Zoho','Chennai','onsite','fulltime','Lead test automation strategy for Zoho''s product suite.','{Selenium,Python,CI/CD,API Testing}',1500000,2500000,true,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
  ('indeed','{indeed}','fp-sj08','https://indeed.com/jobs/8','ML Engineer','PhonePe','Bangalore','hybrid','fulltime','Build ML models for fraud detection and risk assessment.','{Python,PyTorch,Spark,AWS}',2500000,4000000,true,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days'),
  ('linkedin','{linkedin}','fp-sj09','https://linkedin.com/jobs/9','SRE Engineer','Swiggy','Bangalore','remote','fulltime','Ensure 99.99% uptime for India''s food delivery platform.','{Go,Kubernetes,AWS,Monitoring}',2200000,3800000,true,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'),
  ('naukri','{naukri}','fp-sj10','https://naukri.com/jobs/10','Android Developer','CRED','Bangalore','hybrid','fulltime','Build beautiful Android experiences for CRED''s fintech app.','{Kotlin,Jetpack Compose,MVVM}',1800000,3000000,true,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'),
  ('glassdoor','{glassdoor}','fp-sj11','https://glassdoor.com/jobs/11','Full Stack Developer','Meesho','Bangalore','hybrid','fulltime','Build features for India''s social commerce platform.','{React,Node.js,PostgreSQL,Redis}',1200000,2200000,true,NOW()-INTERVAL '11 days',NOW()-INTERVAL '11 days'),
  ('linkedin','{linkedin}','fp-sj12','https://linkedin.com/jobs/12','UI/UX Designer','Zerodha','Bangalore','remote','fulltime','Design intuitive trading interfaces for millions of users.','{Figma,Design Systems,Prototyping}',1500000,2800000,true,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days'),
  ('indeed','{indeed}','fp-sj13','https://indeed.com/jobs/13','Cloud Architect','Infosys','Hyderabad','hybrid','fulltime','Architect cloud solutions for enterprise clients.','{AWS,Azure,Terraform,Kubernetes}',3000000,5000000,true,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
  ('naukri','{naukri}','fp-sj14','https://naukri.com/jobs/14','React Developer','TCS','Pune','onsite','fulltime','Build enterprise dashboards with React and TypeScript.','{React,TypeScript,Redux,REST APIs}',800000,1500000,true,NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days'),
  ('google','{google}','fp-sj15','https://google.com/jobs/15','Platform Engineer','Atlassian','Bangalore','remote','fulltime','Build developer platform tools and CI/CD infrastructure.','{Go,Kubernetes,ArgoCD,Terraform}',2800000,4500000,true,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),
  ('linkedin','{linkedin}','fp-sj16','https://linkedin.com/jobs/16','Data Analyst','Flipkart','Bangalore','hybrid','fulltime','Analyze user behavior and business metrics.','{SQL,Python,Tableau,Excel}',1000000,1800000,true,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days'),
  ('naukri','{naukri}','fp-sj17','https://naukri.com/jobs/17','iOS Developer','PhonePe','Bangalore','hybrid','fulltime','Build iOS features for India''s leading payments app.','{Swift,UIKit,SwiftUI,Core Data}',1800000,3000000,true,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
  ('indeed','{indeed}','fp-sj18','https://indeed.com/jobs/18','Engineering Manager','Razorpay','Bangalore','hybrid','fulltime','Lead a team of 8-12 engineers building payment APIs.','{Engineering Management,System Design,Go,PostgreSQL}',4000000,6000000,true,NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day'),
  ('glassdoor','{glassdoor}','fp-sj19','https://glassdoor.com/jobs/19','Tech Lead','Swiggy','Bangalore','hybrid','fulltime','Technical leadership for the logistics engineering team.','{Java,System Design,Kafka,AWS}',3500000,5500000,true,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'),
  ('linkedin','{linkedin}','fp-sj20','https://linkedin.com/jobs/20','Junior Developer','Wipro','Pune','onsite','fulltime','Entry-level role for fresh graduates. Training provided.','{Java,SQL,Git,HTML/CSS}',400000,700000,true,NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days');

-- === Job Matches (50 — 5 per seeker) ===
INSERT INTO job_matches (user_id, job_id, match_score, match_bucket, decision_label, is_seen, is_saved, created_at) VALUES
  -- Priya (Frontend) matches
  (u_priya, sj_02, 92, 'strong_fit',    'apply_now',           true,  true,  NOW()-INTERVAL '5 days'),
  (u_priya, sj_01, 68, 'good_fit',      'prepare_then_apply',  true,  false, NOW()-INTERVAL '5 days'),
  (u_priya, sj_03, 35, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '4 days'),
  (u_priya, sj_04, 42, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '3 days'),
  (u_priya, sj_05, 55, 'potential_fit',  'prepare_then_apply',  true,  false, NOW()-INTERVAL '2 days'),
  -- Rahul (Backend)
  (u_rahul, sj_01, 78, 'good_fit',      'apply_now',           true,  true,  NOW()-INTERVAL '4 days'),
  (u_rahul, sj_03, 62, 'good_fit',      'prepare_then_apply',  true,  false, NOW()-INTERVAL '4 days'),
  (u_rahul, sj_02, 45, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '3 days'),
  (u_rahul, sj_04, 55, 'potential_fit',  'prepare_then_apply',  false, false, NOW()-INTERVAL '3 days'),
  (u_rahul, sj_05, 38, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '2 days'),
  -- Ananya (Full Stack fresher)
  (u_ananya, sj_02, 58, 'potential_fit', 'prepare_then_apply',  true,  true,  NOW()-INTERVAL '3 days'),
  (u_ananya, sj_01, 42, 'potential_fit', 'explore',             true,  false, NOW()-INTERVAL '3 days'),
  (u_ananya, sj_03, 35, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '2 days'),
  (u_ananya, sj_04, 30, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '2 days'),
  (u_ananya, sj_05, 40, 'potential_fit', 'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Vikram (DevOps)
  (u_vikram, sj_04, 95, 'strong_fit',   'apply_now',           true,  true,  NOW()-INTERVAL '3 days'),
  (u_vikram, sj_01, 55, 'potential_fit', 'prepare_then_apply',  true,  false, NOW()-INTERVAL '3 days'),
  (u_vikram, sj_02, 30, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '2 days'),
  (u_vikram, sj_03, 38, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '2 days'),
  (u_vikram, sj_05, 45, 'potential_fit', 'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Sneha (Data Science)
  (u_sneha, sj_03, 88, 'strong_fit',    'apply_now',           true,  true,  NOW()-INTERVAL '2 days'),
  (u_sneha, sj_01, 52, 'potential_fit',  'prepare_then_apply',  true,  false, NOW()-INTERVAL '2 days'),
  (u_sneha, sj_02, 35, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_sneha, sj_04, 40, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_sneha, sj_05, 60, 'good_fit',      'prepare_then_apply',  false, false, NOW()-INTERVAL '1 day'),
  -- Arjun (SRE)
  (u_arjun, sj_04, 90, 'strong_fit',    'apply_now',           true,  true,  NOW()-INTERVAL '2 days'),
  (u_arjun, sj_01, 72, 'good_fit',      'apply_now',           true,  false, NOW()-INTERVAL '2 days'),
  (u_arjun, sj_03, 38, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_arjun, sj_02, 32, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_arjun, sj_05, 48, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Kavita (PM)
  (u_kavita, sj_05, 85, 'strong_fit',   'apply_now',           true,  true,  NOW()-INTERVAL '3 days'),
  (u_kavita, sj_01, 45, 'potential_fit', 'explore',             true,  false, NOW()-INTERVAL '3 days'),
  (u_kavita, sj_02, 38, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '2 days'),
  (u_kavita, sj_03, 55, 'potential_fit', 'prepare_then_apply',  false, false, NOW()-INTERVAL '2 days'),
  (u_kavita, sj_04, 35, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Aditya (ML)
  (u_aditya, sj_03, 82, 'strong_fit',   'apply_now',           true,  true,  NOW()-INTERVAL '2 days'),
  (u_aditya, sj_01, 60, 'good_fit',     'prepare_then_apply',  true,  false, NOW()-INTERVAL '2 days'),
  (u_aditya, sj_02, 35, 'weak_fit',     'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_aditya, sj_04, 48, 'potential_fit', 'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_aditya, sj_05, 42, 'potential_fit', 'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Meera (QA)
  (u_meera, sj_01, 50, 'potential_fit',  'prepare_then_apply',  true,  false, NOW()-INTERVAL '2 days'),
  (u_meera, sj_02, 38, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_meera, sj_03, 42, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_meera, sj_04, 55, 'potential_fit',  'prepare_then_apply',  true,  false, NOW()-INTERVAL '1 day'),
  (u_meera, sj_05, 35, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  -- Rohan (Mobile)
  (u_rohan, sj_02, 55, 'potential_fit',  'prepare_then_apply',  true,  false, NOW()-INTERVAL '1 day'),
  (u_rohan, sj_01, 48, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_rohan, sj_03, 30, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_rohan, sj_04, 35, 'weak_fit',      'explore',             false, false, NOW()-INTERVAL '1 day'),
  (u_rohan, sj_05, 40, 'potential_fit',  'explore',             false, false, NOW()-INTERVAL '1 day');

-- === Tailored Resumes (2 for FK refs) ===
INSERT INTO tailored_resumes (id, user_id, job_id, version_name, template_id, latex_source, job_title, company_name, created_at) VALUES
  (tr_priya, u_priya, sj_02, 'Tailored for Zomato Frontend', 'modern', '\documentclass{article}\begin{document}Priya Sharma - Frontend Developer\end{document}', 'Frontend Developer', 'Zomato', NOW()-INTERVAL '4 days'),
  (tr_rahul, u_rahul, sj_01, 'Tailored for Flipkart Backend', 'modern', '\documentclass{article}\begin{document}Rahul Verma - Backend Engineer\end{document}', 'Senior Software Engineer', 'Flipkart', NOW()-INTERVAL '3 days');

-- === Applications / Tracker (15) ===
INSERT INTO applications (user_id, job_id, job_title, company_name, status, status_history, tailored_resume_id, applied_at, notes, position_order, created_at) VALUES
  (u_priya, sj_02, 'Frontend Developer','Zomato','applied','[{"status":"saved","changed_at":"2026-03-20"},{"status":"applied","changed_at":"2026-03-22"}]'::jsonb, tr_priya, NOW()-INTERVAL '5 days', 'Applied through LinkedIn', 0, NOW()-INTERVAL '5 days'),
  (u_priya, sj_01, 'Senior Software Engineer','Flipkart','screening','[{"status":"applied","changed_at":"2026-03-18"},{"status":"screening","changed_at":"2026-03-21"}]'::jsonb, NULL, NOW()-INTERVAL '9 days', NULL, 1, NOW()-INTERVAL '9 days'),
  (u_rahul, sj_01, 'Senior Software Engineer','Flipkart','interview','[{"status":"applied","changed_at":"2026-03-15"},{"status":"screening","changed_at":"2026-03-18"},{"status":"interview","changed_at":"2026-03-22"}]'::jsonb, tr_rahul, NOW()-INTERVAL '12 days', 'Technical round scheduled', 0, NOW()-INTERVAL '12 days'),
  (u_rahul, sj_03, 'Data Scientist','Paytm','applied','[{"status":"applied","changed_at":"2026-03-24"}]'::jsonb, NULL, NOW()-INTERVAL '3 days', NULL, 1, NOW()-INTERVAL '3 days'),
  (u_vikram, sj_04, 'DevOps Engineer','Freshworks','offer','[{"status":"applied","changed_at":"2026-03-10"},{"status":"screening","changed_at":"2026-03-12"},{"status":"interview","changed_at":"2026-03-18"},{"status":"offer","changed_at":"2026-03-25"}]'::jsonb, NULL, NOW()-INTERVAL '17 days', 'Offer: 32L + RSUs', 0, NOW()-INTERVAL '17 days'),
  (u_sneha, sj_03, 'Data Scientist','Paytm','screening','[{"status":"applied","changed_at":"2026-03-20"},{"status":"screening","changed_at":"2026-03-23"}]'::jsonb, NULL, NOW()-INTERVAL '7 days', NULL, 0, NOW()-INTERVAL '7 days'),
  (u_arjun, sj_04, 'DevOps Engineer','Freshworks','interview','[{"status":"applied","changed_at":"2026-03-14"},{"status":"screening","changed_at":"2026-03-17"},{"status":"interview","changed_at":"2026-03-22"}]'::jsonb, NULL, NOW()-INTERVAL '13 days', 'System design round next', 0, NOW()-INTERVAL '13 days'),
  (u_kavita, sj_05, 'Product Manager','Ola','applied','[{"status":"applied","changed_at":"2026-03-22"}]'::jsonb, NULL, NOW()-INTERVAL '5 days', NULL, 0, NOW()-INTERVAL '5 days'),
  (u_ananya, sj_02, 'Frontend Developer','Zomato','saved','[{"status":"saved","changed_at":"2026-03-24"}]'::jsonb, NULL, NULL, 'Looks interesting', 0, NOW()-INTERVAL '3 days'),
  (u_ananya, sj_01, 'Senior Software Engineer','Flipkart','saved','[{"status":"saved","changed_at":"2026-03-25"}]'::jsonb, NULL, NULL, NULL, 1, NOW()-INTERVAL '2 days'),
  (u_rohan, sj_02, 'Frontend Developer','Zomato','rejected','[{"status":"applied","changed_at":"2026-03-12"},{"status":"screening","changed_at":"2026-03-15"},{"status":"rejected","changed_at":"2026-03-20"}]'::jsonb, NULL, NOW()-INTERVAL '15 days', 'Rejected: need more experience', 0, NOW()-INTERVAL '15 days'),
  (u_meera, sj_04, 'DevOps Engineer','Freshworks','applied','[{"status":"applied","changed_at":"2026-03-23"}]'::jsonb, NULL, NOW()-INTERVAL '4 days', NULL, 0, NOW()-INTERVAL '4 days'),
  (u_aditya, sj_03, 'Data Scientist','Paytm','interview','[{"status":"applied","changed_at":"2026-03-16"},{"status":"screening","changed_at":"2026-03-19"},{"status":"interview","changed_at":"2026-03-24"}]'::jsonb, NULL, NOW()-INTERVAL '11 days', 'ML round scheduled', 0, NOW()-INTERVAL '11 days'),
  (u_ananya, sj_05, 'Product Manager','Ola','saved','[{"status":"saved","changed_at":"2026-03-26"}]'::jsonb, NULL, NULL, NULL, 2, NOW()-INTERVAL '1 day'),
  (u_rohan, sj_01, 'Senior Software Engineer','Flipkart','rejected','[{"status":"applied","changed_at":"2026-03-10"},{"status":"rejected","changed_at":"2026-03-14"}]'::jsonb, NULL, NOW()-INTERVAL '17 days', 'Auto-rejected: experience too low', 0, NOW()-INTERVAL '17 days');

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: Employer Data
-- ══════════════════════════════════════════════════════════════════════════════

-- === Companies (3) ===
INSERT INTO companies (id, name, logo_url, website_url, industry, company_size, description, culture_keywords, locations, branding, created_by, plan_tier, created_at) VALUES
  (c_technova, 'TechNova Solutions', NULL, 'https://technova.io', 'saas', '51-200',
   'TechNova builds AI-powered developer tools that help engineering teams ship faster. Series A funded, growing rapidly.',
   '{innovation,ownership,remote-first,builder mindset,transparency}',
   '[{"city":"Bangalore","state":"Karnataka","country":"India"},{"city":"San Francisco","state":"CA","country":"USA"}]'::jsonb,
   '{}'::jsonb, u_tn_admin, 'growth', NOW()-INTERVAL '90 days'),
  (c_finedge, 'FinEdge Analytics', NULL, 'https://finedge.in', 'fintech', '11-50',
   'FinEdge provides AI-driven analytics for financial services. Helping banks and NBFCs make data-driven lending decisions.',
   '{data-driven,fast-paced,transparency,customer-first}',
   '[{"city":"Mumbai","state":"Maharashtra","country":"India"}]'::jsonb,
   '{}'::jsonb, u_fe_admin, 'starter', NOW()-INTERVAL '80 days'),
  (c_cloudmat, 'CloudMatrix', NULL, 'https://cloudmatrix.io', 'technology', '201-1000',
   'CloudMatrix builds cloud infrastructure products for enterprises. Trusted by 500+ companies across India.',
   '{scale,reliability,collaboration,engineering excellence}',
   '[{"city":"Hyderabad","state":"Telangana","country":"India"},{"city":"Bangalore","state":"Karnataka","country":"India"}]'::jsonb,
   '{}'::jsonb, u_cm_admin, 'business', NOW()-INTERVAL '70 days');

-- === Company Members (6) ===
INSERT INTO company_members (company_id, user_id, role, invited_by, status, invited_at, created_at) VALUES
  (c_technova, u_tn_admin, 'admin',          NULL,        'active', NOW()-INTERVAL '90 days', NOW()-INTERVAL '90 days'),
  (c_technova, u_tn_rec,   'recruiter',      u_tn_admin,  'active', NOW()-INTERVAL '85 days', NOW()-INTERVAL '85 days'),
  (c_finedge,  u_fe_admin, 'admin',          NULL,        'active', NOW()-INTERVAL '80 days', NOW()-INTERVAL '80 days'),
  (c_finedge,  u_fe_hm,    'hiring_manager', u_fe_admin,  'active', NOW()-INTERVAL '75 days', NOW()-INTERVAL '75 days'),
  (c_cloudmat, u_cm_admin, 'admin',          NULL,        'active', NOW()-INTERVAL '70 days', NOW()-INTERVAL '70 days'),
  (c_cloudmat, u_cm_rec,   'recruiter',      u_cm_admin,  'active', NOW()-INTERVAL '65 days', NOW()-INTERVAL '65 days');

-- === Job Posts (8) ===
INSERT INTO job_posts (id, company_id, created_by, title, department, location, work_mode, job_type, experience_min, experience_max, salary_min, salary_max, salary_visible, description, required_skills, nice_to_have_skills, screening_questions, status, applications_count, created_at) VALUES
  (jp_tn_sfe, c_technova, u_tn_admin, 'Senior Frontend Developer', 'Engineering', 'Bangalore, India', 'hybrid', 'fulltime', 3, 7, 1800000, 3000000, true,
   'Lead frontend development for our AI-powered dashboard. Build beautiful, performant React interfaces used by thousands of developers daily.',
   '{React,TypeScript,Next.js,Tailwind CSS,REST APIs}', '{GraphQL,Figma,Vitest,AWS}',
   '[{"id":"sq-01","question":"Describe a complex UI component you built and the decisions involved.","type":"short_answer","required":true},{"id":"sq-02","question":"Are you comfortable working hybrid (3 days in-office)?","type":"yes_no","required":true}]'::jsonb,
   'active', 12, NOW()-INTERVAL '30 days'),
  (jp_tn_be, c_technova, u_tn_admin, 'Backend Engineer', 'Engineering', 'Remote', 'remote', 'fulltime', 1, 3, 1200000, 2000000, false,
   'Build scalable APIs and data pipelines for our AI engine. Python, FastAPI, and modern backend architecture.',
   '{Python,FastAPI,PostgreSQL,Redis,Docker}', '{Kubernetes,AI/ML,Elasticsearch}',
   '[{"id":"sq-03","question":"What is your experience with AI-powered applications?","type":"short_answer","required":true}]'::jsonb,
   'active', 8, NOW()-INTERVAL '25 days'),
  (jp_tn_devop, c_technova, u_tn_rec, 'DevOps Engineer', 'Infrastructure', 'Remote', 'remote', 'contract', 5, 10, NULL, NULL, false,
   'Set up CI/CD pipelines, Kubernetes clusters, and monitoring infrastructure. 6-month contract.',
   '{AWS,Kubernetes,Terraform,CI/CD,Docker}', '{GCP,Datadog,ArgoCD}',
   '[]'::jsonb, 'paused', 3, NOW()-INTERVAL '60 days'),
  (jp_fe_ds, c_finedge, u_fe_admin, 'Data Scientist', 'Data', 'Mumbai, India', 'hybrid', 'fulltime', 2, 5, 1500000, 2500000, true,
   'Apply ML models to credit scoring and risk analytics. Work with large financial datasets.',
   '{Python,SQL,Scikit-learn,Pandas,TensorFlow}', '{Spark,Airflow,MLflow}',
   '[{"id":"sq-04","question":"Describe an ML model you deployed to production.","type":"short_answer","required":true}]'::jsonb,
   'active', 6, NOW()-INTERVAL '20 days'),
  (jp_fe_fs, c_finedge, u_fe_hm, 'Full Stack Developer', 'Engineering', 'Mumbai, India', 'onsite', 'fulltime', 1, 3, 1000000, 1800000, true,
   'Build end-to-end features for our analytics dashboard. React frontend with Node.js/Express backend.',
   '{React,Node.js,TypeScript,PostgreSQL}', '{Redis,Docker,AWS}',
   '[]'::jsonb, 'active', 5, NOW()-INTERVAL '18 days'),
  (jp_cm_sre, c_cloudmat, u_cm_admin, 'SRE Engineer', 'Platform', 'Hyderabad, India', 'hybrid', 'fulltime', 3, 7, 2000000, 3500000, true,
   'Ensure 99.99% availability for our cloud platform. Build monitoring, alerting, and incident response systems.',
   '{Go,Kubernetes,AWS,Prometheus,Terraform}', '{Grafana,PagerDuty,Istio}',
   '[{"id":"sq-05","question":"Describe a major production incident you resolved.","type":"short_answer","required":true}]'::jsonb,
   'active', 7, NOW()-INTERVAL '22 days'),
  (jp_cm_pe, c_cloudmat, u_cm_admin, 'Platform Engineer', 'Platform', 'Hyderabad, India', 'hybrid', 'fulltime', 5, 10, 2500000, 4000000, true,
   'Design and build internal developer platforms. Kubernetes, service mesh, and developer experience.',
   '{Go,Kubernetes,Terraform,CI/CD,Python}', '{Istio,ArgoCD,Backstage}',
   '[]'::jsonb, 'active', 4, NOW()-INTERVAL '15 days'),
  (jp_cm_jr, c_cloudmat, u_cm_rec, 'Junior Developer', 'Engineering', 'Hyderabad, India', 'onsite', 'internship', 0, 1, 400000, 700000, true,
   'Entry-level role for fresh graduates. 6-month training program with mentorship.',
   '{Java,SQL,Git}', '{Spring Boot,React,Docker}',
   '[]'::jsonb, 'closed', 15, NOW()-INTERVAL '45 days');

-- === Applicants (25) ===
-- FitVector users applying (10)
INSERT INTO applicants (id, job_post_id, user_id, name, email, role_title, current_company, experience, source, screening_score, screening_breakdown, screening_summary, bucket, pipeline_stage, created_at) VALUES
  (app_01, jp_tn_sfe, u_priya, 'Priya Sharma','priya.sharma@gmail.com','Frontend Developer','Infosys',4,'fitvector_organic', 88, '{"skill_match":92,"experience_relevance":85,"education_fit":80,"achievement_signals":90,"culture_fit":85,"screening_questions":88}'::jsonb, 'Strong frontend skills with React/TypeScript. Excellent portfolio.', 'strong_fit', 'ai_interviewed', NOW()-INTERVAL '28 days'),
  (app_02, jp_tn_be, u_rahul, 'Rahul Verma','rahul.verma@gmail.com','Backend Developer','TCS',2,'fitvector_organic', 72, '{"skill_match":70,"experience_relevance":68,"education_fit":75,"achievement_signals":72,"culture_fit":78,"screening_questions":70}'::jsonb, 'Good Python fundamentals. Needs more experience with distributed systems.', 'good_fit', 'ai_screened', NOW()-INTERVAL '22 days'),
  (app_03, jp_fe_ds, u_sneha, 'Sneha Gupta','sneha.gupta@gmail.com','Data Analyst','Deloitte',3,'fitvector_organic', 82, '{"skill_match":85,"experience_relevance":80,"education_fit":82,"achievement_signals":78,"culture_fit":80,"screening_questions":85}'::jsonb, 'Strong data science skills. Good ML project portfolio.', 'strong_fit', 'assessment', NOW()-INTERVAL '18 days'),
  (app_04, jp_cm_sre, u_arjun, 'Arjun Reddy','arjun.reddy@gmail.com','SRE Engineer','Flipkart',5,'fitvector_organic', 91, '{"skill_match":95,"experience_relevance":90,"education_fit":85,"achievement_signals":92,"culture_fit":88,"screening_questions":90}'::jsonb, 'Exceptional SRE with scale experience at Flipkart. Top candidate.', 'strong_fit', 'human_interview', NOW()-INTERVAL '20 days'),
  (app_05, jp_cm_sre, u_vikram, 'Vikram Singh','vikram.singh@gmail.com','DevOps Engineer','Wipro',6,'fitvector_organic', 85, '{"skill_match":88,"experience_relevance":82,"education_fit":80,"achievement_signals":85,"culture_fit":82,"screening_questions":88}'::jsonb, 'Strong DevOps background. Good Kubernetes experience.', 'strong_fit', 'ai_interviewed', NOW()-INTERVAL '19 days'),
  (app_06, jp_fe_fs, u_ananya, 'Ananya Patel','ananya.patel@gmail.com','Software Intern','Startup XYZ',1,'fitvector_organic', 55, '{"skill_match":60,"experience_relevance":45,"education_fit":70,"achievement_signals":50,"culture_fit":55,"screening_questions":50}'::jsonb, 'Fresher with potential. Good React basics but limited experience.', 'potential_fit', 'applied', NOW()-INTERVAL '15 days'),
  (app_07, jp_tn_sfe, u_aditya, 'Aditya Kumar','aditya.kumar@gmail.com','ML Engineer Intern','IISc',2,'fitvector_organic', 48, '{"skill_match":45,"experience_relevance":40,"education_fit":65,"achievement_signals":50,"culture_fit":55,"screening_questions":42}'::jsonb, 'ML background doesnt align well with frontend role.', 'potential_fit', 'applied', NOW()-INTERVAL '25 days'),
  (app_08, jp_cm_pe, u_vikram, 'Vikram Singh','vikram.singh@gmail.com','DevOps Engineer','Wipro',6,'fitvector_organic', 78, '{"skill_match":80,"experience_relevance":75,"education_fit":78,"achievement_signals":80,"culture_fit":76,"screening_questions":78}'::jsonb, 'Good platform engineering potential. Strong infra background.', 'good_fit', 'ai_screened', NOW()-INTERVAL '12 days'),
  (app_09, jp_tn_sfe, u_kavita, 'Kavita Nair','kavita.nair@gmail.com','Associate PM','Razorpay',4,'fitvector_organic', 35, '{"skill_match":30,"experience_relevance":25,"education_fit":40,"achievement_signals":45,"culture_fit":50,"screening_questions":30}'::jsonb, 'PM background not aligned with frontend dev role.', 'weak_fit', 'rejected', NOW()-INTERVAL '26 days'),
  (app_10, jp_cm_jr, u_rohan, 'Rohan Das','rohan.das@gmail.com','Android Intern','Swiggy',1,'fitvector_organic', 62, '{"skill_match":58,"experience_relevance":55,"education_fit":70,"achievement_signals":60,"culture_fit":68,"screening_questions":65}'::jsonb, 'Good potential for junior role. Mobile background is a plus.', 'good_fit', 'offer', NOW()-INTERVAL '40 days');

-- External applicants (15)
INSERT INTO applicants (id, job_post_id, user_id, name, email, role_title, current_company, experience, source, screening_score, screening_summary, bucket, pipeline_stage, created_at) VALUES
  (app_11, jp_tn_sfe, NULL, 'Deepak Joshi','deepak.j@yahoo.com','Sr Frontend Dev','Myntra',5,'external_link', 85, 'Strong React candidate from Myntra.', 'strong_fit', 'human_interview', NOW()-INTERVAL '27 days'),
  (app_12, jp_tn_sfe, NULL, 'Riya Malhotra','riya.m@outlook.com','Frontend Dev','Accenture',3,'external_link', 68, 'Good skills but limited product company experience.', 'good_fit', 'ai_screened', NOW()-INTERVAL '26 days'),
  (app_13, jp_tn_be, NULL, 'Saurabh Patel','saurabh.p@gmail.com','Backend Dev','Mindtree',2,'referral', 75, 'Referred by team member. Strong Python skills.', 'good_fit', 'ai_interviewed', NOW()-INTERVAL '20 days'),
  (app_14, jp_tn_be, NULL, 'Tanvi Shah','tanvi.s@gmail.com','Jr Developer','Startup ABC',1,'external_link', 52, 'Limited backend experience but shows potential.', 'potential_fit', 'applied', NOW()-INTERVAL '18 days'),
  (app_15, jp_fe_ds, NULL, 'Nikhil Rao','nikhil.r@hotmail.com','Data Analyst','KPMG',3,'external_link', 78, 'Good analytics background. Learning ML.', 'good_fit', 'ai_screened', NOW()-INTERVAL '16 days'),
  (app_16, jp_fe_ds, NULL, 'Pooja Sharma','pooja.s@gmail.com','Research Associate','IIT Delhi',2,'referral', 80, 'Strong academic background in ML. Published papers.', 'strong_fit', 'ai_interviewed', NOW()-INTERVAL '15 days'),
  (app_17, jp_fe_fs, NULL, 'Kartik Menon','kartik.m@gmail.com','Full Stack Dev','Freelance',2,'external_link', 65, 'Diverse project experience but lacks enterprise background.', 'good_fit', 'ai_screened', NOW()-INTERVAL '14 days'),
  (app_18, jp_cm_sre, NULL, 'Suresh Kumar','suresh.k@gmail.com','SRE','Amazon',4,'referral', 88, 'Amazon SRE experience. Strong on-call and incident mgmt.', 'strong_fit', 'offer', NOW()-INTERVAL '18 days'),
  (app_19, jp_cm_pe, NULL, 'Ankita Verma','ankita.v@gmail.com','Platform Eng','Google',6,'external_link', 92, 'Google platform engineering exp. Top candidate.', 'strong_fit', 'human_interview', NOW()-INTERVAL '10 days'),
  (app_20, jp_cm_jr, NULL, 'Amit Gupta','amit.g@gmail.com','Fresher','None',0,'external_link', 58, 'Fresh graduate with good DSA skills.', 'potential_fit', 'hired', NOW()-INTERVAL '35 days'),
  (app_21, jp_tn_sfe, NULL, 'Varun Reddy','varun.r@gmail.com','Frontend Dev','TCS',2,'external_link', 42, 'Basic React skills. Needs more experience.', 'potential_fit', 'rejected', NOW()-INTERVAL '24 days'),
  (app_22, jp_tn_devop, NULL, 'Manish Tiwari','manish.t@gmail.com','DevOps Lead','Cognizant',7,'external_link', 80, 'Strong DevOps lead with enterprise experience.', 'strong_fit', 'applied', NOW()-INTERVAL '55 days'),
  (app_23, jp_cm_sre, NULL, 'Prashant Jain','prashant.j@gmail.com','Jr SRE','Freshworks',2,'external_link', 55, 'Junior SRE. Learning Kubernetes.', 'potential_fit', 'ai_screened', NOW()-INTERVAL '17 days'),
  (app_24, jp_fe_fs, NULL, 'Divya Nair','divya.n@gmail.com','Frontend Dev','Zoho',2,'referral', 70, 'Good React skills from Zoho. Can do full stack.', 'good_fit', 'applied', NOW()-INTERVAL '12 days'),
  (app_25, jp_tn_be, NULL, 'Harsh Vardhan','harsh.v@gmail.com','Backend Intern','Razorpay',1,'referral', 68, 'Razorpay intern with good Python/FastAPI exposure.', 'good_fit', 'applied', NOW()-INTERVAL '16 days');

-- === AI Interviews (8) ===
INSERT INTO ai_interviews (id, applicant_id, job_post_id, interview_type, duration_planned, duration_actual, status, started_at, completed_at, overall_score, skill_scores, strengths, concerns, cheating_confidence, ai_recommendation, transcript, created_at) VALUES
  (ai_int_01, app_01, jp_tn_sfe, 'technical', 30, 28, 'completed', NOW()-INTERVAL '25 days', NOW()-INTERVAL '25 days', 85,
   '[{"skill":"React","score":90,"justification":"Deep understanding of hooks, context, and performance"},{"skill":"TypeScript","score":85,"justification":"Strong type system knowledge"},{"skill":"System Design","score":80,"justification":"Good component architecture thinking"}]'::jsonb,
   '["Excellent React component design","Strong TypeScript proficiency","Clear communication"]'::jsonb,
   '["Limited experience with micro-frontends","Could improve on testing strategies"]'::jsonb,
   'low', 'strong_advance',
   '[{"speaker":"ai","text":"Tell me about a complex React component you built.","timestamp":0},{"speaker":"candidate","text":"I built a real-time collaborative editor using React and WebSockets...","timestamp":5}]'::jsonb,
   NOW()-INTERVAL '25 days'),
  (ai_int_02, app_05, jp_cm_sre, 'technical', 30, 32, 'completed', NOW()-INTERVAL '16 days', NOW()-INTERVAL '16 days', 78,
   '[{"skill":"Kubernetes","score":82,"justification":"Good cluster management knowledge"},{"skill":"AWS","score":75,"justification":"Solid AWS fundamentals"},{"skill":"Monitoring","score":80,"justification":"Strong observability mindset"}]'::jsonb,
   '["Strong infrastructure knowledge","Good incident response skills","Systematic approach"]'::jsonb,
   '["Limited Go programming experience","Needs more hands-on Terraform"]'::jsonb,
   'low', 'advance',
   '[{"speaker":"ai","text":"Walk me through how you would design a monitoring system.","timestamp":0},{"speaker":"candidate","text":"I would start with defining SLOs and then...","timestamp":5}]'::jsonb,
   NOW()-INTERVAL '16 days'),
  (ai_int_03, app_13, jp_tn_be, 'technical', 30, 26, 'completed', NOW()-INTERVAL '17 days', NOW()-INTERVAL '17 days', 72,
   '[{"skill":"Python","score":78,"justification":"Good Python fundamentals"},{"skill":"APIs","score":70,"justification":"Decent REST API design"},{"skill":"Databases","score":68,"justification":"Basic PostgreSQL knowledge"}]'::jsonb,
   '["Good Python coding skills","Clean code style","Eager to learn"]'::jsonb,
   '["Limited distributed systems knowledge","Needs more database optimization experience"]'::jsonb,
   'low', 'advance',
   '[]'::jsonb, NOW()-INTERVAL '17 days'),
  (ai_int_04, app_16, jp_fe_ds, 'technical', 30, 30, 'completed', NOW()-INTERVAL '12 days', NOW()-INTERVAL '12 days', 80,
   '[{"skill":"ML","score":85,"justification":"Strong ML fundamentals from research"},{"skill":"Python","score":82,"justification":"Good coding skills"},{"skill":"Statistics","score":78,"justification":"Solid statistical knowledge"}]'::jsonb,
   '["Strong academic ML background","Published research","Good statistical reasoning"]'::jsonb,
   '["Limited production deployment experience","Needs more engineering skills"]'::jsonb,
   'low', 'advance',
   '[]'::jsonb, NOW()-INTERVAL '12 days'),
  (ai_int_05, app_11, jp_tn_sfe, 'technical', 30, 29, 'completed', NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', 82,
   '[{"skill":"React","score":88,"justification":"Production React experience at Myntra"},{"skill":"Performance","score":80,"justification":"Good web vitals optimization knowledge"},{"skill":"CSS","score":78,"justification":"Strong CSS skills"}]'::jsonb,
   '["Production-grade React experience","Performance optimization expertise","Good team player"]'::jsonb,
   '["Limited TypeScript experience","Needs to learn Next.js"]'::jsonb,
   'low', 'strong_advance',
   '[]'::jsonb, NOW()-INTERVAL '24 days'),
  (ai_int_06, app_04, jp_cm_sre, 'technical', 30, 35, 'completed', NOW()-INTERVAL '17 days', NOW()-INTERVAL '17 days', 90,
   '[{"skill":"SRE","score":95,"justification":"Flipkart scale SRE experience"},{"skill":"Kubernetes","score":90,"justification":"Deep K8s expertise"},{"skill":"Incident Mgmt","score":88,"justification":"Led multiple P0 incidents"}]'::jsonb,
   '["Exceptional SRE skills","Scale experience from Flipkart","Strong leadership potential"]'::jsonb,
   '["May be overqualified for some tasks","Salary expectations might be high"]'::jsonb,
   'low', 'strong_advance',
   '[]'::jsonb, NOW()-INTERVAL '17 days'),
  (ai_int_07, app_03, jp_fe_ds, 'technical', 30, 27, 'completed', NOW()-INTERVAL '14 days', NOW()-INTERVAL '14 days', 76,
   '[{"skill":"Data Science","score":80,"justification":"Good analytical skills"},{"skill":"Python","score":75,"justification":"Decent Python for ML"},{"skill":"SQL","score":72,"justification":"Adequate SQL skills"}]'::jsonb,
   '["Good analytical thinking","Growing ML skills","Domain knowledge in analytics"]'::jsonb,
   '["Transitioning from analytics to ML","Needs deeper DL knowledge"]'::jsonb,
   'low', 'advance',
   '[]'::jsonb, NOW()-INTERVAL '14 days'),
  (ai_int_08, app_12, jp_tn_sfe, 'technical', 30, 25, 'completed', NOW()-INTERVAL '23 days', NOW()-INTERVAL '23 days', 60,
   '[{"skill":"React","score":65,"justification":"Basic React knowledge"},{"skill":"JavaScript","score":62,"justification":"Intermediate JS skills"},{"skill":"CSS","score":55,"justification":"Limited CSS skills"}]'::jsonb,
   '["Willing to learn","Basic React understanding"]'::jsonb,
   '["Limited product company experience","Weak CSS skills","No TypeScript experience"]'::jsonb,
   'medium', 'borderline',
   '[]'::jsonb, NOW()-INTERVAL '23 days');

-- === Assessments (3 templates) ===
INSERT INTO assessments (id, company_id, created_by, name, assessment_type, time_limit_minutes, difficulty, passing_score, questions, settings, is_template, created_at) VALUES
  (assess_react, c_technova, u_tn_admin, 'React Proficiency Test', 'mcq_quiz', 45, 'medium', 60,
   '[{"id":"q1","question":"What is the purpose of useCallback?","options":["Memoize functions","Memoize values","Create refs","Handle effects"],"correct_answers":[0],"explanation":"useCallback memoizes callback functions to prevent unnecessary re-renders.","points":5},{"id":"q2","question":"Which hook is used for side effects?","options":["useState","useEffect","useMemo","useRef"],"correct_answers":[1],"explanation":"useEffect handles side effects in functional components.","points":5}]'::jsonb,
   '{"auto_grade":true,"plagiarism_detection":false,"camera_proctoring":false,"allow_retakes":false,"randomize_order":true,"max_attempts":1}'::jsonb,
   true, NOW()-INTERVAL '40 days'),
  (assess_code, c_technova, u_tn_admin, 'Backend Coding Challenge', 'coding_test', 90, 'medium', 50,
   '[{"id":"p1","problem":"Implement a rate limiter using the token bucket algorithm.","language_options":["python","javascript","go"],"test_cases":[{"input":"10 requests in 1 second","expected_output":"7 allowed, 3 rejected"}],"points":40},{"id":"p2","problem":"Design and implement an LRU cache with O(1) operations.","language_options":["python","javascript"],"test_cases":[{"input":"capacity=2, put(1,1), put(2,2), get(1), put(3,3), get(2)","expected_output":"1, -1"}],"points":30}]'::jsonb,
   '{"auto_grade":true,"plagiarism_detection":true,"camera_proctoring":false,"allow_retakes":false,"randomize_order":false,"max_attempts":1}'::jsonb,
   true, NOW()-INTERVAL '35 days'),
  (assess_sys, c_cloudmat, u_cm_admin, 'System Design Case Study', 'case_study', 60, 'hard', 60,
   '[{"id":"cs1","scenario":"Design a distributed caching system that handles 1M requests/second with 99.9% cache hit rate.","questions":["What data structures would you use?","How would you handle cache invalidation?","How would you scale horizontally?"],"rubric":["Scalability","Fault tolerance","Performance"]}]'::jsonb,
   '{"auto_grade":false,"plagiarism_detection":false,"camera_proctoring":true,"allow_retakes":false,"randomize_order":false,"max_attempts":1}'::jsonb,
   true, NOW()-INTERVAL '30 days');

-- === Assessment Submissions (6) ===
INSERT INTO assessment_submissions (assessment_id, applicant_id, job_post_id, status, started_at, submitted_at, graded_at, time_taken_minutes, auto_score, final_score, plagiarism_flag, created_at) VALUES
  (assess_react, app_01, jp_tn_sfe, 'graded', NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', NOW()-INTERVAL '24 days', 35, 85, 85, false, NOW()-INTERVAL '24 days'),
  (assess_react, app_11, jp_tn_sfe, 'graded', NOW()-INTERVAL '22 days', NOW()-INTERVAL '22 days', NOW()-INTERVAL '22 days', 40, 72, 72, false, NOW()-INTERVAL '22 days'),
  (assess_react, app_12, jp_tn_sfe, 'graded', NOW()-INTERVAL '21 days', NOW()-INTERVAL '21 days', NOW()-INTERVAL '21 days', 44, 50, 50, true, NOW()-INTERVAL '21 days'),
  (assess_code, app_13, jp_tn_be, 'graded', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days', 78, 68, 68, false, NOW()-INTERVAL '15 days'),
  (assess_sys, app_04, jp_cm_sre, 'graded', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days', NOW()-INTERVAL '14 days', 55, NULL, 88, false, NOW()-INTERVAL '15 days'),
  (assess_sys, app_05, jp_cm_sre, 'submitted', NOW()-INTERVAL '14 days', NOW()-INTERVAL '14 days', NULL, 58, NULL, NULL, false, NOW()-INTERVAL '14 days');

-- === Human Interviews (5) ===
INSERT INTO human_interviews (applicant_id, job_post_id, interviewer_id, round_number, interview_type, scheduled_at, duration_minutes, status, feedback, rating, notes, created_at) VALUES
  (app_04, jp_cm_sre, u_cm_admin, 1, 'technical', NOW()+INTERVAL '2 days', 60, 'scheduled', NULL, NULL, NULL, NOW()-INTERVAL '5 days'),
  (app_11, jp_tn_sfe, u_tn_admin, 1, 'technical', NOW()+INTERVAL '3 days', 45, 'scheduled', NULL, NULL, NULL, NOW()-INTERVAL '3 days'),
  (app_19, jp_cm_pe, u_cm_admin, 1, 'culture_fit', NOW()+INTERVAL '1 day', 30, 'scheduled', NULL, NULL, NULL, NOW()-INTERVAL '2 days'),
  (app_18, jp_cm_sre, u_cm_rec, 1, 'phone_screen', NOW()-INTERVAL '10 days', 30, 'completed',
   '{"rating":"strong_hire","strengths":["Amazon SRE experience","Strong incident management","Good cultural fit"],"concerns":["Might find our scale small compared to Amazon"],"notes":"Excellent candidate. Recommend fast-tracking.","recommendation":"hire"}'::jsonb,
   'strong_hire', 'Top candidate from Amazon. Fast-track to offer.', NOW()-INTERVAL '12 days'),
  (app_10, jp_cm_jr, u_cm_rec, 1, 'phone_screen', NOW()-INTERVAL '32 days', 30, 'completed',
   '{"rating":"hire","strengths":["Good DSA skills","Eager to learn","Good communication"],"concerns":["No industry experience"],"notes":"Good fresher. Recommend hire for training program.","recommendation":"hire"}'::jsonb,
   'hire', 'Recommended for junior dev training program.', NOW()-INTERVAL '34 days');

-- === Candidate Notes (10) ===
INSERT INTO candidate_notes (applicant_id, author_id, body, mentions, created_at) VALUES
  (app_01, u_tn_rec, 'Strong frontend candidate. Excellent React skills and good portfolio. Recommend advancing to human interview.', '{}', NOW()-INTERVAL '24 days'),
  (app_01, u_tn_admin, 'Agreed. Lets schedule the technical round with @engineering lead.', ARRAY[u_tn_admin], NOW()-INTERVAL '23 days'),
  (app_04, u_cm_rec, 'Exceptional SRE from Flipkart. Scale experience is exactly what we need.', '{}', NOW()-INTERVAL '16 days'),
  (app_04, u_cm_admin, 'Fast-track this candidate. Schedule human interview ASAP.', '{}', NOW()-INTERVAL '15 days'),
  (app_11, u_tn_rec, 'Good Myntra experience but needs TypeScript training.', '{}', NOW()-INTERVAL '22 days'),
  (app_18, u_cm_rec, 'Amazon SRE. Very strong. Offer recommended at top of band.', '{}', NOW()-INTERVAL '9 days'),
  (app_03, u_fe_admin, 'Good data science skills. Assessment results pending.', '{}', NOW()-INTERVAL '13 days'),
  (app_09, u_tn_rec, 'PM background doesnt fit frontend role. Rejected.', '{}', NOW()-INTERVAL '25 days'),
  (app_10, u_cm_rec, 'Good fresher for junior program. Offered at entry level.', '{}', NOW()-INTERVAL '30 days'),
  (app_13, u_tn_admin, 'Referred candidate. Good Python skills, advancing to interview.', ARRAY[u_tn_rec], NOW()-INTERVAL '16 days');

-- === Candidate Votes (8) ===
INSERT INTO candidate_votes (applicant_id, voter_id, vote, created_at) VALUES
  (app_01, u_tn_admin, 'strong_hire', NOW()-INTERVAL '22 days'),
  (app_01, u_tn_rec,   'hire',        NOW()-INTERVAL '22 days'),
  (app_04, u_cm_admin, 'strong_hire', NOW()-INTERVAL '14 days'),
  (app_04, u_cm_rec,   'strong_hire', NOW()-INTERVAL '14 days'),
  (app_11, u_tn_admin, 'hire',        NOW()-INTERVAL '20 days'),
  (app_11, u_tn_rec,   'hire',        NOW()-INTERVAL '20 days'),
  (app_18, u_cm_admin, 'strong_hire', NOW()-INTERVAL '8 days'),
  (app_09, u_tn_rec,   'strong_no_hire', NOW()-INTERVAL '25 days');

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 3: Marketplace + Community Data
-- ══════════════════════════════════════════════════════════════════════════════

-- === FitVector Applications (5) ===
INSERT INTO fitvector_applications (id, applicant_user_id, job_post_id, applicant_id, match_score, screening_responses, interest_note, resume_name, status, status_timeline, created_at) VALUES
  (fva_01, u_priya, jp_tn_sfe, app_01, 88,
   '[{"questionId":"sq-01","question":"Describe a complex UI component you built.","type":"short_answer","answer":"I built a real-time collaborative editor using React and WebSockets with CRDT for conflict resolution.","aiSuggested":true},{"questionId":"sq-02","question":"Comfortable with hybrid work?","type":"yes_no","answer":"yes","aiSuggested":true}]'::jsonb,
   'Excited to lead frontend development at TechNova. Your AI-powered tools align with my passion for building performant interfaces.',
   'Tailored for TechNova — SFD', 'under_review',
   '[{"status":"applied","label":"Applied via FitVector","timestamp":"2026-03-22T14:30:00Z","note":"Application submitted with tailored resume"},{"status":"under_review","label":"Under Review","timestamp":"2026-03-23T09:15:00Z","note":"Recruiter viewed your profile"}]'::jsonb,
   NOW()-INTERVAL '5 days'),
  (fva_02, u_rahul, jp_tn_be, app_02, 72,
   '[{"questionId":"sq-03","question":"Experience with AI applications?","type":"short_answer","answer":"Integrated OpenAI APIs for document summarization and semantic search in production.","aiSuggested":true}]'::jsonb,
   'Interested in building the AI engine powering FitVector. Python and FastAPI are my core strengths.',
   'Tailored for Backend Roles', 'applied',
   '[{"status":"applied","label":"Applied via FitVector","timestamp":"2026-03-25T10:00:00Z","note":"Application submitted"}]'::jsonb,
   NOW()-INTERVAL '2 days'),
  (fva_03, u_sneha, jp_fe_ds, app_03, 82,
   '[{"questionId":"sq-04","question":"ML model you deployed to production?","type":"short_answer","answer":"Built a churn prediction model using XGBoost that reduced customer churn by 15% at Deloitte.","aiSuggested":true}]'::jsonb,
   'Passionate about applying ML to financial analytics. FinEdge''s mission aligns with my career goals.',
   'Master Resume', 'interview_invited',
   '[{"status":"applied","label":"Applied via FitVector","timestamp":"2026-03-18T11:00:00Z"},{"status":"under_review","label":"Under Review","timestamp":"2026-03-19T08:00:00Z"},{"status":"interview_invited","label":"Interview Invited","timestamp":"2026-03-22T14:00:00Z","note":"AI interview scheduled"}]'::jsonb,
   NOW()-INTERVAL '9 days'),
  (fva_04, u_arjun, jp_cm_sre, app_04, 91, '[]'::jsonb,
   'Excited about the SRE challenge at CloudMatrix. Built for scale at Flipkart, ready for the next chapter.',
   'Tailored for SRE Roles', 'offered',
   '[{"status":"applied","label":"Applied via FitVector","timestamp":"2026-03-07T09:00:00Z"},{"status":"under_review","label":"Under Review","timestamp":"2026-03-08T10:00:00Z"},{"status":"interview_invited","label":"Interview Invited","timestamp":"2026-03-10T14:00:00Z"},{"status":"interviewed","label":"Interviewed","timestamp":"2026-03-15T16:00:00Z"},{"status":"decision_pending","label":"Decision Pending","timestamp":"2026-03-20T09:00:00Z"},{"status":"offered","label":"Offered","timestamp":"2026-03-24T11:00:00Z","note":"Offer extended: SRE Engineer, ₹32L + RSUs"}]'::jsonb,
   NOW()-INTERVAL '20 days'),
  (fva_05, u_ananya, jp_fe_fs, app_06, 55, '[]'::jsonb,
   'Looking for my first full-time role. Eager to learn and grow at FinEdge.',
   'Master Resume', 'applied',
   '[{"status":"applied","label":"Applied via FitVector","timestamp":"2026-03-26T15:00:00Z","note":"Application submitted"}]'::jsonb,
   NOW()-INTERVAL '1 day');

-- === Promoted Listings (2) ===
INSERT INTO promoted_listings (job_post_id, company_id, promotion_type, duration_days, start_date, end_date, amount_paid, impressions, clicks, applications, status, created_at) VALUES
  (jp_tn_sfe, c_technova, 'sponsored_feed', 14, '2026-03-15', '2026-03-29', 2499, 3400, 89, 12, 'active', NOW()-INTERVAL '12 days'),
  (jp_tn_be,  c_technova, 'priority_search', 7, '2026-03-20', '2026-03-27', 999, 1200, 34, 5, 'active', NOW()-INTERVAL '7 days');

-- === Community Posts (15 interview experiences + 10 discussions) ===
-- Interview experiences
INSERT INTO community_posts (user_id, post_type, title, body, category, is_anonymous, upvotes, downvotes, comments_count, interview_data, created_at) VALUES
  (u_priya, 'interview_experience', 'Google Frontend Interview — Rejected after 4 rounds', 'Detailed experience of interviewing at Google for a frontend role in Bangalore.', 'tech', true, 87, 3, 4,
   '{"company_name":"Google","role":"Frontend Developer","difficulty":"hard","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["Event loop in JavaScript","Tell me about yourself"]},{"roundNumber":2,"type":"Technical","questions":["Implement debounce","Design virtual scrolling list"]},{"roundNumber":3,"type":"System Design","questions":["Design Google Docs collaborative editing frontend"]},{"roundNumber":4,"type":"Culture Fit","questions":["Disagreement with teammate","Why Google?"]}],"process_description":"Applied through referral. 4 rounds over 3 weeks.","tips":"Practice system design for frontend. LeetCode medium-hard is the baseline.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '12 days'),
  (u_rahul, 'interview_experience', 'Flipkart Backend — Got Offer!', 'Great experience interviewing at Flipkart for backend engineer role.', 'tech', false, 64, 2, 3,
   '{"company_name":"Flipkart","role":"Backend Engineer","difficulty":"medium","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Technical","questions":["Design rate limiter","SQL optimization"]},{"roundNumber":2,"type":"Technical","questions":["Implement LRU cache","Microservices discussion"]},{"roundNumber":3,"type":"HR","questions":["Salary expectations","Notice period"]}],"process_description":"Applied on careers page. HR reached out in 2 days. Offer within a week of final round.","tips":"Know system design fundamentals. They value practical experience.","overall_rating":5}'::jsonb,
   NOW()-INTERVAL '15 days'),
  (u_vikram, 'interview_experience', 'Razorpay Full Stack — Take-home was great', 'Best interview process I have experienced. Practical and fair.', 'tech', true, 112, 1, 5,
   '{"company_name":"Razorpay","role":"Full Stack Developer","difficulty":"medium","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["JavaScript closures"]},{"roundNumber":2,"type":"Take-home","questions":["Build a payment dashboard (48 hours)"]},{"roundNumber":3,"type":"Technical","questions":["Code review of take-home"]}],"process_description":"Referral from a friend. Take-home was well-designed.","tips":"Pay attention to code quality. They review Git history.","overall_rating":5}'::jsonb,
   NOW()-INTERVAL '18 days'),
  (u_sneha, 'interview_experience', 'Swiggy Product Design — Easy and Fun', 'Design-focused process at Swiggy. Cared about thinking, not just output.', 'design', false, 45, 0, 2,
   '{"company_name":"Swiggy","role":"Product Designer","difficulty":"easy","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["Portfolio walkthrough"]},{"roundNumber":2,"type":"Take-home","questions":["Redesign restaurant listing"]},{"roundNumber":3,"type":"Culture Fit","questions":["How do you handle feedback?"]}],"process_description":"Very design-focused. They care about process and thinking.","tips":"Prepare case studies with problem-solution-impact format.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '20 days'),
  (u_arjun, 'interview_experience', 'PhonePe Backend — Hard but Fair', 'Intense process. Very Java/JVM focused. High bar.', 'tech', true, 56, 4, 3,
   '{"company_name":"PhonePe","role":"Backend Engineer","difficulty":"hard","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Technical","questions":["Distributed transaction system","Java concurrency"]},{"roundNumber":2,"type":"System Design","questions":["Payment processing pipeline"]},{"roundNumber":3,"type":"Technical","questions":["Find median in stream","DB sharding"]},{"roundNumber":4,"type":"HR","questions":["Leadership style"]}],"process_description":"Very Java/JVM focused. Deep distributed systems knowledge expected.","tips":"Brush up on Java internals. Know CAP theorem cold.","overall_rating":3}'::jsonb,
   NOW()-INTERVAL '25 days'),
  (u_kavita, 'interview_experience', 'Zerodha Backend — Ghosted after 3 rounds', 'Great technical rounds but then silence. Very frustrating.', 'tech', true, 73, 5, 4,
   '{"company_name":"Zerodha","role":"Backend Engineer","difficulty":"medium","outcome":"ghosted","rounds":[{"roundNumber":1,"type":"Technical","questions":["Go concurrency","Real-time stock price feed"]},{"roundNumber":2,"type":"System Design","questions":["Order matching engine"]},{"roundNumber":3,"type":"Culture Fit","questions":["Open source contributions"]}],"process_description":"Great technical rounds then silence for 3 weeks.","tips":"Know Go. They love open-source contributors.","overall_rating":2}'::jsonb,
   NOW()-INTERVAL '30 days'),
  (u_aditya, 'interview_experience', 'CRED Frontend — High bar for UI craft', 'Very UI-focused. They care about animations and design sensibility.', 'tech', true, 95, 6, 3,
   '{"company_name":"CRED","role":"Frontend Developer","difficulty":"hard","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Technical","questions":["Build animated carousel from scratch"]},{"roundNumber":2,"type":"Technical","questions":["React performance optimization"]},{"roundNumber":3,"type":"System Design","questions":["Design system component library"]},{"roundNumber":4,"type":"Culture Fit","questions":["Design taste discussion"]}],"process_description":"Very UI-focused. Extremely high bar for frontend craft.","tips":"Master CSS animations. Know Framer Motion. Have design opinions.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '35 days'),
  (u_meera, 'interview_experience', 'Freshworks PM — SQL round surprised me', 'Standard PM interview but they expect technical depth.', 'tech', false, 29, 2, 2,
   '{"company_name":"Freshworks","role":"Product Manager","difficulty":"medium","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["Improve WhatsApp Status"]},{"roundNumber":2,"type":"Technical","questions":["SQL queries","Ticketing system design"]},{"roundNumber":3,"type":"Culture Fit","questions":["Stakeholder management"]}],"process_description":"Standard PM process. SQL round was unexpected.","tips":"Prepare CIRCLES framework. Know basic SQL.","overall_rating":3}'::jsonb,
   NOW()-INTERVAL '38 days'),
  (u_rohan, 'interview_experience', 'Meesho Data Engineer — Good process', 'They use Spark and Airflow heavily. Interviewers were helpful.', 'tech', true, 34, 1, 1,
   '{"company_name":"Meesho","role":"Data Engineer","difficulty":"medium","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Technical","questions":["Spark vs Flink","ETL pipeline design"]},{"roundNumber":2,"type":"Technical","questions":["SQL window functions","Data modeling"]},{"roundNumber":3,"type":"HR","questions":["Growth aspirations"]}],"process_description":"Good process for data roles. Interviewers gave hints when stuck.","tips":"Know Spark internals well. Practice SQL window functions.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '40 days'),
  (u_priya, 'interview_experience', 'TechNova Frontend — Fast and Startup-like', 'Quick 2-round process. They care about shipping ability.', 'tech', false, 38, 1, 2,
   '{"company_name":"TechNova Solutions","role":"Frontend Developer","difficulty":"easy","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["React hooks","CSS Grid"]},{"roundNumber":2,"type":"Technical","questions":["Build todo app with drag-drop"]}],"process_description":"Fast process — just 2 rounds over 3 days. Startup-friendly.","tips":"Show enthusiasm for building products. Know React well.","overall_rating":5}'::jsonb,
   NOW()-INTERVAL '42 days'),
  (u_arjun, 'interview_experience', 'Google Backend — Got Offer after 5 rounds!', 'Long but thorough process. LeetCode hard is the standard.', 'tech', false, 118, 4, 6,
   '{"company_name":"Google","role":"Backend Engineer","difficulty":"hard","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["Binary tree zigzag","TCP handshake"]},{"roundNumber":2,"type":"Technical","questions":["URL shortener","Graph algorithm"]},{"roundNumber":3,"type":"Technical","questions":["Thread-safe HashMap"]},{"roundNumber":4,"type":"System Design","questions":["YouTube video processing"]},{"roundNumber":5,"type":"Culture Fit","questions":["Impact in previous role"]}],"process_description":"5 rounds over 4 weeks plus 2 weeks for hiring committee.","tips":"LeetCode hard is standard. Practice on paper. Be specific about numbers.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '45 days'),
  (u_rahul, 'interview_experience', 'Zerodha Frontend — Minimalist like their products', 'Just 2 rounds. Take-home was practical and fun.', 'tech', true, 82, 1, 3,
   '{"company_name":"Zerodha","role":"Frontend Developer","difficulty":"easy","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Take-home","questions":["Build stock watchlist app"]},{"roundNumber":2,"type":"Technical","questions":["Code review","WebSocket implementation"]}],"process_description":"Minimalist process. Clean code and performance focused.","tips":"Focus on performance and bundle size. Show you can build without heavy deps.","overall_rating":5}'::jsonb,
   NOW()-INTERVAL '50 days'),
  (u_vikram, 'interview_experience', 'CRED Backend — Craftsmanship focus', 'High bar. They expect clean code and strong fundamentals.', 'tech', false, 41, 3, 2,
   '{"company_name":"CRED","role":"Backend Engineer","difficulty":"hard","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Technical","questions":["Credit score engine","Java functional programming"]},{"roundNumber":2,"type":"System Design","questions":["CRED reward system at scale"]},{"roundNumber":3,"type":"Technical","questions":["Concurrency problems","DB indexing"]},{"roundNumber":4,"type":"Culture Fit","questions":["Craftsmanship philosophy"]}],"process_description":"High bar. Craftsmanship is central.","tips":"Write clean code. Know design patterns. Show quality improvement examples.","overall_rating":3}'::jsonb,
   NOW()-INTERVAL '55 days'),
  (u_sneha, 'interview_experience', 'Flipkart Frontend — JavaScript deep dive', 'Clean process. They test JS fundamentals deeply.', 'tech', true, 51, 2, 2,
   '{"company_name":"Flipkart","role":"Frontend Developer","difficulty":"medium","outcome":"got_offer","rounds":[{"roundNumber":1,"type":"Technical","questions":["Promise.all from scratch","CSS specificity"]},{"roundNumber":2,"type":"Technical","questions":["Searchable dropdown","React reconciliation"]},{"roundNumber":3,"type":"HR","questions":["Team preferences"]}],"process_description":"Clean 3-round process. Deep JavaScript fundamentals.","tips":"Know JS inside out — prototypes, closures, event loop.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '58 days'),
  (u_meera, 'interview_experience', 'Google ML Engineer — Research-oriented', 'Very research-focused. Expect strong coding AND ML fundamentals.', 'tech', true, 67, 2, 3,
   '{"company_name":"Google","role":"ML Engineer","difficulty":"hard","outcome":"rejected","rounds":[{"roundNumber":1,"type":"Phone Screen","questions":["Transformer architecture","KNN from scratch"]},{"roundNumber":2,"type":"Technical","questions":["Recommendation system","ML debugging"]},{"roundNumber":3,"type":"Technical","questions":["Optimization problem","Hypothesis testing"]},{"roundNumber":4,"type":"System Design","questions":["Google Photos face recognition"]}],"process_description":"Very research-oriented. Both strong coding and ML fundamentals needed.","tips":"Know ML fundamentals deeply — math behind algorithms, not just libraries.","overall_rating":4}'::jsonb,
   NOW()-INTERVAL '60 days');

-- Discussion threads (10)
INSERT INTO community_posts (user_id, post_type, title, body, category, is_anonymous, upvotes, comments_count, created_at) VALUES
  (u_priya, 'discussion', 'Is a DSA-heavy interview process fair for frontend roles?', 'I keep getting asked graph algorithms for frontend positions at FAANG. How is that relevant to building UIs?', 'tech', true, 85, 4, NOW()-INTERVAL '7 days'),
  (u_kavita, 'discussion', 'Salary negotiation tips for startup offers', 'Got an offer with below-market base but 0.1% equity. How to evaluate?', 'salary', false, 62, 3, NOW()-INTERVAL '9 days'),
  (u_sneha, 'discussion', 'Remote work: how to set boundaries', 'Manager expects 9am-9pm availability. How do others handle this?', 'career_advice', true, 73, 3, NOW()-INTERVAL '15 days'),
  (u_vikram, 'discussion', 'TypeScript in 2026 — worth the investment?', 'Small team of 3. Is TypeScript upfront investment worth it?', 'tech', false, 56, 2, NOW()-INTERVAL '19 days'),
  (u_arjun, 'discussion', 'How to transition from developer to PM', 'Senior dev with 6 years. Best path to product management?', 'career_advice', true, 47, 1, NOW()-INTERVAL '22 days'),
  (u_rahul, 'discussion', 'Is 25L fair for 5 years full stack in Bangalore?', 'Currently at 18L. Got an offer for 25L. Should I negotiate higher?', 'salary', true, 68, 3, NOW()-INTERVAL '25 days'),
  (u_aditya, 'discussion', 'AI is not going to replace developers', 'Tired of the AI replacing devs narrative. AI augments, not replaces.', 'general', false, 71, 3, NOW()-INTERVAL '35 days'),
  (u_kavita, 'discussion', 'React Server Components in production', 'Has anyone shipped RSC? Performance improvements? Gotchas?', 'tech', true, 48, 2, NOW()-INTERVAL '40 days'),
  (u_meera, 'discussion', 'Imposter syndrome as a senior engineer', 'Just got promoted to Staff Engineer and I feel like a fraud.', 'career_advice', true, 82, 3, NOW()-INTERVAL '45 days'),
  (u_rohan, 'discussion', 'Work-life balance: Big Tech vs Startups', 'Honest comparison from someone who has worked at both.', 'general', true, 59, 2, NOW()-INTERVAL '50 days');

-- Salary report posts (5)
INSERT INTO community_posts (user_id, post_type, title, body, category, is_anonymous, upvotes, created_at) VALUES
  (u_priya,  'salary_report', 'Frontend Developer — 4 yrs — Bangalore', 'Sharing my salary progression over 4 years in Bangalore.', 'salary', true, 25, NOW()-INTERVAL '10 days'),
  (u_rahul,  'salary_report', 'Backend Engineer — 2 yrs — Mumbai', 'Current compensation breakdown as a backend dev in Mumbai.', 'salary', true, 18, NOW()-INTERVAL '15 days'),
  (u_vikram, 'salary_report', 'DevOps Engineer — 6 yrs — Remote', 'Remote DevOps salary data for the community.', 'salary', true, 32, NOW()-INTERVAL '20 days'),
  (u_sneha,  'salary_report', 'Data Scientist — 3 yrs — Delhi', 'DS compensation in Delhi NCR region.', 'salary', true, 22, NOW()-INTERVAL '25 days'),
  (u_arjun,  'salary_report', 'SRE Engineer — 5 yrs — Bangalore', 'SRE salary data in Bangalore market.', 'salary', true, 28, NOW()-INTERVAL '30 days');

-- === Salary Reports (50) ===
INSERT INTO salary_reports (user_id, role_title, company_name, location, experience_years, base_salary, total_compensation, is_verified, created_at) VALUES
  -- Frontend Developer
  (u_priya, 'Frontend Developer', NULL, 'Bangalore', 1, 600000, 650000, false, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', 'Flipkart', 'Bangalore', 2, 900000, 1000000, false, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', NULL, 'Bangalore', 3, 1400000, 1600000, false, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', 'Swiggy', 'Bangalore', 4, 1800000, 2100000, true, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', NULL, 'Bangalore', 5, 2200000, 2600000, false, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', 'Google', 'Bangalore', 7, 3000000, 3800000, false, NOW()-INTERVAL '30 days'),
  (u_priya, 'Frontend Developer', NULL, 'Mumbai', 2, 800000, 900000, false, NOW()-INTERVAL '28 days'),
  (u_priya, 'Frontend Developer', NULL, 'Mumbai', 4, 1600000, 1900000, false, NOW()-INTERVAL '28 days'),
  (u_priya, 'Frontend Developer', NULL, 'Remote', 3, 1200000, 1400000, false, NOW()-INTERVAL '26 days'),
  (u_priya, 'Frontend Developer', NULL, 'Remote', 5, 2500000, 3000000, false, NOW()-INTERVAL '26 days'),
  -- Backend Engineer
  (u_rahul, 'Backend Engineer', 'Razorpay', 'Bangalore', 2, 1000000, 1100000, true, NOW()-INTERVAL '25 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Bangalore', 3, 1500000, 1800000, false, NOW()-INTERVAL '25 days'),
  (u_rahul, 'Backend Engineer', 'PhonePe', 'Bangalore', 5, 2400000, 3000000, false, NOW()-INTERVAL '25 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Bangalore', 7, 3200000, 4200000, false, NOW()-INTERVAL '25 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Mumbai', 2, 900000, 1000000, false, NOW()-INTERVAL '24 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Mumbai', 5, 2100000, 2600000, false, NOW()-INTERVAL '24 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Remote', 3, 1600000, 1900000, false, NOW()-INTERVAL '23 days'),
  (u_rahul, 'Backend Engineer', NULL, 'Remote', 6, 2800000, 3500000, false, NOW()-INTERVAL '23 days'),
  -- Data Scientist
  (u_sneha, 'Data Scientist', NULL, 'Bangalore', 2, 1100000, 1300000, false, NOW()-INTERVAL '22 days'),
  (u_sneha, 'Data Scientist', NULL, 'Bangalore', 4, 2000000, 2500000, false, NOW()-INTERVAL '22 days'),
  (u_sneha, 'Data Scientist', NULL, 'Delhi', 3, 1500000, 1800000, true, NOW()-INTERVAL '22 days'),
  (u_sneha, 'Data Scientist', NULL, 'Mumbai', 5, 2500000, 3200000, false, NOW()-INTERVAL '21 days'),
  (u_sneha, 'Data Scientist', NULL, 'Remote', 4, 2200000, 2800000, false, NOW()-INTERVAL '21 days'),
  -- DevOps Engineer
  (u_vikram, 'DevOps Engineer', NULL, 'Bangalore', 2, 1000000, 1100000, false, NOW()-INTERVAL '20 days'),
  (u_vikram, 'DevOps Engineer', NULL, 'Bangalore', 4, 1800000, 2200000, false, NOW()-INTERVAL '20 days'),
  (u_vikram, 'DevOps Engineer', NULL, 'Bangalore', 6, 2600000, 3200000, true, NOW()-INTERVAL '20 days'),
  (u_vikram, 'DevOps Engineer', NULL, 'Remote', 5, 2400000, 3000000, false, NOW()-INTERVAL '19 days'),
  (u_vikram, 'DevOps Engineer', NULL, 'Hyderabad', 3, 1200000, 1400000, false, NOW()-INTERVAL '19 days'),
  -- Product Manager
  (u_kavita, 'Product Manager', 'Flipkart', 'Bangalore', 4, 2000000, 2500000, true, NOW()-INTERVAL '18 days'),
  (u_kavita, 'Product Manager', NULL, 'Bangalore', 6, 2800000, 3600000, false, NOW()-INTERVAL '18 days'),
  (u_kavita, 'Product Manager', NULL, 'Mumbai', 3, 1500000, 1800000, false, NOW()-INTERVAL '17 days'),
  (u_kavita, 'Product Manager', NULL, 'Remote', 5, 2500000, 3200000, false, NOW()-INTERVAL '17 days'),
  -- ML Engineer
  (u_aditya, 'ML Engineer', NULL, 'Bangalore', 2, 1200000, 1400000, false, NOW()-INTERVAL '16 days'),
  (u_aditya, 'ML Engineer', NULL, 'Bangalore', 4, 2200000, 2800000, false, NOW()-INTERVAL '16 days'),
  (u_aditya, 'ML Engineer', 'Google', 'Bangalore', 6, 3200000, 4200000, false, NOW()-INTERVAL '16 days'),
  (u_aditya, 'ML Engineer', NULL, 'Remote', 5, 2800000, 3500000, false, NOW()-INTERVAL '15 days'),
  -- SRE Engineer
  (u_arjun, 'SRE Engineer', NULL, 'Bangalore', 3, 1500000, 1800000, false, NOW()-INTERVAL '14 days'),
  (u_arjun, 'SRE Engineer', 'Flipkart', 'Bangalore', 5, 2500000, 3200000, true, NOW()-INTERVAL '14 days'),
  (u_arjun, 'SRE Engineer', NULL, 'Bangalore', 7, 3200000, 4200000, false, NOW()-INTERVAL '14 days'),
  (u_arjun, 'SRE Engineer', NULL, 'Hyderabad', 4, 1800000, 2200000, false, NOW()-INTERVAL '13 days'),
  -- Full Stack Developer
  (u_ananya, 'Full Stack Developer', NULL, 'Bangalore', 2, 1000000, 1100000, false, NOW()-INTERVAL '12 days'),
  (u_ananya, 'Full Stack Developer', NULL, 'Bangalore', 4, 1800000, 2200000, false, NOW()-INTERVAL '12 days'),
  (u_ananya, 'Full Stack Developer', NULL, 'Pune', 3, 1300000, 1500000, false, NOW()-INTERVAL '11 days'),
  (u_ananya, 'Full Stack Developer', NULL, 'Remote', 5, 2400000, 3000000, false, NOW()-INTERVAL '11 days'),
  -- Tech Lead
  (u_vikram, 'Tech Lead', NULL, 'Bangalore', 8, 3800000, 5000000, false, NOW()-INTERVAL '10 days'),
  (u_vikram, 'Tech Lead', 'Flipkart', 'Bangalore', 10, 4500000, 6200000, false, NOW()-INTERVAL '10 days'),
  (u_vikram, 'Tech Lead', NULL, 'Mumbai', 9, 4000000, 5500000, false, NOW()-INTERVAL '9 days'),
  -- Engineering Manager
  (u_arjun, 'Engineering Manager', 'Razorpay', 'Bangalore', 10, 5000000, 7000000, false, NOW()-INTERVAL '8 days'),
  (u_arjun, 'Engineering Manager', NULL, 'Bangalore', 12, 6000000, 8500000, false, NOW()-INTERVAL '8 days'),
  (u_arjun, 'Engineering Manager', NULL, 'Remote', 11, 5500000, 7500000, false, NOW()-INTERVAL '7 days');

-- === User Reputation (5) ===
INSERT INTO user_reputation (user_id, karma_points, helpful_reviews_count, interview_experiences_count, community_posts_count, badges) VALUES
  (u_priya, 320, 12, 3, 8, '["top_contributor","interview_veteran"]'::jsonb),
  (u_arjun, 450, 18, 4, 12, '["top_contributor","interview_veteran","salary_reporter"]'::jsonb),
  (u_vikram, 280, 10, 3, 7, '["interview_veteran","helpful_reviewer"]'::jsonb),
  (u_sneha, 195, 8, 2, 5, '["helpful_reviewer"]'::jsonb),
  (u_rahul, 150, 6, 2, 4, '[]'::jsonb);

-- === Verified Profiles (3) ===
INSERT INTO verified_profiles (user_id, identity_verified, education_verified, employment_verified, skills_verified, verified_at, expires_at) VALUES
  (u_priya, true, true, true, true, NOW()-INTERVAL '30 days', NOW()+INTERVAL '335 days'),
  (u_arjun, false, true, true, false, NOW()-INTERVAL '20 days', NOW()+INTERVAL '345 days'),
  (u_vikram, true, false, false, false, NOW()-INTERVAL '10 days', NOW()+INTERVAL '355 days');

-- === Boost Credits (2) ===
INSERT INTO boost_credits (user_id, credits_remaining, credits_purchased, amount_paid) VALUES
  (u_priya, 3, 5, 449),
  (u_rahul, 0, 5, 449);

-- === Employer Usage ===
INSERT INTO employer_usage (company_id, action_type, month_year, count) VALUES
  (c_technova, 'resume_screen', '2026-03', 47),
  (c_technova, 'ai_interview', '2026-03', 12),
  (c_technova, 'job_post', '2026-03', 3),
  (c_finedge, 'resume_screen', '2026-03', 18),
  (c_finedge, 'ai_interview', '2026-03', 5),
  (c_cloudmat, 'resume_screen', '2026-03', 30),
  (c_cloudmat, 'ai_interview', '2026-03', 8),
  (c_cloudmat, 'assessment', '2026-03', 4);

END $$;
