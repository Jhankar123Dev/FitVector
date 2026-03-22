-- ============================================================================
-- Development seed data only — do not run in production
-- ============================================================================

-- Fixed UUIDs for deterministic seeding
-- Test user
INSERT INTO users (id, email, name, avatar_url, auth_provider, email_verified, user_type, plan_tier, user_status, onboarding_completed, last_login_at)
VALUES (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'testuser@fitvector.dev',
    'Arjun Mehta',
    NULL,
    'email',
    true,
    '{seeker}',
    'free',
    'active',
    true,
    NOW()
);

-- Test user profile
INSERT INTO user_profiles (id, user_id, current_role, current_company, current_status, experience_level, target_roles, target_locations, preferred_work_mode, preferred_job_types, skills, salary_currency)
VALUES (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Frontend Developer',
    'TechStartup Inc',
    'working',
    '3_7',
    '{"Senior Frontend Developer", "Full Stack Engineer", "React Developer"}',
    '{"Bangalore", "Remote", "Hyderabad"}',
    'hybrid',
    '{fulltime}',
    '{"JavaScript", "TypeScript", "React", "Next.js", "Node.js", "TailwindCSS", "PostgreSQL", "Git", "REST APIs", "GraphQL"}',
    'INR'
);

-- ============================================================================
-- Sample jobs (5 jobs from different sources)
-- ============================================================================

INSERT INTO jobs (id, external_id, source, sources, fingerprint, url, title, company_name, company_logo_url, company_url, location, city, state, country, work_mode, job_type, description, skills_required, skills_nice_to_have, experience_min, experience_max, education_required, salary_min, salary_max, salary_currency, salary_period, salary_source, company_size, company_industry, is_active, posted_at, is_easy_apply)
VALUES
(
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'LI-12345',
    'linkedin',
    '{linkedin}',
    md5('linkedin-google-senior-frontend-2026'),
    'https://linkedin.com/jobs/view/12345',
    'Senior Frontend Engineer',
    'Google',
    'https://logo.clearbit.com/google.com',
    'https://google.com',
    'Bangalore, Karnataka, India',
    'Bangalore',
    'Karnataka',
    'India',
    'hybrid',
    'fulltime',
    '## Senior Frontend Engineer at Google

We are looking for a Senior Frontend Engineer to join our Cloud Console team in Bangalore. You will work on building next-generation user interfaces for Google Cloud Platform.

### Responsibilities
- Design and implement scalable frontend architectures using React and TypeScript
- Collaborate with UX designers to translate wireframes into polished interfaces
- Mentor junior engineers and conduct code reviews
- Optimize web performance and accessibility

### Requirements
- 5+ years of experience with modern JavaScript frameworks
- Strong proficiency in React, TypeScript, and state management
- Experience with design systems and component libraries
- Excellent communication and collaboration skills',
    '{"React", "TypeScript", "JavaScript", "HTML", "CSS", "Design Systems"}',
    '{"GraphQL", "Web Components", "Accessibility", "Performance Optimization"}',
    5,
    10,
    'Bachelor''s in CS or equivalent',
    3000000,
    4500000,
    'INR',
    'yearly',
    'estimated',
    '10000+',
    'Technology',
    true,
    NOW() - INTERVAL '2 days',
    false
),
(
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
    'NK-67890',
    'naukri',
    '{naukri}',
    md5('naukri-flipkart-fullstack-2026'),
    'https://naukri.com/job/67890',
    'Full Stack Developer',
    'Flipkart',
    'https://logo.clearbit.com/flipkart.com',
    'https://flipkart.com',
    'Bangalore, Karnataka, India',
    'Bangalore',
    'Karnataka',
    'India',
    'onsite',
    'fulltime',
    '## Full Stack Developer at Flipkart

Join Flipkart''s product engineering team to build features used by millions of users daily.

### What you will do
- Build and maintain full-stack features for the Flipkart marketplace
- Work with microservices architecture using Node.js and Java
- Develop responsive UIs with React and Next.js
- Write unit and integration tests

### What we need
- 3-5 years of full-stack development experience
- Proficiency in React, Node.js, and relational databases
- Experience with CI/CD pipelines and cloud platforms
- Strong problem-solving skills',
    '{"React", "Node.js", "JavaScript", "PostgreSQL", "REST APIs"}',
    '{"Java", "Microservices", "AWS", "Docker", "Kubernetes"}',
    3,
    5,
    'Bachelor''s in CS or equivalent',
    2000000,
    3200000,
    'INR',
    'yearly',
    'direct',
    '10000+',
    'E-commerce',
    true,
    NOW() - INTERVAL '1 day',
    true
),
(
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
    'IND-11111',
    'indeed',
    '{indeed}',
    md5('indeed-razorpay-react-2026'),
    'https://indeed.com/viewjob?jk=11111',
    'React Developer',
    'Razorpay',
    'https://logo.clearbit.com/razorpay.com',
    'https://razorpay.com',
    'Bangalore, Karnataka, India',
    'Bangalore',
    'Karnataka',
    'India',
    'remote',
    'fulltime',
    '## React Developer at Razorpay

Razorpay is looking for a React Developer to help build the future of payments in India.

### Role
- Develop and maintain payment dashboard interfaces
- Build reusable component libraries with React and TypeScript
- Integrate with payment APIs and handle complex state management
- Ensure PCI-DSS compliance in frontend implementations

### Must have
- 2-4 years of React experience
- TypeScript proficiency
- Understanding of financial/payments domain is a plus
- Experience with testing frameworks (Jest, React Testing Library)',
    '{"React", "TypeScript", "JavaScript", "Jest", "CSS"}',
    '{"Payments", "PCI-DSS", "Storybook", "Redux"}',
    2,
    4,
    NULL,
    1800000,
    2800000,
    'INR',
    'yearly',
    'direct',
    '1001-5000',
    'Fintech',
    true,
    NOW() - INTERVAL '3 days',
    true
),
(
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102',
    'GD-22222',
    'glassdoor',
    '{glassdoor, linkedin}',
    md5('glassdoor-atlassian-frontend-2026'),
    'https://glassdoor.com/job/22222',
    'Frontend Engineer - Jira',
    'Atlassian',
    'https://logo.clearbit.com/atlassian.com',
    'https://atlassian.com',
    'Bangalore, Karnataka, India',
    'Bangalore',
    'Karnataka',
    'India',
    'remote',
    'fulltime',
    '## Frontend Engineer - Jira at Atlassian

Help us reimagine how teams plan and track their work. Join the Jira team as a Frontend Engineer.

### What you will do
- Build features for Jira''s next-generation web experience
- Work closely with product managers and designers
- Contribute to Atlassian''s design system
- Write clean, well-tested code

### What we need
- 3+ years of frontend development experience
- Strong React and JavaScript skills
- Experience with state management patterns
- Passion for developer tooling and productivity',
    '{"React", "JavaScript", "TypeScript", "State Management", "CSS-in-JS"}',
    '{"Atlassian Design System", "Performance", "Accessibility"}',
    3,
    7,
    'Bachelor''s in CS or equivalent',
    2500000,
    4000000,
    'INR',
    'yearly',
    'estimated',
    '5001-10000',
    'Technology',
    true,
    NOW() - INTERVAL '5 days',
    false
),
(
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910213',
    'ZR-33333',
    'ziprecruiter',
    '{ziprecruiter}',
    md5('ziprecruiter-swiggy-nextjs-2026'),
    'https://ziprecruiter.com/job/33333',
    'Next.js Developer',
    'Swiggy',
    'https://logo.clearbit.com/swiggy.com',
    'https://swiggy.com',
    'Hyderabad, Telangana, India',
    'Hyderabad',
    'Telangana',
    'India',
    'hybrid',
    'fulltime',
    '## Next.js Developer at Swiggy

Swiggy is hiring a Next.js Developer to work on our consumer-facing web application.

### Responsibilities
- Build and maintain Swiggy''s web ordering experience using Next.js
- Optimize for Core Web Vitals and page load performance
- Implement server-side rendering and incremental static regeneration
- Collaborate with the mobile team for feature parity

### Requirements
- 2-5 years of experience with React and Next.js
- Understanding of SSR, SSG, and ISR patterns
- Experience with RESTful APIs and state management
- Good understanding of web performance optimization',
    '{"Next.js", "React", "TypeScript", "SSR", "Performance"}',
    '{"Node.js", "Redis", "CDN", "Web Vitals"}',
    2,
    5,
    NULL,
    1600000,
    2600000,
    'INR',
    'yearly',
    'direct',
    '5001-10000',
    'Food Delivery',
    true,
    NOW() - INTERVAL '4 days',
    true
);

-- ============================================================================
-- Sample job matches (2 matches for the test user)
-- ============================================================================

INSERT INTO job_matches (id, user_id, job_id, match_score, match_bucket, similarity_raw, is_seen, is_saved, is_dismissed)
VALUES
(
    'b8c9d0e1-f2a3-4b4c-5d6e-7f8091021324',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
    85,
    'strong_fit',
    0.87,
    false,
    false,
    false
),
(
    'c9d0e1f2-a3b4-4c5d-6e7f-809102132435',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
    72,
    'good_fit',
    0.74,
    true,
    true,
    false
);
