/**
 * FitVector Pro — Mega Seed Script
 *
 * Usage:
 *   pnpm seed          — wipe seed data, then seed fresh
 *   pnpm seed:wipe     — wipe only
 *
 * Requires .env.local in apps/web/ with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// ─── Env ─────────────────────────────────────────────────────────────────────

const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Admin client — bypasses ALL RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  SEED_DOMAIN: "@seed.fitvector.dev",
  PASSWORD: "jhankar123",
  EMPLOYERS: 25,
  SEEKERS: 200,
  JOBS_DIRECT: 300,
  JOBS_SCRAPED: 700,
  APPLICATIONS: 2000,
  OVERFLOW_APPLICATIONS: 50,   // for edgecase_overflow user
  JOB_POSTS_PER_EMPLOYER: 4,   // employer-side job posts
  HEAVY_EMPLOYER_POSTS: 50,    // employer_heavy special account
  APPLICANTS_PER_POST: 8,      // employer-side applicants
  NOTIFICATIONS: 500,
  SALARY_REPORTS: 200,
  COMMUNITY_POSTS: 100,
  BATCH: 100,
};

const WIPE_ONLY = process.argv.includes("--wipe");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function weightedPick(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return key;
  }
  return Object.keys(weights)[0];
}

async function batch(table: string, rows: object[]): Promise<void> {
  for (let i = 0; i < rows.length; i += CONFIG.BATCH) {
    const chunk = rows.slice(i, i + CONFIG.BATCH);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      console.error(`  ❌  ${table} batch ${Math.floor(i / CONFIG.BATCH) + 1}: ${error.message}`);
      throw error;
    }
  }
}

async function tryBatch(table: string, rows: object[]): Promise<boolean> {
  try {
    await batch(table, rows);
    return true;
  } catch {
    console.warn(`  ⚠️   Skipped ${table} — check enum constraints if needed.`);
    return false;
  }
}

// ─── Realistic Text Pools ─────────────────────────────────────────────────────

const JD: Record<string, string[]> = {
  frontend: [
    "We are building the next generation of our customer-facing web platform and need a senior Frontend Engineer who lives and breathes React. You will own the component library, enforce accessibility standards (WCAG 2.1 AA), and work closely with our design team. Our stack is React 18, TypeScript, Next.js 14 (App Router), and Tailwind CSS. You will improve our Lighthouse score from 72 to 95+ and reduce bundle size by 40% through code-splitting. Experience with React Query, Zod, and design systems (Radix UI / Shadcn) is essential. We ship 3-5 features per sprint and you will write unit tests with Vitest and integration tests with Playwright.",
    "Our fintech startup is looking for a React Developer to build the core trading dashboard — real-time data visualisation with Recharts, WebSocket integration for live price feeds, and a drag-and-drop portfolio builder. The tech stack is Next.js, TypeScript, TailwindCSS, and Zustand for state management. You must understand financial data formats and be comfortable with microsecond-level timestamp parsing. Prior experience with TradingView charting libraries or D3.js is a big plus.",
    "Join our e-commerce team as a Frontend Engineer and help us scale our product catalogue to 10 million SKUs. You will work on our search and filter UX (Algolia integration), the checkout flow (Razorpay/Stripe), and our new AR try-on feature (Three.js/WebGL). We use a micro-frontend architecture with Module Federation. Strong understanding of Core Web Vitals and browser rendering performance is mandatory.",
    "We are hiring a UI Engineer for our B2B SaaS dashboard. The product is a complex data-heavy interface with multi-level drill-down tables (TanStack Table), chart-based analytics (ECharts), and a node-based workflow builder (React Flow). You will collaborate with UX to translate Figma designs into React components and maintain our internal Storybook component library. TypeScript strict mode is non-negotiable.",
    "Looking for a Next.js Developer to lead the frontend of our HR-tech platform. Responsibilities include building multi-step form wizards (React Hook Form + Zod), a PDF resume renderer, and a real-time notification system (Supabase Realtime). SSR/SSG knowledge is critical — our SEO score directly drives our B2C acquisition funnel. Experience with Next.js App Router and Server Components is required.",
  ],
  backend: [
    "We are looking for a Python Backend Engineer to join our AI-first startup. You will build and maintain FastAPI microservices that power our ML inference pipeline handling 50,000 requests/day. Key responsibilities: designing PostgreSQL schemas with pgvector for semantic search, writing async Python code (asyncio, httpx), and integrating with Google Gemini and OpenAI APIs. Strong Docker experience and comfort deploying to GCP Cloud Run is required.",
    "Senior Node.js Engineer needed to own our API gateway layer. You will migrate our monolith to microservices, implement GraphQL subscriptions for real-time features, and design our Redis caching strategy. Stack: Node.js 20, TypeScript, Prisma ORM, PostgreSQL, Redis. Experience with message queues (RabbitMQ or Kafka) and event-driven architecture is required.",
    "Backend Engineer (Java/Spring Boot) for our enterprise fintech platform. Design RESTful APIs consumed by 200+ enterprise clients, implement OAuth 2.0 / OIDC flows, and build an audit trail system compliant with RBI guidelines. Knowledge of Spring Security, JPA/Hibernate, and multi-tenant database architecture is essential. Payment gateway integrations (Razorpay, NPCI) are a strong plus.",
    "We need a Go Engineer to build high-performance data ingestion pipelines processing 1M events/day. Own our Kafka consumers, build gRPC services, and design our time-series schema on TimescaleDB. The ideal candidate has built distributed systems, understands CAP theorem trade-offs, and has experience with OpenTelemetry, Grafana, and Prometheus.",
    "Backend Engineer for our logistics platform. Build and optimise REST APIs in Django REST Framework, design geospatial queries on PostGIS, and implement our driver-matching algorithm. Work with Celery for async task processing and Redis Pub/Sub for real-time location updates. Strong SQL skills are mandatory — our most complex query joins 7 tables.",
  ],
  data: [
    "We are hiring a Senior Data Scientist to build our recommendation engine for a 50M-user content platform. You will develop collaborative filtering models, A/B test ranking algorithms, and productionise models using FastAPI + Docker. Required: Python, Pandas, NumPy, Scikit-learn, and PyTorch. Experience with large-scale data processing on Databricks and Spark is essential. Models must serve at sub-100ms latency.",
    "Data Analyst for our growth team at a Series B SaaS company. Own our funnel analytics (SQL + Mixpanel), build automated dashboards in Tableau, and run cohort analyses to improve 90-day retention from 40% to 60%. Strong SQL skills are mandatory — you will write complex CTEs and window functions daily. Python knowledge for ad-hoc analysis is preferred.",
    "ML Engineer to join our NLP team. Fine-tune transformer models (BERT, RoBERTa) on our proprietary dataset, build evaluation pipelines, and deploy models to AWS SageMaker. Experience with HuggingFace Transformers, tokenisation strategies, and RLHF is required. Knowledge of vector databases (Pinecone, pgvector) and RAG pipelines is a major plus.",
    "Business Intelligence Engineer for our e-commerce analytics platform. Own the data warehouse on Snowflake, design dbt models, and build self-serve analytics using Metabase. Work with marketing, product, and finance to define KPIs and build reliable reporting pipelines. Strong understanding of dimensional modelling (Kimball methodology) is required.",
    "Data Engineer at our healthtech startup. Build real-time data pipelines on Apache Kafka and Spark Streaming, design our data lake on S3 with Delta Lake, and ensure HIPAA-compliant data handling. Experience with Apache Airflow for orchestration and dbt for transformation is required. Exposure to healthcare data standards (HL7, FHIR) is a strong plus.",
  ],
  devops: [
    "Senior DevOps/SRE Engineer for a high-traffic fintech application (500K DAU). Own our Kubernetes cluster on GKE (100+ pods), design our CI/CD pipeline using GitHub Actions, and implement SLOs/SLIs targeting 99.99% uptime. Required: Terraform for IaC, Prometheus + Grafana for observability, and strong incident management experience. Helm chart expertise is a must.",
    "Cloud Engineer to migrate our on-premise infrastructure to AWS. Design a multi-region, highly-available architecture using ECS Fargate, RDS Aurora, and CloudFront. Build our disaster recovery plan (RTO < 1hr, RPO < 15min), implement AWS WAF, and reduce cloud spend by 30% through right-sizing and spot instances.",
    "Platform Engineer to build our internal developer platform. Create golden-path templates in Backstage, standardise Docker-based local dev environments, and implement policy-as-code with OPA (Open Policy Agent). Strong scripting skills (Bash, Python) and expertise in Kubernetes (CRDs, operators) are required.",
    "DevOps Engineer for our startup's first full-time infrastructure hire. Set up our entire CI/CD from scratch on GitHub Actions, containerise Node.js and Python applications, and deploy to AWS ECS. Experience with Terraform, AWS RDS PostgreSQL, S3, and CloudWatch is required. Comfortable being the sole infra decision-maker.",
    "Infrastructure Automation Engineer. Build Ansible playbooks for configuration management, design our secrets management strategy (HashiCorp Vault), and implement GitOps workflows with ArgoCD. Experience with Linux systems administration, VPC networking, and container security scanning (Trivy, Snyk) is required.",
  ],
  mobile: [
    "React Native Developer for our consumer fintech app (2M+ downloads). Own the investment portfolio screen, implement biometric authentication (Face ID / Fingerprint), and integrate UPI payment flows. Experience with React Native 0.73+, Reanimated 3, and Expo is required. Knowledge of native modules in Swift and Kotlin is a strong plus.",
    "Flutter Developer to build our telemedicine app from scratch. Architect using BLoC state management, implement WebRTC-based video consultations, and integrate with our Firebase backend. Strong Dart skills are mandatory. Experience with Flutter flavours for multi-environment builds and app store submission is required.",
    "Senior iOS Developer for our B2B enterprise mobile app. Build features in SwiftUI, implement background sync using Background App Refresh, and integrate MDM (Mobile Device Management) support for enterprise clients. Strong understanding of iOS lifecycle, CoreData, and URLSession is required. TestFlight and enterprise distribution experience needed.",
    "Android Developer for our B2C super app. Build new features in Jetpack Compose, integrate payment SDKs (Razorpay, Paytm), and implement background location tracking for our delivery feature. Strong knowledge of Coroutines, Flow, and Android architecture components (ViewModel, Room) is required.",
    "Cross-platform Mobile Engineer to build our on-demand services app using React Native. Implement real-time location tracking with Google Maps SDK, push notification handling, and offline-first data sync. Experience with React Native Maps, Firebase Cloud Messaging, and WatermelonDB is required.",
  ],
  finance: [
    "Financial Analyst for our Series C startup's FP&A team. Build the three-statement financial model, own the monthly MIS reporting to the board, and run variance analysis on actuals vs budget. Advanced Excel skills (INDEX-MATCH, SUMPRODUCT, dynamic arrays) and experience with SAP data extraction are mandatory. Experience building investor-ready pitch deck financials is a strong plus.",
    "Senior Accountant for our manufacturing company. Responsibilities include monthly closing (P&L, Balance Sheet, Cash Flow), GST reconciliation, TDS calculation, and liaising with our Big 4 auditors for the statutory audit. SAP FICO module experience is required. Knowledge of Ind AS and IFRS is preferred.",
    "Business Analyst for our BFSI client-facing team. Bridge the gap between business stakeholders and technology teams, write detailed BRDs and SRS documents, and model complex banking workflows in Visio. Advanced Excel and SQL skills are required. Experience in core banking systems (Finacle, Temenos) or payment systems is a plus.",
    "Data Analyst (Finance) to own our revenue analytics. Build dashboards in Power BI showing MRR, ARR, churn, and LTV by cohort. Write complex SQL queries against our PostgreSQL data warehouse and automate the weekly finance report using Python (pandas + openpyxl). Experience with financial metrics in a SaaS context is required.",
    "Excel and Reporting Specialist for our consulting firm. Create automated Excel reports using VBA macros and Power Query, build Power BI dashboards for client presentations, and manage our Bloomberg Terminal data extraction workflows. Strong command of Excel advanced features (Power Pivot, DAX, Solver) is mandatory.",
  ],
  sales: [
    "Senior Account Executive for our enterprise SaaS platform. Own a $2M ARR quota, run full-cycle enterprise sales (6-18 month cycles), and manage CXO-level relationships at Fortune 500 companies. Required: 5+ years of B2B SaaS sales experience, MEDDIC/SPIN methodology, and Salesforce CRM proficiency. Experience selling to BFSI or IT verticals is preferred.",
    "Business Development Manager for our HR-tech startup. Generate and qualify leads through cold outreach (email sequences, LinkedIn Sales Navigator), run product demos, and close deals with HR Directors at mid-market companies. OKR: 8 new logos per quarter. Experience with HubSpot, Apollo.io, and consultative selling is required.",
    "Inside Sales Representative for our e-learning platform. Call 80+ prospects daily, qualify inbound leads from marketing, and hand off enterprise deals to the AE team. Proficiency in Zoho/HubSpot CRM, experience with objection handling, and strong communication skills are required.",
    "Key Account Manager for our logistics SaaS. Own 30 enterprise accounts with ₹15Cr combined ARR, run QBRs, identify upsell/cross-sell opportunities, and maintain NPS > 60. Experience managing complex stakeholder relationships, strong negotiation skills, and Salesforce proficiency are required.",
    "Sales Manager to build and lead a team of 10 SDRs. Define the outbound playbook, coach reps on cold calling and email sequencing, and report pipeline metrics to the VP Sales. Experience building SDR teams from scratch, Gong/Chorus call review, and data-driven coaching is required.",
  ],
};

const SUMMARY: Record<string, string[]> = {
  frontend: [
    "Frontend engineer with 4 years of experience building production React applications used by over 500,000 users. Specialised in performance optimisation — reduced LCP from 4.2s to 1.1s on a high-traffic e-commerce site. Built and maintained a 40-component Storybook library used across 3 product teams. Strong advocate for accessibility and semantic HTML.",
    "React and Next.js developer with expertise in TypeScript and modern state management (Redux Toolkit, Zustand, React Query). Delivered a real-time trading dashboard processing WebSocket data at 200 updates/second without UI jank. Experienced with design systems, having implemented Radix UI + Tailwind component libraries from scratch.",
    "UI Engineer with 2 years building complex B2B SaaS dashboards. Proficient in TanStack Table for large data grids, Recharts for analytics visualisation, and React Hook Form with Zod for form validation. Comfortable in TypeScript strict mode and contributes to open-source React component libraries.",
    "Full-stack leaning frontend developer with deep React expertise. Built the checkout flow for an Indian e-commerce startup, improving conversion from 3% to 8% through A/B testing and UX improvements. Experienced in SEO-critical SSR with Next.js, achieving Core Web Vitals 'Good' scores across all metrics.",
    "Senior frontend engineer with 6 years of experience, last 3 in Next.js App Router. Led the migration of a 200,000-line codebase from Create React App to Next.js 14, implementing incremental static regeneration and edge caching. Mentor to 3 junior developers and owns the frontend interview process.",
  ],
  backend: [
    "Python backend engineer with 5 years of experience, specialised in building async FastAPI services for ML-heavy products. Built the inference API serving 3 ML models in production at 100K requests/day with p99 latency under 80ms. Deep experience with PostgreSQL (query optimisation, pgvector, partitioning) and Docker/GCP deployment.",
    "Node.js engineer with expertise in TypeScript and microservices. Designed and built the API gateway handling 2M requests/day with circuit breaker patterns and rate limiting. Strong background in PostgreSQL with Prisma ORM, Redis caching strategies, and event-driven architecture using RabbitMQ.",
    "Java developer with 7 years of enterprise experience. Built payment processing APIs at a fintech processing ₹500Cr monthly. Expert in Spring Boot, Spring Security (OAuth 2.0/JWT), and Hibernate. Led the migration from a monolith to microservices, reducing deployment time from 2 hours to 8 minutes.",
    "Backend engineer with a focus on high-performance data systems. Designed Kafka-based ingestion pipelines processing 5M events/day with under 200ms end-to-end latency. Built REST and gRPC APIs in Go, with expertise in TimescaleDB for time-series data and strong distributed systems fundamentals.",
    "Full-stack engineer with backend specialisation in Django and PostgreSQL. Built the core API for a logistics platform managing 10,000+ daily deliveries. Expertise in geospatial queries (PostGIS), Celery task queues, and Redis caching. 4 years of experience delivering features end-to-end independently.",
  ],
  data: [
    "Data scientist with 4 years of experience in recommendation systems and NLP. Built a collaborative filtering model that increased content CTR by 35% for a 20M-user platform. Proficient in Python (Pandas, NumPy, Scikit-learn, PyTorch), SQL, and Databricks. Experience deploying ML models to production via FastAPI with A/B testing infrastructure.",
    "Analytics engineer with 3 years of experience in SaaS growth analytics. Expert in SQL (CTEs, window functions, query optimisation), Python for data wrangling, and Tableau for executive dashboards. Reduced customer churn by 15% by identifying leading indicators through cohort analysis and survival modelling.",
    "ML Engineer specialising in NLP and large language models. Fine-tuned BERT and GPT-2 models on proprietary datasets, improving classification accuracy from 71% to 89%. Strong experience with HuggingFace Transformers, vector databases (Pinecone, pgvector), and building RAG pipelines for enterprise search applications.",
    "Business Intelligence engineer with 5 years building data warehouses on Snowflake and BigQuery. Expert in dbt for data transformation, dimensional modelling (Kimball), and self-serve analytics using Metabase and Looker. Reduced report generation time from 4 hours to 15 minutes by redesigning the aggregation layer.",
    "Data engineer with expertise in real-time streaming pipelines. Built Apache Kafka + Spark Streaming infrastructure processing 1M healthcare events/day with HIPAA compliance. Strong in Apache Airflow for orchestration, dbt for transformation, and Delta Lake for reliable data lake management on AWS.",
  ],
  devops: [
    "SRE with 6 years of experience maintaining 99.99% uptime for high-traffic fintech applications. Owns a 150-pod Kubernetes cluster on GKE, managing deployments for 20+ services. Built the observability stack from scratch: Prometheus metrics, Loki logs, Grafana dashboards. Reduced MTTR from 45 minutes to 8 minutes through improved alerting.",
    "Cloud engineer who led the AWS migration of 12 on-premise services for a mid-size logistics company. Reduced infrastructure costs by 42% through Reserved Instances and right-sizing. Proficient in Terraform, ECS Fargate, RDS Aurora, and AWS WAF. Holds AWS Solutions Architect Professional certification.",
    "Platform engineer focused on developer experience. Built the company's internal developer portal on Backstage with 50+ software templates. Standardised CI/CD across 30 repositories using GitHub Actions, reducing new engineer onboarding from 3 days to 4 hours.",
    "DevOps engineer with full-stack infrastructure experience. Set up AWS infrastructure from scratch for 2 startups: ECS, RDS PostgreSQL, S3, CloudFront, and GitHub Actions pipelines. Expert in Docker multi-stage builds, Terraform modules, and CloudWatch alerting. Comfortable as sole infra owner in a fast-paced environment.",
    "Infrastructure automation engineer with expertise in GitOps and policy-as-code. Implemented ArgoCD for GitOps deployments across 3 Kubernetes clusters, HashiCorp Vault for secrets management, and OPA for policy enforcement. Reduced security vulnerabilities by 60% by introducing Trivy scanning into the CI pipeline.",
  ],
  mobile: [
    "React Native developer with 3 years building consumer fintech apps. Shipped 6 major app releases with zero P0 crashes in production. Expert in Reanimated 3 for smooth 60fps animations, biometric authentication, and UPI payment flows. Comfortable writing native modules in Swift and Kotlin when JavaScript bridges aren't sufficient.",
    "Flutter developer with full-cycle experience from architecture to App Store submission. Built a telemedicine app with WebRTC video consultations serving 50,000 monthly active users. Expert in BLoC state management, Firebase integration, and Flutter flavours for multi-environment configuration.",
    "iOS developer with 5 years in SwiftUI and UIKit. Built features for an enterprise B2B app with 10,000+ corporate users. Expert in CoreData, URLSession, and Background App Refresh. Led the migration from UIKit to SwiftUI, reducing screen development time by 40%.",
    "Android developer with 4 years of experience in Kotlin and Jetpack Compose. Built features for a logistics app processing 5,000 deliveries/day. Expert in Kotlin Coroutines, Room database, and WorkManager for background tasks. Experience integrating Google Maps SDK and real-time location tracking.",
    "Cross-platform mobile engineer with React Native expertise. Delivered 3 consumer apps from 0 to 100K+ downloads each. Strong in React Native performance optimisation, Hermes engine configuration, and bridging native modules. Experience with over-the-air updates using Expo Updates and EAS Build.",
  ],
  finance: [
    "Financial analyst with 4 years in FP&A at a Series B startup. Built the 3-statement model and rolling forecast used by the board for a ₹200Cr fundraising round. Expert in Excel (VBA macros, Power Query, INDEX-MATCH), SAP data extraction, and Tableau dashboard creation. Strong business partnering skills with cross-functional teams.",
    "Senior accountant with 6 years of experience in manufacturing and FMCG sectors. Expert in SAP FICO, GST reconciliation, TDS computation, and monthly closing. Led the transition from Tally to SAP, reducing month-end closing time from 10 days to 3 days. Knowledge of Ind AS and Big 4 audit coordination.",
    "Business analyst with BFSI domain expertise. Wrote BRDs and SRS documents for 12 banking products at a leading private sector bank. Proficient in SQL for data extraction, Visio for process mapping, and Excel for gap analysis. Experience with core banking (Finacle) and SWIFT payment message formats.",
    "Data analyst focused on SaaS financial metrics. Built MRR/ARR dashboards in Power BI tracking revenue across 5,000 subscribers with drill-down by plan tier, geography, and cohort. Expert in SQL and Python (pandas) for financial data wrangling. Reduced finance team's manual reporting effort by 8 hours/week.",
    "Excel specialist and reporting analyst with 5 years at a consulting firm. Built automated client reporting using VBA macros, Power Query, and Power Pivot — reducing report preparation from 3 days to 2 hours. Proficient in Bloomberg Terminal data extraction and Power BI dashboard creation for C-level presentations.",
  ],
  sales: [
    "Enterprise Account Executive with 6 years of B2B SaaS sales experience. Consistently achieved 120%+ quota — $2.4M closed last fiscal year. Expert in MEDDIC qualification, Salesforce CRM, and navigating complex multi-stakeholder deals in the BFSI vertical. Shortest enterprise cycle closed: 6 weeks. Managed a ₹8Cr 3-year contract renewal.",
    "Business development manager who built outbound pipeline from scratch at 2 HR-tech startups. Generated ₹3Cr in pipeline within first 6 months using LinkedIn Sales Navigator, Apollo.io, and personalised email sequences. Average demo-to-close rate: 22%. HubSpot power user with experience setting up automated lead nurture workflows.",
    "Inside sales rep with high-volume calling experience. Consistently hit 90+ calls/day while maintaining a 15% connect rate. Qualified and handed off 30 enterprise deals ($50K+ ACV) to AE team in 18 months. Proficient in Zoho CRM and experienced with objection handling for ed-tech and HR-tech products.",
    "Key account manager with portfolio management experience. Managed 25 enterprise accounts with ₹12Cr combined ARR, achieving 103% net revenue retention. Ran quarterly business reviews, identified ₹2Cr in upsell opportunities, and maintained NPS score of 67 across portfolio. Proficient in Salesforce and Gong.",
    "Sales manager with SDR team-building experience. Built and scaled a 12-person SDR team from 3 people over 18 months, defining the outbound playbook and ramping quota from $50K to $150K/month per rep. Strong in data-driven coaching using Gong/Chorus call recordings and weekly funnel metrics reviews.",
  ],
};

// ─── Skill Pools ──────────────────────────────────────────────────────────────

const SKILLS: Record<string, string[]> = {
  frontend:  ["React", "TypeScript", "Next.js", "Vue.js", "Angular", "Tailwind CSS", "HTML", "CSS", "JavaScript", "GraphQL", "Redux", "Webpack", "Vite", "Storybook", "React Query"],
  backend:   ["Node.js", "Python", "FastAPI", "Django", "Java", "Spring Boot", "Go", "REST APIs", "PostgreSQL", "Redis", "MongoDB", "Express.js", "gRPC", "Kafka", "RabbitMQ"],
  data:      ["Python", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Spark", "R", "Tableau", "Power BI", "Jupyter", "Scikit-learn", "Databricks", "dbt", "Airflow"],
  devops:    ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "Linux", "Ansible", "Prometheus", "Grafana", "Jenkins", "GitHub Actions", "ArgoCD", "Helm"],
  mobile:    ["React Native", "Flutter", "Swift", "Kotlin", "iOS Development", "Android Development", "Expo", "Firebase", "Xcode", "Jetpack Compose", "Reanimated"],
  finance:   ["Excel", "Power BI", "Tableau", "SAP", "SQL", "Python", "Financial Modelling", "VBA", "Bloomberg Terminal", "Tally", "QuickBooks", "Power Query", "DAX"],
  sales:     ["Salesforce", "CRM", "B2B Sales", "Excel", "PowerPoint", "Lead Generation", "HubSpot", "Cold Calling", "Account Management", "Negotiation", "Apollo.io", "MEDDIC"],
};

const ALL_SKILLS = Object.values(SKILLS).flat();
const DOMAINS = Object.keys(SKILLS) as Array<keyof typeof SKILLS>;

const JOB_TITLES: Record<string, string[]> = {
  frontend:  ["Frontend Developer", "React Developer", "UI Engineer", "Web Developer", "Frontend Engineer", "Next.js Developer", "UI/UX Developer"],
  backend:   ["Backend Engineer", "Python Developer", "Node.js Developer", "Java Developer", "API Engineer", "Software Engineer", "Platform Engineer"],
  data:      ["Data Scientist", "Data Analyst", "ML Engineer", "Data Engineer", "BI Analyst", "Analytics Engineer", "AI/ML Engineer", "Research Scientist"],
  devops:    ["DevOps Engineer", "Cloud Engineer", "SRE", "Platform Engineer", "Infrastructure Engineer", "AWS Solutions Architect", "Site Reliability Engineer"],
  mobile:    ["Mobile Developer", "iOS Developer", "Android Developer", "React Native Developer", "Flutter Developer", "Mobile Engineer"],
  finance:   ["Financial Analyst", "Accountant", "Finance Manager", "Business Analyst", "Excel Specialist", "FP&A Analyst", "BI Analyst", "Senior Accountant"],
  sales:     ["Sales Executive", "Account Manager", "Business Development Manager", "Sales Manager", "Inside Sales Representative", "Account Executive", "SDR Manager"],
};

const CITIES = [
  "Bangalore, India", "Mumbai, India", "Hyderabad, India", "Pune, India",
  "Chennai, India", "Delhi, India", "Kolkata, India", "Ahmedabad, India",
  "Noida, India", "Gurgaon, India", "Kochi, India", "Jaipur, India",
];

const SCRAPED_SOURCES = ["linkedin", "naukri", "indeed", "glassdoor", "google"] as const;
const WORK_MODES      = ["remote", "hybrid", "onsite"] as const;
const JOB_TYPES       = ["fulltime", "parttime", "contract"] as const;
const EXP_LEVELS      = ["fresher", "1_3", "3_7", "7_15"] as const;
const PLAN_TIERS      = ["free", "starter", "pro", "elite"] as const;
const COMPANY_TIERS   = ["starter", "growth", "business", "enterprise"] as const;
const COMPANY_SIZES   = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
const INDUSTRIES      = ["technology", "fintech", "healthcare", "education", "ecommerce", "saas", "consulting", "media", "logistics", "manufacturing"] as const;
const APP_STATUSES    = { applied: 0.40, screening: 0.27, interview: 0.20, offer: 0.03, rejected: 0.10 };
const PIPELINE_STAGES = ["applied", "ai_screened", "ai_interviewed", "assessment", "human_interview", "offer", "hired", "rejected", "on_hold"] as const;
const BUCKETS         = ["strong_fit", "good_fit", "potential_fit", "weak_fit"] as const;
const NOTIF_TYPES     = ["status_change", "interview_invite", "offer", "rejection", "general"] as const;

// ─── Wipe ─────────────────────────────────────────────────────────────────────

async function wipeTestData(): Promise<void> {
  console.log("🧹 Wiping existing seed data...");

  const { data: seedUsers } = await supabase
    .from("users")
    .select("id, role")
    .like("email", `%${CONFIG.SEED_DOMAIN}`);

  const allIds    = (seedUsers || []).map((u) => u.id);
  const seekerIds = (seedUsers || []).filter((u) => u.role === "seeker").map((u) => u.id);
  const empIds    = (seedUsers || []).filter((u) => u.role !== "seeker").map((u) => u.id);

  if (allIds.length === 0) {
    console.log("  ℹ️  No existing seed data found.");
    return;
  }

  if (seekerIds.length > 0) {
    await supabase.from("community_comments").delete().in("user_id", seekerIds);
    await supabase.from("community_posts").delete().in("user_id", seekerIds);
    await supabase.from("salary_reports").delete().in("user_id", seekerIds);
    await supabase.from("notification_log").delete().in("user_id", seekerIds);
    await supabase.from("applications").delete().in("user_id", seekerIds);
    await supabase.from("job_matches").delete().in("user_id", seekerIds);
    await supabase.from("usage_logs").delete().in("user_id", seekerIds);
    await supabase.from("user_profiles").delete().in("user_id", seekerIds);
  }
  if (empIds.length > 0) {
    await supabase.from("company_members").delete().in("user_id", empIds);
    const { data: cos } = await supabase.from("companies").select("id").in("created_by", empIds);
    const coIds = (cos || []).map((c) => c.id);
    if (coIds.length > 0) {
      const { data: posts } = await supabase.from("job_posts").select("id").in("company_id", coIds);
      const postIds = (posts || []).map((p) => p.id);
      if (postIds.length > 0) {
        await supabase.from("applicants").delete().in("job_post_id", postIds);
        await supabase.from("job_posts").delete().in("id", postIds);
      }
      await supabase.from("companies").delete().in("id", coIds);
    }
    await supabase.from("jobs").delete().in("posted_by_employer_id", empIds);
  }
  await supabase.from("jobs").delete().eq("source", "seed");
  await supabase.from("notification_log").delete().in("user_id", allIds);
  await supabase.from("users").delete().in("id", allIds);

  console.log(`  ✅ Wiped ${allIds.length} seed users and related data.`);
}

// ─── Super Admin ──────────────────────────────────────────────────────────────

async function seedSuperAdmin(): Promise<void> {
  const hash = await bcrypt.hash(CONFIG.PASSWORD, 10);
  await batch("users", [{
    id: faker.string.uuid(),
    email: `superadmin${CONFIG.SEED_DOMAIN}`,
    full_name: "FitVector Super Admin",
    password_hash: hash,
    role: "superadmin",
    status: "active",
    onboarding_completed: true,
    auth_provider: "credentials",
    plan_tier: "elite",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }]);
  console.log(`👑 Created 1 Super Admin          (superadmin${CONFIG.SEED_DOMAIN})`);
}

// ─── Employers + Companies ────────────────────────────────────────────────────

async function seedEmployers(): Promise<{ empIds: string[]; coIds: string[]; postIds: string[] }> {
  const hash = await bcrypt.hash(CONFIG.PASSWORD, 10);
  const now  = new Date().toISOString();

  // Normal employers
  const empRows = Array.from({ length: CONFIG.EMPLOYERS }, (_, i) => ({
    id: faker.string.uuid(),
    email: `employer_${i + 1}${CONFIG.SEED_DOMAIN}`,
    full_name: faker.person.fullName(),
    password_hash: hash,
    role: "employer",
    status: "active",
    onboarding_completed: true,
    auth_provider: "credentials",
    plan_tier: pick(PLAN_TIERS),
    email_verified: true,
    created_at: faker.date.past({ years: 1 }).toISOString(),
    updated_at: now,
  }));

  // Heavy employer edge case
  const heavyEmp = {
    id: faker.string.uuid(),
    email: `employer_heavy${CONFIG.SEED_DOMAIN}`,
    full_name: "Heavy Employer Edge Case",
    password_hash: hash,
    role: "employer",
    status: "active",
    onboarding_completed: true,
    auth_provider: "credentials",
    plan_tier: "elite",
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  await batch("users", [...empRows, heavyEmp]);

  const allEmps = [...empRows, heavyEmp];

  const coRows = allEmps.map((emp) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    website_url: faker.internet.url(),
    industry: pick(INDUSTRIES),
    company_size: pick(COMPANY_SIZES),
    description: `${faker.company.catchPhrase()}. ${faker.lorem.sentences(2)}`,
    culture_keywords: pickN(["innovation", "remote-first", "inclusive", "fast-paced", "startup", "data-driven", "collaborative", "growth"], 3),
    locations: [{ city: faker.location.city(), country: "India" }],
    created_by: emp.id,
    plan_tier: pick(COMPANY_TIERS),
    created_at: emp.created_at,
    updated_at: now,
  }));
  await batch("companies", coRows);

  await batch("company_members", allEmps.map((emp, i) => ({
    id: faker.string.uuid(),
    company_id: coRows[i].id,
    user_id: emp.id,
    role: "admin",
    status: "active",
    created_at: emp.created_at,
    updated_at: now,
  })));

  // Job posts (employer-side ATS)
  const postRows: object[] = [];
  // Normal employers: 4 posts each
  for (let i = 0; i < CONFIG.EMPLOYERS; i++) {
    const co = coRows[i];
    for (let j = 0; j < CONFIG.JOB_POSTS_PER_EMPLOYER; j++) {
      const domain = pick(DOMAINS);
      postRows.push({
        id: faker.string.uuid(),
        company_id: co.id,
        created_by: empRows[i].id,
        title: pick(JOB_TITLES[domain]),
        department: domain,
        location: pick(CITIES),
        is_remote: Math.random() > 0.5,
        work_mode: pick(WORK_MODES),
        job_type: pick(JOB_TYPES),
        experience_min: faker.number.int({ min: 0, max: 3 }),
        experience_max: faker.number.int({ min: 3, max: 10 }),
        salary_min: faker.number.int({ min: 400000, max: 1000000 }),
        salary_max: faker.number.int({ min: 1000000, max: 2500000 }),
        salary_currency: "INR",
        salary_visible: true,
        description: pick(JD[domain]),
        required_skills: pickN(SKILLS[domain], faker.number.int({ min: 3, max: 6 })),
        screening_questions: [],
        status: pick(["active", "active", "active", "paused", "closed"]),
        auto_advance_threshold: null,
        auto_reject_threshold: null,
        views_count: faker.number.int({ min: 0, max: 500 }),
        applications_count: faker.number.int({ min: 0, max: 80 }),
        created_at: faker.date.recent({ days: 60 }).toISOString(),
        updated_at: now,
      });
    }
  }
  // Heavy employer: 50 posts
  const heavyCo = coRows[coRows.length - 1];
  for (let j = 0; j < CONFIG.HEAVY_EMPLOYER_POSTS; j++) {
    const domain = pick(DOMAINS);
    postRows.push({
      id: faker.string.uuid(),
      company_id: heavyCo.id,
      created_by: heavyEmp.id,
      title: pick(JOB_TITLES[domain]),
      department: domain,
      location: pick(CITIES),
      is_remote: Math.random() > 0.5,
      work_mode: pick(WORK_MODES),
      job_type: pick(JOB_TYPES),
      experience_min: faker.number.int({ min: 0, max: 3 }),
      experience_max: faker.number.int({ min: 3, max: 10 }),
      salary_min: faker.number.int({ min: 400000, max: 1000000 }),
      salary_max: faker.number.int({ min: 1000000, max: 2500000 }),
      salary_currency: "INR",
      salary_visible: Math.random() > 0.3,
      description: pick(JD[domain]),
      required_skills: pickN(SKILLS[domain], faker.number.int({ min: 3, max: 6 })),
      screening_questions: [],
      status: "active",
      auto_advance_threshold: null,
      auto_reject_threshold: null,
      views_count: faker.number.int({ min: 100, max: 2000 }),
      applications_count: faker.number.int({ min: 10, max: 150 }),
      created_at: faker.date.recent({ days: 90 }).toISOString(),
      updated_at: now,
    });
  }

  await batch("job_posts", postRows);

  console.log(`🏢 Created ${allEmps.length} Employers + Companies + ${postRows.length} Job Posts`);
  return {
    empIds: allEmps.map((e) => e.id),
    coIds:  coRows.map((c) => c.id),
    postIds: (postRows as Array<{ id: string }>).map((p) => p.id),
  };
}

// ─── Edge Case Users ──────────────────────────────────────────────────────────

async function seedEdgeCaseUsers(): Promise<{ overflowId: string }> {
  const hash = await bcrypt.hash(CONFIG.PASSWORD, 10);
  const now  = new Date().toISOString();

  const edgeCases = [
    {
      id: faker.string.uuid(),
      email: `edgecase_no_skills${CONFIG.SEED_DOMAIN}`,
      full_name: "No Skills Edge Case",
      _skills: [] as string[],
      _onboarding: true,
    },
    {
      id: faker.string.uuid(),
      email: `edgecase_all_skills${CONFIG.SEED_DOMAIN}`,
      full_name: "All Skills Edge Case",
      _skills: ALL_SKILLS,
      _onboarding: true,
    },
    {
      id: faker.string.uuid(),
      email: `edgecase_overflow${CONFIG.SEED_DOMAIN}`,
      full_name: "Overflow Pipeline Edge Case",
      _skills: pickN(SKILLS.frontend, 6),
      _onboarding: true,
    },
    {
      id: faker.string.uuid(),
      email: `edgecase_newuser${CONFIG.SEED_DOMAIN}`,
      full_name: "New Unboarded User Edge Case",
      _skills: [] as string[],
      _onboarding: false,
    },
  ];

  await batch("users", edgeCases.map(({ _skills: _, _onboarding, ...u }) => ({
    ...u,
    password_hash: hash,
    role: "seeker",
    status: "active",
    onboarding_completed: _onboarding,
    auth_provider: "credentials",
    plan_tier: "free",
    email_verified: true,
    created_at: now,
    updated_at: now,
  })));

  await batch("user_profiles", edgeCases.filter((e) => e._onboarding).map((e) => ({
    user_id: e.id,
    current_role: "Software Engineer",
    current_company: "Edge Case Corp",
    experience_level: "3_7",
    target_roles: ["Software Engineer"],
    target_locations: ["Bangalore, India"],
    skills: e._skills,
    preferred_work_mode: "hybrid",
    preferred_job_types: ["fulltime"],
    preferred_industries: ["technology"],
    parsed_resume_json: {
      contact: { name: e.full_name, email: e.email },
      summary: e._skills.length === 0
        ? "New graduate with no listed technical skills yet."
        : `Experienced engineer with expertise across ${e._skills.length} skills.`,
      skills: e._skills,
      experience: [],
    },
    created_at: now,
    updated_at: now,
  })));

  const overflowId = edgeCases.find((e) => e.email.includes("overflow"))!.id;
  console.log(`🔬 Created 4 Edge Case Users`);
  return { overflowId };
}

// ─── Seekers ──────────────────────────────────────────────────────────────────

async function seedSeekers(): Promise<string[]> {
  const hash = await bcrypt.hash(CONFIG.PASSWORD, 10);
  const now  = new Date().toISOString();

  const seekerData = Array.from({ length: CONFIG.SEEKERS }, (_, i) => {
    const domain    = pick(DOMAINS);
    const secDomain = pick(DOMAINS.filter((d) => d !== domain));
    const primary   = pickN(SKILLS[domain], faker.number.int({ min: 5, max: 8 }));
    const secondary = pickN(SKILLS[secDomain], faker.number.int({ min: 2, max: 3 }));
    const skills    = [...new Set([...primary, ...secondary])];
    const expYears  = faker.number.int({ min: 0, max: 12 });

    return {
      user: {
        id: faker.string.uuid(),
        email: `seeker_${i + 1}${CONFIG.SEED_DOMAIN}`,
        full_name: faker.person.fullName(),
        password_hash: hash,
        role: "seeker",
        status: "active",
        onboarding_completed: true,
        auth_provider: "credentials",
        plan_tier: pick(PLAN_TIERS),
        email_verified: true,
        created_at: faker.date.past({ years: 2 }).toISOString(),
        updated_at: now,
      },
      profile: {
        current_role: pick(JOB_TITLES[domain]),
        current_company: faker.company.name(),
        experience_level: pick(EXP_LEVELS),
        target_roles: [pick(JOB_TITLES[domain]), pick(JOB_TITLES[domain])],
        target_locations: pickN(CITIES, faker.number.int({ min: 1, max: 3 })),
        skills,
        preferred_work_mode: pick(WORK_MODES),
        preferred_job_types: ["fulltime"],
        preferred_industries: pickN([...INDUSTRIES], 2),
        parsed_resume_json: {
          contact: { name: faker.person.fullName(), email: faker.internet.email() },
          summary: pick(SUMMARY[domain]),
          skills,
          experience: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
            role: pick(JOB_TITLES[domain]),
            company: faker.company.name(),
            start_date: `${faker.date.month()} ${2015 + faker.number.int({ min: 0, max: 8 })}`,
            end_date: Math.random() > 0.3 ? `${faker.date.month()} ${2022 + faker.number.int({ min: 0, max: 3 })}` : "Present",
            bullets: [faker.lorem.sentence(), faker.lorem.sentence()],
          })),
          education: [{
            institution: `${faker.company.name()} Institute of Technology`,
            degree: "Bachelor of Technology",
            field: domain === "data" ? "Computer Science" : domain === "finance" ? "Commerce" : "Engineering",
            year: String(2015 + faker.number.int({ min: 0, max: 8 })),
          }],
        },
      },
      domain,
      expYears,
    };
  });

  await batch("users", seekerData.map((s) => s.user));
  await batch("user_profiles", seekerData.map((s) => ({
    user_id: s.user.id,
    ...s.profile,
    created_at: s.user.created_at,
    updated_at: now,
  })));

  console.log(`👨‍💻 Generated ${CONFIG.SEEKERS} Job Seekers with realistic domain-aligned profiles`);
  return seekerData.map((s) => s.user.id);
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

async function seedJobs(empIds: string[]): Promise<string[]> {
  const now     = new Date().toISOString();
  const jobRows: object[] = [];
  const total   = CONFIG.JOBS_DIRECT + CONFIG.JOBS_SCRAPED;

  for (let i = 0; i < total; i++) {
    const isDirect = i < CONFIG.JOBS_DIRECT;
    const domain   = pick(DOMAINS);
    const reqSkills  = pickN(SKILLS[domain], faker.number.int({ min: 3, max: 6 }));
    const niceSkills = pickN(SKILLS[domain].filter((s) => !reqSkills.includes(s)), faker.number.int({ min: 1, max: 3 }));
    const source   = isDirect ? "direct" : pick(SCRAPED_SOURCES);
    const salMin   = faker.number.int({ min: 300000, max: 1500000 });

    jobRows.push({
      id: faker.string.uuid(),
      external_id: faker.string.alphanumeric(16),
      source,
      sources: [source],
      fingerprint: faker.string.alphanumeric(32),
      url: faker.internet.url(),
      title: pick(JOB_TITLES[domain]),
      company_name: faker.company.name(),
      location: pick(CITIES),
      work_mode: pick(WORK_MODES),
      job_type: pick(JOB_TYPES),
      description: pick(JD[domain]),
      skills_required: reqSkills,
      skills_nice_to_have: niceSkills,
      experience_min: faker.number.int({ min: 0, max: 3 }),
      experience_max: faker.number.int({ min: 3, max: 10 }),
      salary_min: salMin,
      salary_max: salMin + faker.number.int({ min: 200000, max: 800000 }),
      salary_currency: "INR",
      is_active: true,
      posted_at: faker.date.recent({ days: 60 }).toISOString(),
      posted_by_employer_id: isDirect ? pick(empIds) : null,
      created_at: faker.date.recent({ days: 60 }).toISOString(),
      updated_at: now,
    });
  }

  await batch("jobs", jobRows);
  console.log(`💼 Generated ${total} Jobs (${CONFIG.JOBS_DIRECT} Direct, ${CONFIG.JOBS_SCRAPED} Scraped)`);
  return (jobRows as Array<{ id: string }>).map((j) => j.id);
}

// ─── Applications ─────────────────────────────────────────────────────────────

async function seedApplications(seekerIds: string[], jobIds: string[], overflowId: string): Promise<void> {
  const now  = new Date().toISOString();
  const seen = new Set<string>();
  const rows: object[] = [];

  // Regular applications
  let attempts = 0;
  while (rows.length < CONFIG.APPLICATIONS && attempts < CONFIG.APPLICATIONS * 4) {
    attempts++;
    const userId = pick(seekerIds);
    const jobId  = pick(jobIds);
    const key    = `${userId}:${jobId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const status   = weightedPick(APP_STATUSES);
    const appliedAt = faker.date.recent({ days: 90 }).toISOString();
    rows.push({
      id: faker.string.uuid(),
      user_id: userId,
      job_id: jobId,
      job_title: faker.person.jobTitle(),
      company_name: faker.company.name(),
      location: pick(CITIES),
      status,
      position_order: rows.length + 1,
      status_history: [{ status, changed_at: appliedAt }],
      applied_at: status !== "saved" ? appliedAt : null,
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
      is_archived: false,
      created_at: appliedAt,
      updated_at: now,
    });
  }

  // Overflow user: 50 applications spread across all columns
  const overflowStatuses = ["saved", "applied", "applied", "screening", "screening", "interview", "interview", "offer", "rejected", "rejected"];
  for (let i = 0; i < CONFIG.OVERFLOW_APPLICATIONS; i++) {
    const jobId = pick(jobIds);
    const key   = `${overflowId}:${jobId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const status   = overflowStatuses[i % overflowStatuses.length];
    const appliedAt = faker.date.recent({ days: 90 }).toISOString();
    rows.push({
      id: faker.string.uuid(),
      user_id: overflowId,
      job_id: jobId,
      job_title: faker.person.jobTitle(),
      company_name: faker.company.name(),
      location: pick(CITIES),
      status,
      position_order: i + 1,
      status_history: [{ status, changed_at: appliedAt }],
      applied_at: status !== "saved" ? appliedAt : null,
      notes: null,
      is_archived: false,
      created_at: appliedAt,
      updated_at: now,
    });
  }

  await batch("applications", rows);

  const counts: Record<string, number> = {};
  for (const r of rows as Array<{ status: string }>) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log(`📥 Simulated ${rows.length} Applications`);
  for (const [s, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ↳ ${String(n).padStart(4)} in '${s}'`);
  }
}

// ─── Applicants (employer side) ───────────────────────────────────────────────

async function seedApplicants(postIds: string[], seekerIds: string[]): Promise<void> {
  const now  = new Date().toISOString();
  const rows: object[] = [];

  // Use first 50 posts to keep volume manageable
  const targetPosts = postIds.slice(0, 50);

  for (const postId of targetPosts) {
    const count = faker.number.int({ min: 2, max: CONFIG.APPLICANTS_PER_POST });
    for (let i = 0; i < count; i++) {
      const userId = pick(seekerIds);
      rows.push({
        id: faker.string.uuid(),
        job_post_id: postId,
        user_id: Math.random() > 0.3 ? userId : null,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: `+91${faker.string.numeric(10)}`,
        role_title: faker.person.jobTitle(),
        current_company: faker.company.name(),
        resume_url: null,
        resume_parsed_json: null,
        screening_responses: [],
        screening_score: Math.random() > 0.2 ? faker.number.int({ min: 30, max: 100 }) : null,
        bucket: Math.random() > 0.2 ? pick(BUCKETS) : null,
        pipeline_stage: pick(PIPELINE_STAGES),
        rejection_reason: null,
        is_talent_pool: Math.random() > 0.8,
        talent_pool_tags: [],
        created_at: faker.date.recent({ days: 60 }).toISOString(),
        updated_at: now,
      });
    }
  }

  const ok = await tryBatch("applicants", rows);
  if (ok) console.log(`🎯 Generated ${rows.length} Employer-side Applicants across ${targetPosts.length} job posts`);
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function seedNotifications(seekerIds: string[]): Promise<void> {
  const now  = new Date().toISOString();
  const rows: object[] = [];

  for (let i = 0; i < CONFIG.NOTIFICATIONS; i++) {
    const type     = pick(NOTIF_TYPES);
    const sentAt   = faker.date.recent({ days: 30 }).toISOString();
    const isRead   = Math.random() > 0.4;
    const titles: Record<string, string> = {
      status_change:    "Your application status changed",
      interview_invite: "You have a new interview invitation",
      offer:            "Congratulations! You have received an offer",
      rejection:        "Application update from recruiter",
      general:          "New activity on your profile",
    };
    rows.push({
      id: faker.string.uuid(),
      user_id: pick(seekerIds),
      notification_type: type,
      channel: pick(["in_app", "email"]),
      title: titles[type],
      body: faker.lorem.sentence(),
      reference_id: faker.string.uuid(),
      is_read: isRead,
      sent_at: sentAt,
      read_at: isRead ? sentAt : null,
    });
  }

  const ok = await tryBatch("notification_log", rows);
  if (ok) console.log(`🔔 Generated ${rows.length} Notifications`);
}

// ─── Salary Reports ───────────────────────────────────────────────────────────

async function seedSalaryReports(seekerIds: string[]): Promise<void> {
  const now  = new Date().toISOString();
  const rows: object[] = [];

  for (let i = 0; i < CONFIG.SALARY_REPORTS; i++) {
    const domain  = pick(DOMAINS);
    const base    = faker.number.int({ min: 400000, max: 3000000 });
    const expYears = faker.number.int({ min: 0, max: 15 });
    rows.push({
      id: faker.string.uuid(),
      user_id: pick(seekerIds),
      role_title: pick(JOB_TITLES[domain]),
      company_name: faker.company.name(),
      company_size: pick(COMPANY_SIZES),
      location: pick(CITIES),
      experience_years: expYears,
      base_salary: base,
      total_compensation: base + faker.number.int({ min: 0, max: 500000 }),
      currency: "INR",
      is_verified: Math.random() > 0.7,
      created_at: faker.date.recent({ days: 180 }).toISOString(),
    });
  }

  const ok = await tryBatch("salary_reports", rows);
  if (ok) console.log(`💰 Generated ${rows.length} Salary Reports`);
}

// ─── Community Posts ──────────────────────────────────────────────────────────

async function seedCommunityPosts(seekerIds: string[]): Promise<void> {
  const now       = new Date().toISOString();
  const postRows: object[] = [];
  const categories = ["frontend", "backend", "data-science", "devops", "career-advice", "salary", "interview-prep", "general"];
  const postTypes  = ["question", "discussion", "interview_experience", "salary_info"];

  for (let i = 0; i < CONFIG.COMMUNITY_POSTS; i++) {
    const domain = pick(DOMAINS);
    postRows.push({
      id: faker.string.uuid(),
      user_id: pick(seekerIds),
      post_type: pick(postTypes),
      title: faker.lorem.sentence().slice(0, 100),
      body: pick(JD[domain]).slice(0, 500),
      category: pick(categories),
      is_anonymous: Math.random() > 0.7,
      upvotes: faker.number.int({ min: 0, max: 150 }),
      downvotes: faker.number.int({ min: 0, max: 20 }),
      comments_count: 0,
      status: "active",
      created_at: faker.date.recent({ days: 90 }).toISOString(),
      updated_at: now,
    });
  }

  const ok = await tryBatch("community_posts", postRows);
  if (!ok) return;

  // Comments: 2-5 per post
  const commentRows: object[] = [];
  for (const post of postRows as Array<{ id: string }>) {
    const count = faker.number.int({ min: 0, max: 5 });
    for (let j = 0; j < count; j++) {
      commentRows.push({
        id: faker.string.uuid(),
        post_id: post.id,
        user_id: pick(seekerIds),
        parent_comment_id: null,
        body: faker.lorem.sentences(2),
        is_anonymous: Math.random() > 0.8,
        upvotes: faker.number.int({ min: 0, max: 30 }),
        status: "active",
        created_at: faker.date.recent({ days: 90 }).toISOString(),
        updated_at: now,
      });
    }
  }
  await tryBatch("community_comments", commentRows);
  console.log(`💬 Generated ${postRows.length} Community Posts + ${commentRows.length} Comments`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log("\n🌱 Starting FitVector Pro Mega Seed...");
  console.log(`   Target: ${CONFIG.SEEKERS} seekers | ${CONFIG.JOBS_DIRECT + CONFIG.JOBS_SCRAPED} jobs | ${CONFIG.APPLICATIONS} applications\n`);

  await wipeTestData();
  if (WIPE_ONLY) { console.log("\n✅ Wipe-only mode complete.\n"); return; }

  console.log("");
  await seedSuperAdmin();
  const { empIds, postIds } = await seedEmployers();
  const { overflowId }      = await seedEdgeCaseUsers();
  const seekerIds           = await seedSeekers();
  const jobIds              = await seedJobs(empIds);

  await seedApplications(seekerIds, jobIds, overflowId);
  await seedApplicants(postIds, seekerIds);
  await seedNotifications(seekerIds);
  await seedSalaryReports(seekerIds);
  await seedCommunityPosts(seekerIds);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Seeding complete in ${elapsed}s`);
  console.log(`\n📋 Test credentials (all passwords: jhankar123)`);
  console.log(`   Seeker (basic):   seeker_1${CONFIG.SEED_DOMAIN}`);
  console.log(`   Seeker (overflow): edgecase_overflow${CONFIG.SEED_DOMAIN}`);
  console.log(`   Seeker (no skills): edgecase_no_skills${CONFIG.SEED_DOMAIN}`);
  console.log(`   Seeker (new user): edgecase_newuser${CONFIG.SEED_DOMAIN}`);
  console.log(`   Employer (normal): employer_1${CONFIG.SEED_DOMAIN}`);
  console.log(`   Employer (heavy):  employer_heavy${CONFIG.SEED_DOMAIN}`);
  console.log(`   Super Admin:       superadmin${CONFIG.SEED_DOMAIN}`);
  console.log("");
}

main().catch((err) => {
  console.error("\n💥 Seed failed:", err);
  process.exit(1);
});
