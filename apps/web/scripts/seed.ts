/**
 * FitVector Pro — TypeScript Seed Script
 *
 * Usage:
 *   pnpm seed          — wipe existing seed data, then seed fresh
 *   pnpm seed:wipe     — wipe only (no re-seed)
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

// ─── Load env ────────────────────────────────────────────────────────────────

// Try .env.local first, then .env
const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Admin client — bypasses ALL RLS policies
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  SEED_EMAIL_DOMAIN: "@seed.fitvector.dev",
  SEED_PASSWORD: "jhankar123",
  SUPER_ADMINS: 1,
  EMPLOYERS: 10,
  SEEKERS: 50,
  JOBS_DIRECT: 50,
  JOBS_SCRAPED: 100,
  APPLICATIONS: 300,
  BATCH_SIZE: 50,
};

const WIPE_ONLY = process.argv.includes("--wipe");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function weightedPick<T>(options: Record<string, number>): T {
  const total = Object.values(options).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, weight] of Object.entries(options)) {
    r -= weight;
    if (r <= 0) return key as T;
  }
  return Object.keys(options)[0] as T;
}

async function batchInsert<T extends object>(
  table: string,
  rows: T[],
  batchSize = CONFIG.BATCH_SIZE,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ❌  Insert error on ${table} batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      throw error;
    }
  }
}

// ─── Skill Pools ─────────────────────────────────────────────────────────────

const SKILL_POOLS = {
  frontend:  ["React", "TypeScript", "Next.js", "Vue.js", "Angular", "Tailwind CSS", "HTML", "CSS", "JavaScript", "GraphQL", "Redux", "Webpack"],
  backend:   ["Node.js", "Python", "FastAPI", "Django", "Java", "Spring Boot", "Go", "REST APIs", "PostgreSQL", "Redis", "MongoDB", "Express.js"],
  data:      ["Python", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Spark", "R", "Tableau", "Power BI", "Jupyter", "Scikit-learn", "Databricks"],
  devops:    ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "Linux", "Ansible", "Prometheus", "Grafana", "Jenkins", "GitHub Actions"],
  mobile:    ["React Native", "Flutter", "Swift", "Kotlin", "iOS Development", "Android Development", "Expo", "Firebase", "XCode"],
  finance:   ["Excel", "Power BI", "Tableau", "SAP", "SQL", "Python", "Financial Modelling", "VBA", "Bloomberg Terminal", "Tally", "QuickBooks"],
  sales:     ["Salesforce", "CRM", "B2B Sales", "Excel", "PowerPoint", "Lead Generation", "HubSpot", "Cold Calling", "Account Management", "Negotiation"],
};

type Domain = keyof typeof SKILL_POOLS;
const DOMAINS = Object.keys(SKILL_POOLS) as Domain[];

const JOB_TITLES_BY_DOMAIN: Record<Domain, string[]> = {
  frontend:  ["Frontend Developer", "React Developer", "UI Engineer", "Web Developer", "Frontend Engineer", "Next.js Developer"],
  backend:   ["Backend Engineer", "Python Developer", "Node.js Developer", "Java Developer", "API Engineer", "Software Engineer"],
  data:      ["Data Scientist", "Data Analyst", "ML Engineer", "Data Engineer", "BI Analyst", "Analytics Engineer", "AI/ML Engineer"],
  devops:    ["DevOps Engineer", "Cloud Engineer", "SRE", "Platform Engineer", "Infrastructure Engineer", "AWS Solutions Architect"],
  mobile:    ["Mobile Developer", "iOS Developer", "Android Developer", "React Native Developer", "Flutter Developer"],
  finance:   ["Financial Analyst", "Accountant", "Finance Manager", "Business Analyst", "Excel Specialist", "FP&A Analyst"],
  sales:     ["Sales Executive", "Account Manager", "Business Development Manager", "Sales Manager", "Inside Sales Representative"],
};

const SCRAPED_SOURCES = ["linkedin", "naukri", "indeed", "glassdoor", "google"] as const;

const INDIAN_CITIES = [
  "Bangalore, India", "Mumbai, India", "Hyderabad, India", "Pune, India",
  "Chennai, India", "Delhi, India", "Kolkata, India", "Ahmedabad, India",
  "Noida, India", "Gurgaon, India",
];

const COMPANY_INDUSTRIES = [
  "technology", "fintech", "healthcare", "education", "ecommerce",
  "saas", "consulting", "media", "logistics", "manufacturing",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
const PLAN_TIERS = ["free", "starter", "pro", "elite"] as const;
const COMPANY_PLAN_TIERS = ["starter", "growth", "business", "enterprise"] as const;
const EXPERIENCE_LEVELS = ["fresher", "1_3", "3_7", "7_15"] as const;
const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const JOB_TYPES = ["fulltime", "parttime", "contract"] as const;

// ─── Wipe ─────────────────────────────────────────────────────────────────────

async function wipeTestData(): Promise<void> {
  console.log("🧹 Wiping existing seed data...");

  // Fetch seed user IDs first
  const { data: seedUsers } = await supabase
    .from("users")
    .select("id, role")
    .like("email", `%${CONFIG.SEED_EMAIL_DOMAIN}`);

  const allSeedIds = (seedUsers || []).map((u) => u.id);
  const seekerIds = (seedUsers || []).filter((u) => u.role === "seeker").map((u) => u.id);
  const employerIds = (seedUsers || []).filter((u) => u.role !== "seeker").map((u) => u.id);

  if (allSeedIds.length === 0) {
    console.log("  ℹ️  No existing seed data found.");
    return;
  }

  // Delete in FK-safe order (children first)
  if (seekerIds.length > 0) {
    await supabase.from("applications").delete().in("user_id", seekerIds);
    await supabase.from("job_matches").delete().in("user_id", seekerIds);
    await supabase.from("usage_logs").delete().in("user_id", seekerIds);
    await supabase.from("user_profiles").delete().in("user_id", seekerIds);
  }
  if (employerIds.length > 0) {
    await supabase.from("company_members").delete().in("user_id", employerIds);
    const { data: seedCompanies } = await supabase
      .from("companies")
      .select("id")
      .in("created_by", employerIds);
    const companyIds = (seedCompanies || []).map((c) => c.id);
    if (companyIds.length > 0) {
      await supabase.from("job_posts").delete().in("company_id", companyIds);
      await supabase.from("companies").delete().in("id", companyIds);
    }
    // Direct jobs posted by seed employers
    await supabase.from("jobs").delete().in("posted_by_employer_id", employerIds);
  }

  // Scraped seed jobs
  await supabase.from("jobs").delete().eq("source", "seed");

  // Users
  if (allSeedIds.length > 0) {
    await supabase.from("users").delete().in("id", allSeedIds);
  }

  console.log(`  ✅ Wiped ${allSeedIds.length} seed users and related data.`);
}

// ─── Seed Super Admin ─────────────────────────────────────────────────────────

async function seedSuperAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(CONFIG.SEED_PASSWORD, 10);

  const adminRow = {
    id: faker.string.uuid(),
    email: `superadmin${CONFIG.SEED_EMAIL_DOMAIN}`,
    full_name: "FitVector Super Admin",
    password_hash: passwordHash,
    role: "superadmin",
    status: "active",
    onboarding_completed: true,
    auth_provider: "credentials",
    plan_tier: "elite",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("users").insert(adminRow);
  if (error) {
    console.error("  ❌  Super admin insert error:", error.message);
    throw error;
  }
  console.log("👑 Created 1 Super Admin   (superadmin@seed.fitvector.dev / SeedPass123!)");
}

// ─── Seed Employers + Companies ───────────────────────────────────────────────

async function seedEmployers(): Promise<{ employerIds: string[]; companyIds: string[] }> {
  const passwordHash = await bcrypt.hash(CONFIG.SEED_PASSWORD, 10);
  const now = new Date().toISOString();

  const employerRows = Array.from({ length: CONFIG.EMPLOYERS }, (_, i) => ({
    id: faker.string.uuid(),
    email: `employer_${i + 1}${CONFIG.SEED_EMAIL_DOMAIN}`,
    full_name: faker.person.fullName(),
    password_hash: passwordHash,
    role: "employer",
    status: "active",
    onboarding_completed: true,
    auth_provider: "credentials",
    plan_tier: pick([...PLAN_TIERS]),
    email_verified: true,
    created_at: faker.date.past({ years: 1 }).toISOString(),
    updated_at: now,
  }));

  await batchInsert("users", employerRows);

  const companyRows = employerRows.map((emp) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    website_url: faker.internet.url(),
    industry: pick(COMPANY_INDUSTRIES),
    company_size: pick([...COMPANY_SIZES]),
    description: faker.company.catchPhrase() + ". " + faker.lorem.sentences(2),
    culture_keywords: pickN(["innovation", "remote-first", "inclusive", "fast-paced", "startup", "data-driven", "collaborative", "growth"], 3),
    locations: [{ city: faker.location.city(), country: "India" }],
    created_by: emp.id,
    plan_tier: pick([...COMPANY_PLAN_TIERS]),
    created_at: emp.created_at,
    updated_at: now,
  }));

  await batchInsert("companies", companyRows);

  const memberRows = employerRows.map((emp, i) => ({
    id: faker.string.uuid(),
    company_id: companyRows[i].id,
    user_id: emp.id,
    role: "admin",
    status: "active",
    created_at: emp.created_at,
    updated_at: now,
  }));

  await batchInsert("company_members", memberRows);

  console.log(`🏢 Created ${CONFIG.EMPLOYERS} Companies + ${CONFIG.EMPLOYERS} Employer profiles`);
  return {
    employerIds: employerRows.map((e) => e.id),
    companyIds: companyRows.map((c) => c.id),
  };
}

// ─── Seed Seekers ─────────────────────────────────────────────────────────────

async function seedSeekers(): Promise<string[]> {
  const passwordHash = await bcrypt.hash(CONFIG.SEED_PASSWORD, 10);
  const now = new Date().toISOString();

  const seekerRows = Array.from({ length: CONFIG.SEEKERS }, (_, i) => {
    const domain = pick(DOMAINS);
    const primarySkills = pickN(SKILL_POOLS[domain], faker.number.int({ min: 5, max: 8 }));
    const secondaryDomain = pick(DOMAINS.filter((d) => d !== domain));
    const secondarySkills = pickN(SKILL_POOLS[secondaryDomain], faker.number.int({ min: 2, max: 3 }));
    const skills = [...new Set([...primarySkills, ...secondarySkills])];
    const expYears = faker.number.int({ min: 0, max: 12 });

    return {
      user: {
        id: faker.string.uuid(),
        email: `seeker_${i + 1}${CONFIG.SEED_EMAIL_DOMAIN}`,
        full_name: faker.person.fullName(),
        password_hash: passwordHash,
        role: "seeker",
        status: "active",
        onboarding_completed: true,
        auth_provider: "credentials",
        plan_tier: pick([...PLAN_TIERS]),
        email_verified: true,
        created_at: faker.date.past({ years: 2 }).toISOString(),
        updated_at: now,
      },
      profile: {
        current_role: pick(JOB_TITLES_BY_DOMAIN[domain]),
        current_company: faker.company.name(),
        experience_level: pick([...EXPERIENCE_LEVELS]),
        target_roles: [pick(JOB_TITLES_BY_DOMAIN[domain]), pick(JOB_TITLES_BY_DOMAIN[domain])],
        target_locations: pickN(INDIAN_CITIES, faker.number.int({ min: 1, max: 3 })),
        skills,
        preferred_work_mode: pick([...WORK_MODES]),
        preferred_job_types: ["fulltime"],
        preferred_industries: pickN(COMPANY_INDUSTRIES, 2),
        parsed_resume_json: {
          contact: { name: faker.person.fullName(), email: faker.internet.email() },
          summary: `${expYears}+ years of experience in ${domain}. ${faker.lorem.sentences(2)}`,
          skills,
          experience: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
            role: pick(JOB_TITLES_BY_DOMAIN[domain]),
            company: faker.company.name(),
            start_date: faker.date.past({ years: expYears + 1 }).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            end_date: Math.random() > 0.3 ? faker.date.recent({ days: 365 }).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Present",
            bullets: [faker.lorem.sentence(), faker.lorem.sentence()],
          })),
          education: [{
            institution: faker.company.name() + " University",
            degree: "Bachelor of Technology",
            field: domain === "data" ? "Computer Science" : domain === "finance" ? "Commerce" : "Engineering",
            year: String(2015 + faker.number.int({ min: 0, max: 8 })),
          }],
        },
      },
      _domain: domain,
    };
  });

  const userInserts = seekerRows.map((s) => s.user);
  await batchInsert("users", userInserts);

  const profileInserts = seekerRows.map((s) => ({
    user_id: s.user.id,
    ...s.profile,
    created_at: s.user.created_at,
    updated_at: now,
  }));
  await batchInsert("user_profiles", profileInserts);

  console.log(`👨‍💻 Generated ${CONFIG.SEEKERS} Job Seekers with varied skills`);
  return seekerRows.map((s) => s.user.id);
}

// ─── Seed Jobs ────────────────────────────────────────────────────────────────

async function seedJobs(employerIds: string[]): Promise<string[]> {
  const now = new Date().toISOString();
  const jobRows: object[] = [];

  // 50 direct (employer-posted)
  for (let i = 0; i < CONFIG.JOBS_DIRECT; i++) {
    const domain = pick(DOMAINS);
    const reqSkills = pickN(SKILL_POOLS[domain], faker.number.int({ min: 3, max: 6 }));
    const niceSkills = pickN(SKILL_POOLS[domain].filter((s) => !reqSkills.includes(s)), faker.number.int({ min: 1, max: 3 }));
    const salaryMin = faker.number.int({ min: 300000, max: 1200000 });

    jobRows.push({
      id: faker.string.uuid(),
      external_id: faker.string.alphanumeric(16),
      source: "direct",
      sources: ["direct"],
      fingerprint: faker.string.alphanumeric(32),
      url: faker.internet.url(),
      title: pick(JOB_TITLES_BY_DOMAIN[domain]),
      company_name: faker.company.name(),
      location: pick(INDIAN_CITIES),
      work_mode: pick([...WORK_MODES]),
      job_type: pick([...JOB_TYPES]),
      description: `We are looking for a ${pick(JOB_TITLES_BY_DOMAIN[domain])} to join our team. ${faker.lorem.paragraphs(2)}`,
      skills_required: reqSkills,
      skills_nice_to_have: niceSkills,
      experience_min: faker.number.int({ min: 0, max: 3 }),
      experience_max: faker.number.int({ min: 3, max: 10 }),
      salary_min: salaryMin,
      salary_max: salaryMin + faker.number.int({ min: 200000, max: 800000 }),
      salary_currency: "INR",
      is_active: true,
      posted_at: faker.date.recent({ days: 30 }).toISOString(),
      posted_by_employer_id: pick(employerIds),
      created_at: faker.date.recent({ days: 30 }).toISOString(),
      updated_at: now,
    });
  }

  // 100 scraped (from external sources — stored as 'seed' so they don't pollute real search)
  for (let i = 0; i < CONFIG.JOBS_SCRAPED; i++) {
    const domain = pick(DOMAINS);
    const reqSkills = pickN(SKILL_POOLS[domain], faker.number.int({ min: 3, max: 6 }));
    const niceSkills = pickN(SKILL_POOLS[domain].filter((s) => !reqSkills.includes(s)), faker.number.int({ min: 1, max: 3 }));
    const source = pick([...SCRAPED_SOURCES]);
    const salaryMin = faker.number.int({ min: 300000, max: 1200000 });

    jobRows.push({
      id: faker.string.uuid(),
      external_id: faker.string.alphanumeric(16),
      source,
      sources: [source],
      fingerprint: faker.string.alphanumeric(32),
      url: faker.internet.url(),
      title: pick(JOB_TITLES_BY_DOMAIN[domain]),
      company_name: faker.company.name(),
      location: pick(INDIAN_CITIES),
      work_mode: pick([...WORK_MODES]),
      job_type: pick([...JOB_TYPES]),
      description: `Exciting opportunity for a ${pick(JOB_TITLES_BY_DOMAIN[domain])}. ${faker.lorem.paragraphs(2)}`,
      skills_required: reqSkills,
      skills_nice_to_have: niceSkills,
      experience_min: faker.number.int({ min: 0, max: 3 }),
      experience_max: faker.number.int({ min: 3, max: 10 }),
      salary_min: salaryMin,
      salary_max: salaryMin + faker.number.int({ min: 200000, max: 800000 }),
      salary_currency: "INR",
      is_active: true,
      posted_at: faker.date.recent({ days: 60 }).toISOString(),
      posted_by_employer_id: null,
      created_at: faker.date.recent({ days: 60 }).toISOString(),
      updated_at: now,
    });
  }

  await batchInsert("jobs", jobRows);

  const total = CONFIG.JOBS_DIRECT + CONFIG.JOBS_SCRAPED;
  console.log(`💼 Generated ${total} Jobs (${CONFIG.JOBS_DIRECT} Direct, ${CONFIG.JOBS_SCRAPED} Scraped)`);
  return (jobRows as Array<{ id: string }>).map((j) => j.id);
}

// ─── Seed Applications ────────────────────────────────────────────────────────

async function seedApplications(seekerIds: string[], jobIds: string[]): Promise<void> {
  const now = new Date().toISOString();
  const statusWeights = {
    applied: 0.40,
    screening: 0.27,
    interview: 0.20,
    offer: 0.03,
    rejected: 0.10,
  };

  const appRows: object[] = [];
  const seen = new Set<string>();

  let attempts = 0;
  while (appRows.length < CONFIG.APPLICATIONS && attempts < CONFIG.APPLICATIONS * 3) {
    attempts++;
    const userId = pick(seekerIds);
    const jobId = pick(jobIds);
    const key = `${userId}:${jobId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const status = weightedPick<string>(statusWeights);
    const appliedAt = faker.date.recent({ days: 90 }).toISOString();

    appRows.push({
      id: faker.string.uuid(),
      user_id: userId,
      job_id: jobId,
      job_title: faker.person.jobTitle(),
      company_name: faker.company.name(),
      status,
      position_order: appRows.length + 1,
      status_history: [{ status, changed_at: appliedAt }],
      applied_at: status !== "saved" ? appliedAt : null,
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
      is_archived: false,
      created_at: appliedAt,
      updated_at: now,
    });
  }

  await batchInsert("applications", appRows);

  // Print distribution
  const counts: Record<string, number> = {};
  for (const app of appRows as Array<{ status: string }>) {
    counts[app.status] = (counts[app.status] || 0) + 1;
  }
  console.log(`📥 Simulated ${appRows.length} Applications`);
  for (const [status, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ↳ ${count.toString().padStart(3)} in '${status}'`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log("\n🌱 Starting FitVector DB Seed...");
  console.log(`   URL: ${SUPABASE_URL?.slice(0, 40)}...`);
  console.log("");

  await wipeTestData();

  if (WIPE_ONLY) {
    console.log("\n✅ Wipe-only mode complete.\n");
    return;
  }

  console.log("");
  await seedSuperAdmin();
  const { employerIds, companyIds: _companyIds } = await seedEmployers();
  const seekerIds = await seedSeekers();
  const jobIds = await seedJobs(employerIds);
  await seedApplications(seekerIds, jobIds);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Seeding complete in ${elapsed}s`);
  console.log(`\n📋 Test credentials (all use password: jhankar123)`);
  console.log(`   Seeker:    seeker_1@seed.fitvector.dev`);
  console.log(`   Employer:  employer_1@seed.fitvector.dev`);
  console.log(`   SuperAdmin: superadmin@seed.fitvector.dev`);
  console.log("");
}

main().catch((err) => {
  console.error("\n💥 Seed failed:", err);
  process.exit(1);
});
