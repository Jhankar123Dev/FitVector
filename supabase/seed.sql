-- =============================================================================
-- FitVector Pro — Full Seed Script
-- Generated: 2026-04-14
-- Run via: Supabase SQL Editor → paste & Run
--          OR: psql $DATABASE_URL < supabase/seed.sql
--
-- BEFORE RUNNING: Replace the two placeholder values below with your real emails.
-- Only transactional data is wiped. public.users rows are NEVER deleted.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 0 · CONFIGURATION — edit these two lines before running
-- ─────────────────────────────────────────────────────────────────────────────
\set employer_email 'employer1@gmail.com'
\set seeker_email   'seeker1@gmail.com'

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 · TEARDOWN — delete in reverse FK order
--             Users, user_profiles, user_reputation are NEVER touched.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. interview_participants  (leaf — child of human_interviews)
DELETE FROM public.interview_participants;

-- 2. candidate_votes  (child of applicants)
DELETE FROM public.candidate_votes;

-- 3. candidate_notes  (child of applicants)
DELETE FROM public.candidate_notes;

-- 4. ai_interviews  (child of applicants + job_posts)
DELETE FROM public.ai_interviews;

-- 5. assessment_submissions  (child of assessments + applicants)
DELETE FROM public.assessment_submissions;

-- 6. human_interviews  (child of applicants + job_posts)
DELETE FROM public.human_interviews;

-- 7. application_boosts  (child of fitvector_applications)
DELETE FROM public.application_boosts;

-- 8. notification_log  (child of fitvector_applications)
DELETE FROM public.notification_log;

-- 9. applications  (has fitvector_app_id FK → fitvector_applications)
DELETE FROM public.applications;

-- 10. fitvector_applications  (child of job_posts + applicants)
DELETE FROM public.fitvector_applications;

-- 11. generated_outreach  (has job_id FK → jobs)
DELETE FROM public.generated_outreach;

-- 12. tailored_resumes  (child of jobs + users)
DELETE FROM public.tailored_resumes;

-- 13. job_matches  (child of jobs + users)
DELETE FROM public.job_matches;

-- 14. notifications  (child of users — only seeded ones)
DELETE FROM public.notifications;

-- 15. talent_pool_cache  (child of companies + job_posts)
DELETE FROM public.talent_pool_cache;

-- 16. job_promotions  (child of job_posts + companies)
DELETE FROM public.job_promotions;

-- 17. promoted_listings  (child of job_posts + companies)
DELETE FROM public.promoted_listings;

-- 18. usage_logs  (child of users)
DELETE FROM public.usage_logs;

-- 19. applicants  (child of job_posts)
DELETE FROM public.applicants;

-- 20. jobs  (has job_post_id FK → job_posts — must go before job_posts)
DELETE FROM public.jobs;

-- 21. job_posts  (child of companies + users; has assessment_id FK → assessments)
--     Null out assessment_id first to break circular FK before deleting assessments
UPDATE public.job_posts SET assessment_id = NULL;
DELETE FROM public.job_posts;

-- 22. assessments  (child of companies + users)
DELETE FROM public.assessments;

-- 23. interview_panels  (child of companies)
DELETE FROM public.interview_panels;

-- 24. company_members  (child of companies + users)
DELETE FROM public.company_members;

-- 25. employer_usage  (child of companies)
DELETE FROM public.employer_usage;

-- 26. companies
DELETE FROM public.companies;

-- 27. question_bank  (standalone)
DELETE FROM public.question_bank;

-- 28. community_comments  (child of community_posts + users)
DELETE FROM public.community_comments;

-- 29. community_votes  (child of users)
DELETE FROM public.community_votes;

-- 30. community_posts  (child of users)
DELETE FROM public.community_posts;

-- 31. salary_reports  (child of users)
DELETE FROM public.salary_reports;

-- 32. boost_credits  (child of users)
DELETE FROM public.boost_credits;

-- Teardown complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 2 · COMPANIES
-- =============================================================================

INSERT INTO public.companies (id, name, logo_url, website_url, industry, company_size,
  description, culture_keywords, locations, branding, created_by, plan_tier,
  plan_expiry, is_transparent_pipeline)
VALUES
  -- Cognizant — employer's company (all internal job_posts live here)
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Cognizant Technology Solutions',
    'https://logo.clearbit.com/cognizant.com',
    'https://www.cognizant.com',
    'Information Technology',
    '1000+',
    'Cognizant is a leading professional services company, transforming clients'' business, operating, and technology models for the digital era.',
    ARRAY['innovation','collaboration','diversity','growth','agile'],
    '[{"city":"Bengaluru","state":"Karnataka"},{"city":"Mumbai","state":"Maharashtra"},{"city":"Hyderabad","state":"Telangana"},{"city":"Chennai","state":"Tamil Nadu"}]'::jsonb,
    '{"primary_color":"#1a3c6e","secondary_color":"#00b4f0","tagline":"Accelerating digital transformation","cover_image_url":"https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200"}'::jsonb,
    (SELECT id FROM public.users WHERE email = :'employer_email'),
    'growth',
    NOW() + INTERVAL '1 year',
    true
  ),
  -- Accenture — external company (appears only in jobs board)
  (
    'aaaaaaaa-0001-0001-0001-000000000002',
    'Accenture India',
    'https://logo.clearbit.com/accenture.com',
    'https://www.accenture.com/in-en',
    'Information Technology',
    '1000+',
    'Accenture is a global professional services company with leading capabilities in digital, cloud and security.',
    ARRAY['technology','consulting','innovation','global','leadership'],
    '[{"city":"Bengaluru","state":"Karnataka"},{"city":"Pune","state":"Maharashtra"},{"city":"Hyderabad","state":"Telangana"}]'::jsonb,
    '{"primary_color":"#a100ff","secondary_color":"#000000","tagline":"Let there be change"}'::jsonb,
    (SELECT id FROM public.users WHERE email = :'employer_email'),
    'starter',
    NULL,
    false
  ),
  -- Capgemini — external company (appears only in jobs board)
  (
    'aaaaaaaa-0001-0001-0001-000000000003',
    'Capgemini India',
    'https://logo.clearbit.com/capgemini.com',
    'https://www.capgemini.com/in-en',
    'Information Technology',
    '1000+',
    'Capgemini is a global leader in partnering with companies to transform and manage their business by harnessing the power of technology.',
    ARRAY['digital','cloud','sustainability','diversity','excellence'],
    '[{"city":"Mumbai","state":"Maharashtra"},{"city":"Pune","state":"Maharashtra"},{"city":"Bengaluru","state":"Karnataka"}]'::jsonb,
    '{"primary_color":"#0070ad","secondary_color":"#12abdb","tagline":"Get the future you want"}'::jsonb,
    (SELECT id FROM public.users WHERE email = :'employer_email'),
    'starter',
    NULL,
    false
  );

-- =============================================================================
-- SECTION 3 · COMPANY MEMBERS
-- =============================================================================

INSERT INTO public.company_members (company_id, user_id, role, invited_by, invite_email, status)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'admin',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  :'employer_email',
  'active'
);

-- =============================================================================
-- SECTION 4 · QUESTION BANK  (12 standalone reusable problems)
-- =============================================================================

INSERT INTO public.question_bank (id, title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
VALUES

-- ── JavaScript ──────────────────────────────────────────────────────────────
(
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Implement Debounce',
  'JavaScript',
  'medium',
  'Write a `debounce(fn, delay)` function that returns a debounced version of `fn`. The debounced function delays invoking `fn` until after `delay` milliseconds have elapsed since the last invocation.',
  '{"nodejs": "function debounce(fn, delay) {\n  // your code here\n}\n\nmodule.exports = debounce;", "javascript": "function debounce(fn, delay) {\n  // your code here\n}"}'::jsonb,
  '{"nodejs": "function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\nmodule.exports = debounce;"}'::jsonb,
  '[{"input":"debounce called 3 times in 100ms window with 200ms delay","expected":"fn called exactly once","hidden":false},{"input":"debounce called once then delay passes","expected":"fn called once","hidden":false}]'::jsonb,
  ARRAY['javascript','closures','timers','frontend']
),
(
  'bbbbbbbb-0001-0001-0001-000000000002',
  'Flatten Nested Array',
  'JavaScript',
  'easy',
  'Write a function `flatten(arr)` that takes a deeply nested array and returns a single flat array containing all values.',
  '{"nodejs": "function flatten(arr) {\n  // your code here\n}\nmodule.exports = flatten;", "javascript": "function flatten(arr) {\n  // your code here\n}"}'::jsonb,
  '{"nodejs": "function flatten(arr) {\n  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);\n}\nmodule.exports = flatten;"}'::jsonb,
  '[{"input":"[1,[2,[3,[4]]],5]","expected":"[1,2,3,4,5]","hidden":false},{"input":"[[1,2],[3,[4,5]]]","expected":"[1,2,3,4,5]","hidden":false},{"input":"[]","expected":"[]","hidden":true}]'::jsonb,
  ARRAY['javascript','arrays','recursion']
),
(
  'bbbbbbbb-0001-0001-0001-000000000003',
  'Promise.all Polyfill',
  'JavaScript',
  'hard',
  'Implement your own `myPromiseAll(promises)` function that behaves exactly like `Promise.all`: resolves with an array of results when all promises resolve, or rejects as soon as any promise rejects.',
  '{"nodejs": "function myPromiseAll(promises) {\n  // your code here\n}\nmodule.exports = myPromiseAll;"}'::jsonb,
  '{"nodejs": "function myPromiseAll(promises) {\n  return new Promise((resolve, reject) => {\n    const results = [];\n    let remaining = promises.length;\n    if (remaining === 0) return resolve(results);\n    promises.forEach((p, i) => {\n      Promise.resolve(p).then(val => {\n        results[i] = val;\n        if (--remaining === 0) resolve(results);\n      }).catch(reject);\n    });\n  });\n}\nmodule.exports = myPromiseAll;"}'::jsonb,
  '[{"input":"[Promise.resolve(1), Promise.resolve(2)]","expected":"[1,2]","hidden":false},{"input":"[Promise.reject(''err'')]","expected":"rejects with ''err''","hidden":false}]'::jsonb,
  ARRAY['javascript','promises','async','frontend']
),

-- ── TypeScript / Node.js ─────────────────────────────────────────────────────
(
  'bbbbbbbb-0001-0001-0001-000000000004',
  'SQL Query with CTE',
  'SQL',
  'medium',
  'Given a table `orders(id, user_id, amount, created_at)`, write a SQL query using a Common Table Expression (CTE) to find the top 3 users by total spend, along with their order count and average order value.',
  '{"sql": "-- Write your SQL query here\nWITH user_stats AS (\n  -- your CTE\n)\nSELECT ...\nFROM user_stats\nORDER BY ...\nLIMIT 3;"}'::jsonb,
  '{"sql": "WITH user_stats AS (\n  SELECT user_id,\n         SUM(amount) AS total_spend,\n         COUNT(*) AS order_count,\n         AVG(amount) AS avg_order_value\n  FROM orders\n  GROUP BY user_id\n)\nSELECT user_id, total_spend, order_count, ROUND(avg_order_value, 2) AS avg_order_value\nFROM user_stats\nORDER BY total_spend DESC\nLIMIT 3;"}'::jsonb,
  '[{"input":"orders table with 10 users","expected":"3 rows ordered by total_spend DESC","hidden":false}]'::jsonb,
  ARRAY['sql','cte','aggregation','backend']
),
(
  'bbbbbbbb-0001-0001-0001-000000000005',
  'Window Functions — Running Total',
  'SQL',
  'medium',
  'Given `transactions(id, user_id, amount, created_at)`, write a query that returns each transaction along with a running total of `amount` for each user, ordered by `created_at`.',
  '{"sql": "-- Use window functions\nSELECT\n  id,\n  user_id,\n  amount,\n  created_at,\n  -- running total here\nFROM transactions\nORDER BY user_id, created_at;"}'::jsonb,
  '{"sql": "SELECT\n  id,\n  user_id,\n  amount,\n  created_at,\n  SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at ROWS UNBOUNDED PRECEDING) AS running_total\nFROM transactions\nORDER BY user_id, created_at;"}'::jsonb,
  '[{"input":"transactions for 3 users","expected":"running total resets per user","hidden":false}]'::jsonb,
  ARRAY['sql','window-functions','analytics']
),

-- ── Python ───────────────────────────────────────────────────────────────────
(
  'bbbbbbbb-0001-0001-0001-000000000006',
  'Retry Decorator',
  'Python',
  'medium',
  'Implement a `@retry(max_attempts, delay_seconds)` decorator that retries the decorated function up to `max_attempts` times on any exception, waiting `delay_seconds` between each attempt. Raise the last exception if all attempts fail.',
  '{"python3": "import time\nimport functools\n\ndef retry(max_attempts, delay_seconds=1):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            # your code here\n            pass\n        return wrapper\n    return decorator"}'::jsonb,
  '{"python3": "import time\nimport functools\n\ndef retry(max_attempts, delay_seconds=1):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            last_exc = None\n            for attempt in range(max_attempts):\n                try:\n                    return fn(*args, **kwargs)\n                except Exception as e:\n                    last_exc = e\n                    if attempt < max_attempts - 1:\n                        time.sleep(delay_seconds)\n            raise last_exc\n        return wrapper\n    return decorator"}'::jsonb,
  '[{"input":"function that fails 2 times then succeeds, max_attempts=3","expected":"returns successfully on 3rd attempt","hidden":false},{"input":"function that always fails, max_attempts=2","expected":"raises exception after 2 attempts","hidden":false}]'::jsonb,
  ARRAY['python','decorators','error-handling','backend']
),
(
  'bbbbbbbb-0001-0001-0001-000000000007',
  'Document Chunker',
  'Python',
  'medium',
  'Write a function `chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]` that splits a long string into overlapping chunks of at most `chunk_size` characters, with `overlap` characters shared between consecutive chunks. This is a common pattern in RAG pipelines.',
  '{"python3": "def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:\n    # your code here\n    pass"}'::jsonb,
  '{"python3": "def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:\n    if chunk_size <= overlap:\n        raise ValueError(\"chunk_size must be greater than overlap\")\n    chunks = []\n    start = 0\n    while start < len(text):\n        end = min(start + chunk_size, len(text))\n        chunks.append(text[start:end])\n        if end == len(text):\n            break\n        start += chunk_size - overlap\n    return chunks"}'::jsonb,
  '[{"input":"text=''abcdefghij'', chunk_size=4, overlap=1","expected":"[''abcd'',''defg'',''ghij'']","hidden":false},{"input":"empty string","expected":"[]","hidden":true}]'::jsonb,
  ARRAY['python','nlp','rag','ai-engineer']
),
(
  'bbbbbbbb-0001-0001-0001-000000000008',
  'Pydantic Model with Validators',
  'Python',
  'easy',
  'Define a Pydantic v2 model `JobApplication` with fields: `name` (str, min_length=2), `email` (EmailStr), `experience_years` (int, ≥ 0), and `skills` (list[str], at least 1 item). Add a validator that normalises all skill strings to lowercase.',
  '{"python3": "from pydantic import BaseModel, field_validator, EmailStr\nfrom typing import List\n\nclass JobApplication(BaseModel):\n    name: str\n    email: EmailStr\n    experience_years: int\n    skills: List[str]\n\n    # add validators here"}'::jsonb,
  '{"python3": "from pydantic import BaseModel, field_validator, EmailStr, Field\nfrom typing import List\n\nclass JobApplication(BaseModel):\n    name: str = Field(min_length=2)\n    email: EmailStr\n    experience_years: int = Field(ge=0)\n    skills: List[str] = Field(min_length=1)\n\n    @field_validator(''skills'')\n    @classmethod\n    def normalise_skills(cls, v):\n        return [s.lower().strip() for s in v]"}'::jsonb,
  '[{"input":"valid application","expected":"model instantiates correctly","hidden":false},{"input":"experience_years=-1","expected":"ValidationError raised","hidden":false},{"input":"skills=[]","expected":"ValidationError raised","hidden":true}]'::jsonb,
  ARRAY['python','pydantic','validation','fastapi']
),

-- ── Algorithms ───────────────────────────────────────────────────────────────
(
  'bbbbbbbb-0001-0001-0001-000000000009',
  'Two Sum',
  'Algorithms',
  'easy',
  'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume exactly one solution exists and you may not use the same element twice.',
  '{"python3": "def two_sum(nums, target):\n    # your code here\n    pass", "nodejs": "function twoSum(nums, target) {\n  // your code here\n}\nmodule.exports = twoSum;", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code here\n    }\n}"}'::jsonb,
  '{"python3": "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i"}'::jsonb,
  '[{"input":"nums=[2,7,11,15], target=9","expected":"[0,1]","hidden":false},{"input":"nums=[3,2,4], target=6","expected":"[1,2]","hidden":false},{"input":"nums=[3,3], target=6","expected":"[0,1]","hidden":true}]'::jsonb,
  ARRAY['algorithms','hash-map','arrays','leetcode']
),
(
  'bbbbbbbb-0001-0001-0001-000000000010',
  'Sliding Window Maximum',
  'Algorithms',
  'hard',
  'Given an array `nums` and integer `k`, return an array of the maximum value in each sliding window of size `k`.',
  '{"python3": "from collections import deque\n\ndef max_sliding_window(nums, k):\n    # your code here\n    pass", "nodejs": "function maxSlidingWindow(nums, k) {\n  // your code here\n}\nmodule.exports = maxSlidingWindow;"}'::jsonb,
  '{"python3": "from collections import deque\n\ndef max_sliding_window(nums, k):\n    dq, result = deque(), []\n    for i, n in enumerate(nums):\n        while dq and nums[dq[-1]] <= n:\n            dq.pop()\n        dq.append(i)\n        if dq[0] == i - k:\n            dq.popleft()\n        if i >= k - 1:\n            result.append(nums[dq[0]])\n    return result"}'::jsonb,
  '[{"input":"nums=[1,3,-1,-3,5,3,6,7], k=3","expected":"[3,3,5,5,6,7]","hidden":false},{"input":"nums=[1], k=1","expected":"[1]","hidden":true}]'::jsonb,
  ARRAY['algorithms','sliding-window','deque','hard']
),
(
  'bbbbbbbb-0001-0001-0001-000000000011',
  'LRU Cache',
  'Data Structures',
  'hard',
  'Implement an LRU (Least Recently Used) cache with `get(key)` and `put(key, value)` operations, both O(1). The cache has a fixed capacity; when full, evict the least recently used entry.',
  '{"python3": "class LRUCache:\n    def __init__(self, capacity: int):\n        # your code here\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass", "nodejs": "class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}\nmodule.exports = LRUCache;"}'::jsonb,
  '{"python3": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.cache = OrderedDict()\n    def get(self, key):\n        if key not in self.cache: return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key, value):\n        if key in self.cache: self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.cap:\n            self.cache.popitem(last=False)"}'::jsonb,
  '[{"input":"capacity=2, put(1,1), put(2,2), get(1)=1, put(3,3), get(2)=-1","expected":"get(2) returns -1 (evicted)","hidden":false}]'::jsonb,
  ARRAY['data-structures','lru','linked-list','hash-map']
),
(
  'bbbbbbbb-0001-0001-0001-000000000012',
  'React Component: Infinite Scroll',
  'React',
  'medium',
  'Implement a React hook `useInfiniteScroll(fetchFn, options)` that detects when the user scrolls near the bottom of a container (using IntersectionObserver) and calls `fetchFn` to load the next page. Handle loading and error states.',
  '{"javascript": "import { useState, useEffect, useRef } from ''react'';\n\nexport function useInfiniteScroll(fetchFn, options = {}) {\n  // your code here\n}"}'::jsonb,
  '{"javascript": "import { useState, useEffect, useRef, useCallback } from ''react'';\n\nexport function useInfiniteScroll(fetchFn, { threshold = 0.1 } = {}) {\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState(null);\n  const sentinelRef = useRef(null);\n\n  const load = useCallback(async () => {\n    if (loading) return;\n    setLoading(true);\n    try { await fetchFn(); } catch(e) { setError(e); } finally { setLoading(false); }\n  }, [fetchFn, loading]);\n\n  useEffect(() => {\n    const observer = new IntersectionObserver(([entry]) => {\n      if (entry.isIntersecting) load();\n    }, { threshold });\n    if (sentinelRef.current) observer.observe(sentinelRef.current);\n    return () => observer.disconnect();\n  }, [load, threshold]);\n\n  return { sentinelRef, loading, error };\n}"}'::jsonb,
  '[{"input":"scroll to bottom of container","expected":"fetchFn is called","hidden":false},{"input":"fetchFn rejects","expected":"error state is set","hidden":false}]'::jsonb,
  ARRAY['react','hooks','intersection-observer','frontend']
);

-- =============================================================================
-- SECTION 5 · ASSESSMENTS  (2 assessments for the 2 assessed jobs)
-- =============================================================================

INSERT INTO public.assessments (id, company_id, created_by, name, assessment_type,
  time_limit_minutes, difficulty, passing_score, questions, settings, status)
VALUES
-- Assessment 1: Full Stack Engineer Test (mixed MCQ + coding)
(
  'cccccccc-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Senior Full Stack Engineer — Screening Test',
  'mixed',
  60,
  'medium',
  65,
  '[
    {
      "id": "q1", "type": "mcq", "order": 1, "points": 10,
      "question": "Which Next.js data-fetching method runs at request time and enables per-request server-side rendering?",
      "options": ["getStaticProps","getServerSideProps","getInitialProps","getStaticPaths"],
      "correct_answer": "getServerSideProps",
      "explanation": "getServerSideProps runs on every request, enabling dynamic SSR. getStaticProps runs at build time."
    },
    {
      "id": "q2", "type": "mcq", "order": 2, "points": 10,
      "question": "In a REST API, which HTTP method is idempotent but NOT safe (it modifies server state)?",
      "options": ["GET","PUT","POST","DELETE"],
      "correct_answer": "PUT",
      "explanation": "PUT is idempotent (same result on repeated calls) but modifies state. GET is both safe and idempotent. POST is neither."
    },
    {
      "id": "q3", "type": "mcq", "order": 3, "points": 10,
      "question": "What does the PostgreSQL EXPLAIN ANALYZE output ''Seq Scan'' indicate?",
      "options": ["A cache hit","A full table scan — no index used","An index range scan","A parallel query plan"],
      "correct_answer": "A full table scan — no index used",
      "explanation": "Seq Scan means Postgres is reading every row. Add an index to convert this to an Index Scan for large tables."
    },
    {
      "id": "q4", "type": "mcq", "order": 4, "points": 10,
      "question": "In JavaScript, what will `console.log(typeof null)` output?",
      "options": ["''null''","''undefined''","''object''","''boolean''"],
      "correct_answer": "''object''",
      "explanation": "A historical bug in JS — typeof null === ''object''. Use === null for null checks."
    },
    {
      "id": "q5", "type": "mcq", "order": 5, "points": 10,
      "question": "Which React hook should you use to run a side effect ONLY when a specific prop changes?",
      "options": ["useState","useCallback","useEffect with a dependency array","useMemo"],
      "correct_answer": "useEffect with a dependency array",
      "explanation": "useEffect(() => { ... }, [specificProp]) runs the effect only when specificProp changes."
    },
    {
      "id": "q6", "type": "coding", "order": 6, "points": 25, "question_bank_id": "bbbbbbbb-0001-0001-0001-000000000001",
      "title": "Implement Debounce",
      "prompt": "Write a debounce(fn, delay) function that returns a debounced version of fn. The debounced function delays invoking fn until after delay milliseconds have elapsed since the last invocation.",
      "starter_code": {"nodejs": "function debounce(fn, delay) {\n  // your code here\n}\nmodule.exports = debounce;"},
      "test_cases": [{"input": "called 3x in 100ms with 200ms delay", "expected": "fn called once", "hidden": false}]
    },
    {
      "id": "q7", "type": "coding", "order": 7, "points": 25, "question_bank_id": "bbbbbbbb-0001-0001-0001-000000000004",
      "title": "SQL Query with CTE",
      "prompt": "Given a table orders(id, user_id, amount, created_at), write a SQL query using a CTE to find the top 3 users by total spend, along with order count and average order value.",
      "starter_code": {"sql": "-- Write your query\nWITH user_stats AS (\n  \n)\nSELECT ...\nFROM user_stats\nORDER BY ...\nLIMIT 3;"},
      "test_cases": [{"input": "orders table with 10 users", "expected": "3 rows by total_spend DESC", "hidden": false}]
    }
  ]'::jsonb,
  '{"shuffle_questions": false, "show_score_immediately": false, "allow_tab_switch": false, "proctoring_enabled": true, "max_tab_switches": 3}'::jsonb,
  'active'
),
-- Assessment 2: AI Engineer Python Test (coding only)
(
  'cccccccc-0001-0001-0001-000000000002',
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'AI Engineer (Python/FastAPI) — Technical Screen',
  'coding_test',
  75,
  'hard',
  70,
  '[
    {
      "id": "q1", "type": "coding", "order": 1, "points": 33, "question_bank_id": "bbbbbbbb-0001-0001-0001-000000000006",
      "title": "Retry Decorator",
      "prompt": "Implement a @retry(max_attempts, delay_seconds) decorator that retries the decorated function up to max_attempts times on any exception, waiting delay_seconds between attempts. Raise the last exception if all attempts fail.",
      "starter_code": {"python3": "import time\nimport functools\n\ndef retry(max_attempts, delay_seconds=1):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            # your code here\n            pass\n        return wrapper\n    return decorator"},
      "test_cases": [
        {"input": "function fails 2x then succeeds, max_attempts=3", "expected": "returns on 3rd attempt", "hidden": false},
        {"input": "always fails, max_attempts=2", "expected": "raises after 2 attempts", "hidden": false}
      ]
    },
    {
      "id": "q2", "type": "coding", "order": 2, "points": 33, "question_bank_id": "bbbbbbbb-0001-0001-0001-000000000007",
      "title": "Document Chunker",
      "prompt": "Write chunk_text(text, chunk_size, overlap) that splits a string into overlapping chunks. Common in RAG pipelines for LLM context windows.",
      "starter_code": {"python3": "def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:\n    pass"},
      "test_cases": [
        {"input": "text=''abcdefghij'', chunk_size=4, overlap=1", "expected": "[''abcd'',''defg'',''ghij'']", "hidden": false},
        {"input": "empty string", "expected": "[]", "hidden": true}
      ]
    },
    {
      "id": "q3", "type": "coding", "order": 3, "points": 34, "question_bank_id": "bbbbbbbb-0001-0001-0001-000000000008",
      "title": "Pydantic Model with Validators",
      "prompt": "Define a Pydantic v2 model JobApplication with fields: name (min_length=2), email (EmailStr), experience_years (int ≥ 0), skills (list[str], ≥ 1 item). Add a validator to normalise skills to lowercase.",
      "starter_code": {"python3": "from pydantic import BaseModel, field_validator, EmailStr\nfrom typing import List\n\nclass JobApplication(BaseModel):\n    name: str\n    email: EmailStr\n    experience_years: int\n    skills: List[str]\n    # add validators"},
      "test_cases": [
        {"input": "valid application", "expected": "model instantiates", "hidden": false},
        {"input": "experience_years=-1", "expected": "ValidationError", "hidden": false}
      ]
    }
  ]'::jsonb,
  '{"shuffle_questions": false, "show_score_immediately": false, "allow_tab_switch": false, "proctoring_enabled": true, "max_tab_switches": 2}'::jsonb,
  'active'
);

-- Batch 2 complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 6 · JOB POSTS  (3 active jobs at Cognizant)
-- Pass 1: Insert with assessment_id = NULL to avoid circular FK
-- Pass 2: UPDATE to link assessments after insert
-- =============================================================================

INSERT INTO public.job_posts (
  id, company_id, created_by, title, department, location, is_remote, work_mode,
  job_type, experience_min, experience_max, salary_min, salary_max, salary_currency,
  salary_visible, description, required_skills, nice_to_have_skills,
  screening_questions, openings_count, application_deadline, interview_plan,
  assessment_config, status, auto_advance_threshold, auto_reject_threshold,
  pipeline_stages, assessment_id
)
VALUES

-- ── Job 1: Senior Full Stack Engineer (Next.js / Node.js) ────────────────────
(
  'dddddddd-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Senior Full Stack Engineer (Next.js/Node.js)',
  'Engineering',
  'Bengaluru, Karnataka',
  true,
  'hybrid',
  'fulltime',
  4, 8,
  2000000, 3500000,
  'INR', true,
  'We are looking for a Senior Full Stack Engineer to join our growing product engineering team. You will own end-to-end features across our Next.js frontend and Node.js / PostgreSQL backend, contribute to architectural decisions, and mentor junior engineers.

Responsibilities:
• Design and build full-stack features using Next.js 14 App Router and Node.js microservices
• Architect and optimise PostgreSQL schemas, queries, and indexes for scale
• Implement real-time features using WebSockets and Supabase Realtime
• Lead code reviews and establish engineering best practices
• Collaborate with product and design to ship high-quality user experiences

Tech Stack: Next.js 14, React 18, TypeScript, Node.js, Express, PostgreSQL, Redis, Docker, AWS',
  ARRAY['Next.js','React','TypeScript','Node.js','PostgreSQL','REST APIs','Git'],
  ARRAY['Redis','Docker','AWS','WebSockets','GraphQL','Supabase'],
  '[
    {"id":"sq1","question":"Briefly describe your experience with Next.js App Router and server components. What trade-offs have you navigated?","type":"text","required":true},
    {"id":"sq2","question":"Have you optimised a slow PostgreSQL query? Walk us through your approach.","type":"text","required":true},
    {"id":"sq3","question":"What is your expected CTC (in LPA)?","type":"text","required":true}
  ]'::jsonb,
  3,
  NOW() + INTERVAL '45 days',
  '[
    {"round":1,"name":"AI Screening","type":"ai_screen","duration_minutes":null},
    {"round":2,"name":"Technical Assessment","type":"assessment","duration_minutes":60},
    {"round":3,"name":"AI Video Interview","type":"ai_interview","duration_minutes":45},
    {"round":4,"name":"Technical Deep-Dive","type":"human_interview","interview_type":"technical","duration_minutes":60},
    {"round":5,"name":"Hiring Manager Chat","type":"human_interview","interview_type":"hiring_manager","duration_minutes":30}
  ]'::jsonb,
  '{"enabled":true,"assessment_id":"cccccccc-0001-0001-0001-000000000001","passing_score":65}'::jsonb,
  'active',
  75, 30,
  ARRAY['applied','ai_screened','assessment_pending','assessment_completed','ai_interview_pending','ai_interviewed','human_interview','offer','hired'],
  NULL  -- linked in Pass 2
),

-- ── Job 2: AI Engineer (Python / FastAPI) ───────────────────────────────────
(
  'dddddddd-0001-0001-0001-000000000002',
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'AI Engineer (Python/FastAPI)',
  'AI Platform',
  'Hyderabad, Telangana',
  true,
  'hybrid',
  'fulltime',
  3, 7,
  2200000, 4000000,
  'INR', true,
  'Join Cognizant''s AI Platform team to build production-grade AI features. You will implement LLM-powered pipelines, design FastAPI services, and ship real AI products that our enterprise clients depend on daily.

Responsibilities:
• Build and maintain Python/FastAPI microservices for AI features (screening, summarisation, interview analysis)
• Design and optimise RAG pipelines using LangChain, vector databases, and Gemini/OpenAI APIs
• Integrate LLMs into production workflows with robust retry logic, caching, and monitoring
• Write clean, well-tested Python with strong typing (Pydantic v2)
• Collaborate with the ML team on model evaluation and prompt engineering

Tech Stack: Python 3.12, FastAPI, LangChain, PyTorch, Gemini API, PostgreSQL (pgvector), Docker, GCP',
  ARRAY['Python','FastAPI','LangChain','PostgreSQL','REST APIs','Docker','Pydantic'],
  ARRAY['PyTorch','Gemini API','OpenAI API','pgvector','GCP','Kubernetes','Celery'],
  '[
    {"id":"sq1","question":"Describe an LLM-powered feature you built end-to-end. What was the hardest engineering challenge?","type":"text","required":true},
    {"id":"sq2","question":"How do you handle LLM hallucinations or unreliable outputs in a production system?","type":"text","required":true},
    {"id":"sq3","question":"What is your expected CTC (in LPA)?","type":"text","required":true}
  ]'::jsonb,
  2,
  NOW() + INTERVAL '30 days',
  '[
    {"round":1,"name":"AI Screening","type":"ai_screen","duration_minutes":null},
    {"round":2,"name":"Python Technical Test","type":"assessment","duration_minutes":75},
    {"round":3,"name":"AI Video Interview","type":"ai_interview","duration_minutes":45},
    {"round":4,"name":"System Design — AI Infra","type":"human_interview","interview_type":"technical","duration_minutes":60},
    {"round":5,"name":"Hiring Manager","type":"human_interview","interview_type":"hiring_manager","duration_minutes":30}
  ]'::jsonb,
  '{"enabled":true,"assessment_id":"cccccccc-0001-0001-0001-000000000002","passing_score":70}'::jsonb,
  'active',
  78, 30,
  ARRAY['applied','ai_screened','assessment_pending','assessment_completed','ai_interview_pending','ai_interviewed','human_interview','offer','hired'],
  NULL  -- linked in Pass 2
),

-- ── Job 3: Frontend Developer (React) ───────────────────────────────────────
(
  'dddddddd-0001-0001-0001-000000000003',
  'aaaaaaaa-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Frontend Developer (React)',
  'Product Engineering',
  'Bengaluru, Karnataka',
  false,
  'onsite',
  'fulltime',
  2, 5,
  1400000, 2400000,
  'INR', true,
  'We are hiring a Frontend Developer to build pixel-perfect, performant UIs for our enterprise SaaS products. You will work closely with designers (Figma) and backend engineers to deliver exceptional user experiences.

Responsibilities:
• Build responsive, accessible React components with TypeScript and Tailwind CSS
• Integrate with RESTful APIs and real-time data sources
• Translate Figma designs to production-grade React code
• Write unit and integration tests (Jest, React Testing Library)
• Participate in design reviews and contribute to our component library

Tech Stack: React 18, TypeScript, Tailwind CSS, React Query, Zustand, Vite, Jest',
  ARRAY['React','TypeScript','Tailwind CSS','REST APIs','Git','HTML','CSS'],
  ARRAY['Next.js','Figma','React Query','Zustand','Storybook','Playwright'],
  '[
    {"id":"sq1","question":"Share a complex UI component you are most proud of. What made it challenging?","type":"text","required":true},
    {"id":"sq2","question":"How do you approach accessibility (a11y) in your React components?","type":"text","required":false},
    {"id":"sq3","question":"What is your expected CTC (in LPA)?","type":"text","required":true}
  ]'::jsonb,
  2,
  NOW() + INTERVAL '60 days',
  '[
    {"round":1,"name":"AI Screening","type":"ai_screen","duration_minutes":null},
    {"round":2,"name":"AI Video Interview","type":"ai_interview","duration_minutes":40},
    {"round":3,"name":"Frontend Technical Round","type":"human_interview","interview_type":"technical","duration_minutes":60},
    {"round":4,"name":"Culture Fit","type":"human_interview","interview_type":"culture_fit","duration_minutes":30}
  ]'::jsonb,
  '{}'::jsonb,
  'active',
  72, 25,
  ARRAY['applied','ai_screened','assessment_pending','assessment_completed','ai_interview_pending','ai_interviewed','human_interview','offer','hired'],
  NULL  -- no assessment for this job
);

-- ── Pass 2: link assessments to jobs that require them ──────────────────────
UPDATE public.job_posts
SET assessment_id = 'cccccccc-0001-0001-0001-000000000001'
WHERE id = 'dddddddd-0001-0001-0001-000000000001';

UPDATE public.job_posts
SET assessment_id = 'cccccccc-0001-0001-0001-000000000002'
WHERE id = 'dddddddd-0001-0001-0001-000000000002';
-- Job 3 (Frontend) intentionally has no assessment

-- =============================================================================
-- SECTION 7 · INTERVIEW PANELS  (2 panels for Cognizant)
-- =============================================================================

INSERT INTO public.interview_panels (id, company_id, name, interview_type,
  default_interviewer_ids, round_number, duration_minutes, description, is_active)
VALUES
(
  'eeeeeeee-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Engineering Technical Panel',
  'technical',
  ARRAY[(SELECT id FROM public.users WHERE email = :'employer_email')]::uuid[],
  1, 60,
  'Standard technical interview panel for engineering roles. Covers DSA, system design, and tech stack deep-dives.',
  true
),
(
  'eeeeeeee-0001-0001-0001-000000000002',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Culture Fit & HR Round',
  'culture_fit',
  ARRAY[(SELECT id FROM public.users WHERE email = :'employer_email')]::uuid[],
  2, 30,
  'Behavioural and culture-fit interview. STAR method questions on ownership, collaboration, and growth mindset.',
  true
);

-- Batch 3 complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 8 · APPLICANTS  (51 total — 17 per job)
--
-- Pipeline stage spread per job (17 applicants):
--   applied(4), ai_screened(3), assessment_pending(2), assessment_completed(2),
--   ai_interview_pending(2), ai_interviewed(2), human_interview(1), offer(1)
--
-- Columns populated:
--   name, email, phone, role_title, current_company, experience,
--   source, pipeline_stage, bucket,
--   screening_score, screening_breakdown, screening_summary,
--   resume_parsed_json (tech-stack-specific), screening_responses
-- =============================================================================

INSERT INTO public.applicants (
  id, job_post_id, name, email, phone, role_title, current_company,
  experience, source, pipeline_stage, bucket,
  screening_score, screening_breakdown, screening_summary,
  resume_parsed_json, screening_responses
)
VALUES

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB 1 · Senior Full Stack Engineer (Next.js/Node.js)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── applied (4) ─────────────────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000001',
  'Rahul Mehta', 'rahul.mehta@gmail.com', '+91-9876543201',
  'Software Engineer', 'Infosys', 3, 'fitvector_organic', 'applied', 'potential_fit',
  52,
  '{"skills":18,"experience":15,"education":10,"role_match":9}'::jsonb,
  'Entry-level full stack background. Knows React but limited Next.js production experience. Worth screening.',
  '{"name":"Rahul Mehta","email":"rahul.mehta@gmail.com","experience_years":3,"current_role":"Software Engineer","current_company":"Infosys","skills":["React","JavaScript","Node.js","MySQL","HTML","CSS"],"education":[{"degree":"B.Tech Computer Science","institution":"VIT Vellore","year":2021}],"work_history":[{"company":"Infosys","role":"Software Engineer","duration":"2021-present","highlights":["Built React dashboards for insurance clients","Integrated REST APIs","Wrote unit tests with Jest"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I have 1 year of React experience but just started learning Next.js through personal projects."},{"question_id":"sq2","answer":"I added an index on a MySQL table that sped up a query from 3s to 200ms."},{"question_id":"sq3","answer":"12 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000002',
  'dddddddd-0001-0001-0001-000000000001',
  'Sonal Kapoor', 'sonal.kapoor@outlook.com', '+91-9876543202',
  'Junior Developer', 'Wipro', 2, 'external_link', 'applied', 'weak_fit',
  38,
  '{"skills":10,"experience":8,"education":12,"role_match":8}'::jsonb,
  'Too junior. 2 years mostly HTML/CSS work. Does not meet the 4-year experience minimum.',
  '{"name":"Sonal Kapoor","email":"sonal.kapoor@outlook.com","experience_years":2,"current_role":"Junior Developer","current_company":"Wipro","skills":["HTML","CSS","JavaScript","jQuery"],"education":[{"degree":"BCA","institution":"Pune University","year":2022}],"work_history":[{"company":"Wipro","role":"Junior Developer","duration":"2022-present","highlights":["Maintained legacy jQuery web pages","Built HTML email templates"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I mostly work on the frontend with HTML and CSS. I am learning React."},{"question_id":"sq2","answer":"I have not worked with PostgreSQL yet."},{"question_id":"sq3","answer":"9 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000003',
  'dddddddd-0001-0001-0001-000000000001',
  'Aditya Sharma', 'aditya.sharma@yahoo.com', '+91-9876543203',
  'Full Stack Developer', 'TCS', 5, 'referral', 'applied', 'good_fit',
  71,
  '{"skills":26,"experience":20,"education":12,"role_match":13}'::jsonb,
  'Strong full stack profile. 5 years at TCS with Next.js and PostgreSQL. Good fit for senior role.',
  '{"name":"Aditya Sharma","email":"aditya.sharma@yahoo.com","experience_years":5,"current_role":"Full Stack Developer","current_company":"TCS","skills":["Next.js","React","Node.js","TypeScript","PostgreSQL","Redis","Docker"],"education":[{"degree":"B.E. Computer Engineering","institution":"BITS Pilani","year":2019}],"work_history":[{"company":"TCS","role":"Full Stack Developer","duration":"2019-present","highlights":["Led migration of monolith to Next.js + Node.js microservices","Optimised PostgreSQL queries reducing p95 latency by 60%","Mentored 3 junior developers"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I have been working with Next.js for 3 years. I migrated our main product from CRA to Next.js App Router last year and led the server components adoption."},{"question_id":"sq2","answer":"Yes — I found a missing composite index on (user_id, created_at) in our orders table. Added the index and query time dropped from 800ms to 12ms."},{"question_id":"sq3","answer":"28 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000004',
  'dddddddd-0001-0001-0001-000000000001',
  'Priya Nair', 'priya.nair@gmail.com', '+91-9876543204',
  'Software Engineer II', 'HCL Technologies', 4, 'fitvector_organic', 'applied', 'potential_fit',
  60,
  '{"skills":22,"experience":16,"education":12,"role_match":10}'::jsonb,
  'Decent profile. React and Node.js solid. Next.js exposure is limited to side projects. Could grow into the role.',
  '{"name":"Priya Nair","email":"priya.nair@gmail.com","experience_years":4,"current_role":"Software Engineer II","current_company":"HCL Technologies","skills":["React","Node.js","TypeScript","MongoDB","AWS","Jest"],"education":[{"degree":"B.Tech IT","institution":"NIT Trichy","year":2020}],"work_history":[{"company":"HCL Technologies","role":"Software Engineer","duration":"2020-2022","highlights":["Built React SPAs for BFSI clients"]},{"company":"HCL Technologies","role":"Software Engineer II","duration":"2022-present","highlights":["Designed REST APIs in Node.js + Express","Deployed services on AWS EC2"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I have used Next.js in personal projects but not in production yet. My production work has been in React with Node.js backends."},{"question_id":"sq2","answer":"I added an index on MongoDB collection which sped up aggregation pipeline significantly."},{"question_id":"sq3","answer":"20 LPA"}]'::jsonb
),

-- ── ai_screened (3) ─────────────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000005',
  'dddddddd-0001-0001-0001-000000000001',
  'Vikram Patel', 'vikram.patel@gmail.com', '+91-9876543205',
  'Senior Software Engineer', 'Mindtree', 6, 'fitvector_organic', 'ai_screened', 'strong_fit',
  87,
  '{"skills":32,"experience":24,"education":14,"role_match":17}'::jsonb,
  'Excellent match. 6 years with heavy Next.js and Node.js. Led 4-person team at Mindtree. Strong SQL and Redis experience. Recommend advancing to assessment.',
  '{"name":"Vikram Patel","email":"vikram.patel@gmail.com","experience_years":6,"current_role":"Senior Software Engineer","current_company":"Mindtree","skills":["Next.js","React","Node.js","TypeScript","PostgreSQL","Redis","Docker","Kubernetes","GraphQL"],"education":[{"degree":"B.Tech CSE","institution":"IIT Bombay","year":2018}],"work_history":[{"company":"Mindtree","role":"Software Engineer","duration":"2018-2020","highlights":["Built React SPAs"]},{"company":"Mindtree","role":"Senior Software Engineer","duration":"2020-present","highlights":["Led migration to Next.js 13 App Router","Designed Redis caching layer reducing DB load by 40%","Architected GraphQL API layer"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"3 years of Next.js in production. We moved to App Router in Q1 2023. Key trade-off was deciding which components to keep as client components for interactivity."},{"question_id":"sq2","answer":"Found N+1 query issue in our ORM. Rewrote with explicit JOINs and added a materialized view. Cut the page load from 4s to 300ms."},{"question_id":"sq3","answer":"35 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000006',
  'dddddddd-0001-0001-0001-000000000001',
  'Neha Joshi', 'neha.joshi@gmail.com', '+91-9876543206',
  'Full Stack Engineer', 'Persistent Systems', 5, 'fitvector_organic', 'ai_screened', 'good_fit',
  74,
  '{"skills":27,"experience":20,"education":14,"role_match":13}'::jsonb,
  'Good fit. Strong TypeScript and Next.js. PostgreSQL experience solid. Salary expectation within budget.',
  '{"name":"Neha Joshi","email":"neha.joshi@gmail.com","experience_years":5,"current_role":"Full Stack Engineer","current_company":"Persistent Systems","skills":["Next.js","TypeScript","React","PostgreSQL","Node.js","AWS","Tailwind CSS"],"education":[{"degree":"M.Tech CSE","institution":"IIIT Hyderabad","year":2019}],"work_history":[{"company":"Persistent Systems","role":"Software Engineer","duration":"2019-2021","highlights":["React + Node.js SaaS products"]},{"company":"Persistent Systems","role":"Full Stack Engineer","duration":"2021-present","highlights":["Built Next.js 14 application from scratch","Set up CI/CD with GitHub Actions","Optimised Postgres queries with EXPLAIN ANALYZE"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Started using Next.js App Router in production 18 months ago. Main trade-off I navigated was streaming with Suspense vs. traditional loading states."},{"question_id":"sq2","answer":"Used EXPLAIN ANALYZE and found a sequential scan on a 2M row table. Added a partial index and query went from 2s to 50ms."},{"question_id":"sq3","answer":"26 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000007',
  'dddddddd-0001-0001-0001-000000000001',
  'Rohit Desai', 'rohit.desai@outlook.com', '+91-9876543207',
  'Software Developer', 'Hexaware', 4, 'external_link', 'ai_screened', 'potential_fit',
  61,
  '{"skills":21,"experience":16,"education":12,"role_match":12}'::jsonb,
  'Moderate fit. Knows React and Node but Next.js is self-taught. PostgreSQL limited. May need upskilling.',
  '{"name":"Rohit Desai","email":"rohit.desai@outlook.com","experience_years":4,"current_role":"Software Developer","current_company":"Hexaware","skills":["React","Node.js","JavaScript","MySQL","Express","Bootstrap"],"education":[{"degree":"B.E. IT","institution":"Mumbai University","year":2020}],"work_history":[{"company":"Hexaware","role":"Software Developer","duration":"2020-present","highlights":["React + Express CRUD apps","REST API integration for banking clients","MySQL query writing"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I have been learning Next.js through online courses and built a portfolio project with it."},{"question_id":"sq2","answer":"I mostly work with MySQL. I added indexes a few times but haven''t used EXPLAIN ANALYZE formally."},{"question_id":"sq3","answer":"18 LPA"}]'::jsonb
),

-- ── assessment_pending (2) ───────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000008',
  'dddddddd-0001-0001-0001-000000000001',
  'Ananya Singh', 'ananya.singh@gmail.com', '+91-9876543208',
  'Software Engineer III', 'Zensar Technologies', 6, 'fitvector_organic', 'assessment_pending', 'strong_fit',
  83,
  '{"skills":30,"experience":23,"education":15,"role_match":15}'::jsonb,
  'Strong profile. Next.js + Node.js expert. Postgres performance tuning experience. Assessment invite sent.',
  '{"name":"Ananya Singh","email":"ananya.singh@gmail.com","experience_years":6,"current_role":"Software Engineer III","current_company":"Zensar Technologies","skills":["Next.js","React","Node.js","TypeScript","PostgreSQL","Redis","AWS","Docker","WebSockets"],"education":[{"degree":"B.Tech CSE","institution":"NSIT Delhi","year":2018}],"work_history":[{"company":"Zensar Technologies","role":"Software Engineer","duration":"2018-2021","highlights":["Built real-time dashboards with WebSockets","Node.js REST APIs"]},{"company":"Zensar Technologies","role":"Software Engineer III","duration":"2021-present","highlights":["Led Next.js migration","Implemented Redis caching","PostgreSQL schema design for 50M+ rows"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Led App Router migration for our main product. Key trade-off: client vs server components for data-heavy pages. We keep client components only for interactive widgets."},{"question_id":"sq2","answer":"Identified slow JSONB query, rewrote with GIN index. Performance went from 3.2s to 80ms on 50M rows."},{"question_id":"sq3","answer":"32 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000009',
  'dddddddd-0001-0001-0001-000000000001',
  'Karthik Iyer', 'karthik.iyer@gmail.com', '+91-9876543209',
  'Technical Lead', 'Mphasis', 7, 'referral', 'assessment_pending', 'strong_fit',
  89,
  '{"skills":33,"experience":26,"education":15,"role_match":15}'::jsonb,
  'Excellent — Tech Lead with 7 years. Strong Next.js, Node.js, and PostgreSQL. AWS certified. Assessment invite sent.',
  '{"name":"Karthik Iyer","email":"karthik.iyer@gmail.com","experience_years":7,"current_role":"Technical Lead","current_company":"Mphasis","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Redis","AWS","Docker","GraphQL","Kubernetes"],"education":[{"degree":"B.Tech CSE","institution":"IIT Madras","year":2017}],"work_history":[{"company":"Mphasis","role":"Software Engineer","duration":"2017-2020","highlights":["React + Node.js products"]},{"company":"Mphasis","role":"Senior Engineer","duration":"2020-2022","highlights":["Architected microservices","Postgres replication setup"]},{"company":"Mphasis","role":"Technical Lead","duration":"2022-present","highlights":["Leading 8-person team","Next.js App Router adoption","AWS cost optimisation — saved 30% monthly spend"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"2+ years with App Router in production. Trade-off: caching behavior differs per page type. We use dynamic() to opt out of static generation for personalised pages."},{"question_id":"sq2","answer":"Added a covering index + rewrote query using lateral joins on a 100M row table. Latency dropped from 8s to 400ms."},{"question_id":"sq3","answer":"42 LPA"}]'::jsonb
),

-- ── assessment_completed (2) ─────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000010',
  'dddddddd-0001-0001-0001-000000000001',
  'Divya Menon', 'divya.menon@gmail.com', '+91-9876543210',
  'Full Stack Engineer', 'L&T Technology Services', 5, 'fitvector_organic', 'assessment_completed', 'strong_fit',
  80,
  '{"skills":29,"experience":20,"education":14,"role_match":17}'::jsonb,
  'Very strong. Next.js + Postgres expert. Assessment score 78 — above passing threshold. Advance to AI interview.',
  '{"name":"Divya Menon","email":"divya.menon@gmail.com","experience_years":5,"current_role":"Full Stack Engineer","current_company":"L&T Technology Services","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Docker","Tailwind CSS","Jest"],"education":[{"degree":"B.Tech CSE","institution":"RVCE Bengaluru","year":2019}],"work_history":[{"company":"L&T Technology Services","role":"Developer","duration":"2019-2021","highlights":["React SPAs for manufacturing clients"]},{"company":"L&T Technology Services","role":"Full Stack Engineer","duration":"2021-present","highlights":["Built Next.js 14 product from 0→1","PostgreSQL performance tuning","CI/CD with GitHub Actions + Docker"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a Next.js 14 app from scratch. Used server actions for form handling — much cleaner than API routes for simple mutations."},{"question_id":"sq2","answer":"Used EXPLAIN ANALYZE. Found hash join on large tables. Added index and rewrote with explicit JOIN ORDER hint."},{"question_id":"sq3","answer":"27 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000011',
  'dddddddd-0001-0001-0001-000000000001',
  'Suresh Kumar', 'suresh.kumar@gmail.com', '+91-9876543211',
  'Senior Developer', 'Sasken Technologies', 5, 'external_link', 'assessment_completed', 'good_fit',
  67,
  '{"skills":24,"experience":19,"education":12,"role_match":12}'::jsonb,
  'Good fit. Assessment score 69 — marginal pass. Node.js strong but Next.js gaps visible in answers. Consider advancing.',
  '{"name":"Suresh Kumar","email":"suresh.kumar@gmail.com","experience_years":5,"current_role":"Senior Developer","current_company":"Sasken Technologies","skills":["React","Node.js","TypeScript","PostgreSQL","Express","AWS EC2"],"education":[{"degree":"B.E. CSE","institution":"Anna University","year":2019}],"work_history":[{"company":"Sasken Technologies","role":"Developer","duration":"2019-2021","highlights":["React + Node.js APIs"]},{"company":"Sasken Technologies","role":"Senior Developer","duration":"2021-present","highlights":["Led backend API design","PostgreSQL with complex queries","Docker deployments"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I mostly work with React CRA, starting to learn Next.js. Server components concept is new to me."},{"question_id":"sq2","answer":"I added a composite index that improved query performance and used connection pooling."},{"question_id":"sq3","answer":"22 LPA"}]'::jsonb
),

-- ── ai_interview_pending (2) ──────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000001',
  'Meera Krishnan', 'meera.krishnan@gmail.com', '+91-9876543212',
  'Senior Full Stack Engineer', 'Tata Elxsi', 6, 'fitvector_organic', 'ai_interview_pending', 'strong_fit',
  85,
  '{"skills":31,"experience":23,"education":15,"role_match":16}'::jsonb,
  'Top candidate. 6 years full stack. Assessment score 82. AI interview invite sent.',
  '{"name":"Meera Krishnan","email":"meera.krishnan@gmail.com","experience_years":6,"current_role":"Senior Full Stack Engineer","current_company":"Tata Elxsi","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Redis","WebSockets","AWS","Docker"],"education":[{"degree":"M.Tech CSE","institution":"IIT Kharagpur","year":2018}],"work_history":[{"company":"Tata Elxsi","role":"Software Engineer","duration":"2018-2021","highlights":["Next.js 12 applications","Node.js microservices"]},{"company":"Tata Elxsi","role":"Senior Full Stack Engineer","duration":"2021-present","highlights":["Real-time collaboration features with WebSockets","Redis pub/sub for notifications","Postgres partitioning for time-series data"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"6 years including 3 in production with Next.js. I implemented ISR for marketing pages and PPR for hybrid pages in our latest product."},{"question_id":"sq2","answer":"Partitioned a 200M row table by month, added covering indexes. Query from 12s to 600ms."},{"question_id":"sq3","answer":"38 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000001',
  'Arjun Bose', 'arjun.bose@outlook.com', '+91-9876543213',
  'Full Stack Developer', 'Cyient', 5, 'fitvector_organic', 'ai_interview_pending', 'good_fit',
  75,
  '{"skills":27,"experience":20,"education":14,"role_match":14}'::jsonb,
  'Good fit. Assessment score 76. Solid Next.js and Node.js. AI interview invite sent.',
  '{"name":"Arjun Bose","email":"arjun.bose@outlook.com","experience_years":5,"current_role":"Full Stack Developer","current_company":"Cyient","skills":["Next.js","React","Node.js","TypeScript","PostgreSQL","Tailwind CSS","Git","Docker"],"education":[{"degree":"B.Tech IT","institution":"Jadavpur University","year":2019}],"work_history":[{"company":"Cyient","role":"Developer","duration":"2019-2021","highlights":["React SPAs","Node.js REST APIs"]},{"company":"Cyient","role":"Full Stack Developer","duration":"2021-present","highlights":["Next.js 13 App Router adoption","PostgreSQL with Prisma","Docker + CI/CD setup"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Using Next.js App Router for 2 years. Carefully chose which routes are static vs dynamic — used generateStaticParams for product pages."},{"question_id":"sq2","answer":"Identified slow query with EXPLAIN, added index on foreign key column that was missing."},{"question_id":"sq3","answer":"25 LPA"}]'::jsonb
),

-- ── ai_interviewed (2) ────────────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000001',
  'Pooja Verma', 'pooja.verma@gmail.com', '+91-9876543214',
  'Senior Software Engineer', 'GlobalLogic', 6, 'fitvector_organic', 'ai_interviewed', 'strong_fit',
  88,
  '{"skills":33,"experience":24,"education":15,"role_match":16}'::jsonb,
  'Exceptional candidate. AI interview score 84. Strong system design answers. Highly recommend human interview.',
  '{"name":"Pooja Verma","email":"pooja.verma@gmail.com","experience_years":6,"current_role":"Senior Software Engineer","current_company":"GlobalLogic","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Redis","Docker","AWS","WebSockets","GraphQL"],"education":[{"degree":"B.Tech CSE","institution":"DTU Delhi","year":2018}],"work_history":[{"company":"GlobalLogic","role":"Software Engineer","duration":"2018-2021","highlights":["Built Next.js e-commerce platform","Node.js + GraphQL APIs"]},{"company":"GlobalLogic","role":"Senior Software Engineer","duration":"2021-present","highlights":["Architected multi-tenant SaaS on AWS","Real-time notifications with Redis + WebSockets","Led Next.js App Router migration for 300K DAU product"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"3+ years App Router in production. Led migration for 300K DAU product. Key insight: co-locate data fetching with server components to eliminate waterfall."},{"question_id":"sq2","answer":"Rewrote slow query from ORM-generated SQL to hand-written CTE with window functions. 5x improvement."},{"question_id":"sq3","answer":"40 LPA"}]'::jsonb
),
(
  'app00001-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000001',
  'Nikhil Rao', 'nikhil.rao@gmail.com', '+91-9876543215',
  'Full Stack Lead', 'Birlasoft', 7, 'fitvector_organic', 'ai_interviewed', 'strong_fit',
  82,
  '{"skills":30,"experience":25,"education":14,"role_match":13}'::jsonb,
  'Strong lead candidate. AI interview score 79. Good technical depth. Minor concern on communication clarity.',
  '{"name":"Nikhil Rao","email":"nikhil.rao@gmail.com","experience_years":7,"current_role":"Full Stack Lead","current_company":"Birlasoft","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","AWS","Docker","Kubernetes","Redis"],"education":[{"degree":"B.E. CSE","institution":"PES University","year":2017}],"work_history":[{"company":"Birlasoft","role":"Developer","duration":"2017-2020","highlights":["React + Express apps"]},{"company":"Birlasoft","role":"Full Stack Lead","duration":"2020-present","highlights":["Leading 6-person team","AWS infrastructure","Next.js + Node.js microservices"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"7 years experience. Using Next.js since v9. App Router since stable release. Trade-off is the learning curve for team members used to Pages Router."},{"question_id":"sq2","answer":"EXPLAIN ANALYZE + pg_stat_statements to identify slow queries. Added GIN index on JSONB column."},{"question_id":"sq3","answer":"44 LPA"}]'::jsonb
),

-- ── human_interview (1) ───────────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000001',
  'Ishaan Malhotra', 'ishaan.malhotra@gmail.com', '+91-9876543216',
  'Senior Full Stack Engineer', 'Nagarro', 7, 'fitvector_organic', 'human_interview', 'strong_fit',
  91,
  '{"skills":34,"experience":27,"education":15,"role_match":15}'::jsonb,
  'Top of funnel. AI interview score 88. Excellent system design. Human interview scheduled.',
  '{"name":"Ishaan Malhotra","email":"ishaan.malhotra@gmail.com","experience_years":7,"current_role":"Senior Full Stack Engineer","current_company":"Nagarro","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Redis","WebSockets","AWS","Kubernetes","GraphQL","Docker"],"education":[{"degree":"B.Tech CSE","institution":"IIT Delhi","year":2017}],"work_history":[{"company":"Nagarro","role":"Software Engineer","duration":"2017-2020","highlights":["Next.js SaaS apps"]},{"company":"Nagarro","role":"Senior Full Stack Engineer","duration":"2020-present","highlights":["Architect for 1M+ user platform","AWS EKS deployment","Real-time features at scale"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"4+ years App Router including an internal tool adopted by 50K users. We use React Server Components for all data pages and limit client components to interaction-heavy widgets."},{"question_id":"sq2","answer":"Built a query analysis tooling pipeline using pg_stat_statements. Identified and fixed 12 slow queries in a quarter, reducing avg page load from 1.8s to 400ms."},{"question_id":"sq3","answer":"48 LPA"}]'::jsonb
),

-- ── offer (1) ──────────────────────────────────────────────────────────────────
(
  'app00001-0001-0001-0001-000000000017',
  'dddddddd-0001-0001-0001-000000000001',
  'Kavya Reddy', 'kavya.reddy@gmail.com', '+91-9876543217',
  'Principal Engineer', 'Mphasis', 8, 'referral', 'offer', 'strong_fit',
  95,
  '{"skills":36,"experience":28,"education":16,"role_match":15}'::jsonb,
  'Outstanding candidate. 8 years. IIT background. Passed all rounds with top scores. Offer extended.',
  '{"name":"Kavya Reddy","email":"kavya.reddy@gmail.com","experience_years":8,"current_role":"Principal Engineer","current_company":"Mphasis","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL","Redis","AWS","Kubernetes","Docker","GraphQL","WebSockets","System Design"],"education":[{"degree":"B.Tech CSE","institution":"IIT Hyderabad","year":2016}],"work_history":[{"company":"Mphasis","role":"Software Engineer","duration":"2016-2019","highlights":["React + Node.js products"]},{"company":"Mphasis","role":"Staff Engineer","duration":"2019-2022","highlights":["Led replatforming to Next.js microservices"]},{"company":"Mphasis","role":"Principal Engineer","duration":"2022-present","highlights":["Technical strategy for 3 product lines","AWS cost optimisation","Hiring and mentoring"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"8 years full stack, 4+ with Next.js in production. I wrote our internal Next.js migration runbook that was adopted by 3 teams."},{"question_id":"sq2","answer":"Built a systematic DB performance review process. Reduced p99 from 8s to 800ms across our product suite."},{"question_id":"sq3","answer":"55 LPA"}]'::jsonb
),

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB 2 · AI Engineer (Python / FastAPI)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── applied (4) ─────────────────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000002',
  'Arnav Gupta', 'arnav.gupta@gmail.com', '+91-9876543301',
  'Python Developer', 'Infosys BPM', 3, 'fitvector_organic', 'applied', 'potential_fit',
  54,
  '{"skills":19,"experience":14,"education":12,"role_match":9}'::jsonb,
  'Python solid but no LLM or FastAPI experience. 3 years data scripting. Limited fit for senior AI role.',
  '{"name":"Arnav Gupta","email":"arnav.gupta@gmail.com","experience_years":3,"current_role":"Python Developer","current_company":"Infosys BPM","skills":["Python","Pandas","NumPy","SQL","Flask","REST APIs"],"education":[{"degree":"B.Sc Computer Science","institution":"Delhi University","year":2021}],"work_history":[{"company":"Infosys BPM","role":"Python Developer","duration":"2021-present","highlights":["Data pipeline scripts in Python","Flask REST APIs for internal tools","SQL query writing"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I built internal REST APIs with Flask and worked on data pipelines. I am learning about LLMs through courses."},{"question_id":"sq2","answer":"I use try/except blocks and logging. I have not worked with production LLM systems yet."},{"question_id":"sq3","answer":"13 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000002',
  'dddddddd-0001-0001-0001-000000000002',
  'Tanvi Shah', 'tanvi.shah@outlook.com', '+91-9876543302',
  'Data Scientist', 'Fractal Analytics', 4, 'external_link', 'applied', 'potential_fit',
  63,
  '{"skills":22,"experience":16,"education":14,"role_match":11}'::jsonb,
  'Data science background with Python and PyTorch. No FastAPI or LangChain. Could be upskilled but not ideal for engineering role.',
  '{"name":"Tanvi Shah","email":"tanvi.shah@outlook.com","experience_years":4,"current_role":"Data Scientist","current_company":"Fractal Analytics","skills":["Python","PyTorch","scikit-learn","SQL","Pandas","Jupyter","MLflow"],"education":[{"degree":"M.Sc Statistics","institution":"IISc Bengaluru","year":2020}],"work_history":[{"company":"Fractal Analytics","role":"Data Scientist","duration":"2020-present","highlights":["Built ML models for FMCG clients","PyTorch fine-tuning","MLflow experiment tracking"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I built ML models and fine-tuned transformers. I have not built LLM-powered APIs in production."},{"question_id":"sq2","answer":"I retrain models when outputs drift and use confidence thresholds to flag uncertain predictions."},{"question_id":"sq3","answer":"22 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000003',
  'dddddddd-0001-0001-0001-000000000002',
  'Siddharth Nambiar', 'siddharth.nambiar@gmail.com', '+91-9876543303',
  'Backend Engineer (Python)', 'Freshworks', 5, 'referral', 'applied', 'good_fit',
  72,
  '{"skills":26,"experience":20,"education":14,"role_match":12}'::jsonb,
  'Good backend Python engineer at Freshworks. FastAPI solid. Starting to work with LLMs. Promising profile.',
  '{"name":"Siddharth Nambiar","email":"siddharth.nambiar@gmail.com","experience_years":5,"current_role":"Backend Engineer","current_company":"Freshworks","skills":["Python","FastAPI","Pydantic","PostgreSQL","Redis","Docker","Celery","REST APIs"],"education":[{"degree":"B.Tech CSE","institution":"SASTRA University","year":2019}],"work_history":[{"company":"Freshworks","role":"Backend Engineer","duration":"2019-present","highlights":["FastAPI microservices for CRM platform","Pydantic v2 schema design","Celery async task queues","PostgreSQL with complex queries"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I built FastAPI services for 4 years. Recently added a document summarisation feature using OpenAI API and LangChain. Still learning the LLM ecosystem."},{"question_id":"sq2","answer":"I use structured output mode and JSON schema validation on LLM outputs. Retry with temperature 0 for deterministic tasks."},{"question_id":"sq3","answer":"28 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000004',
  'dddddddd-0001-0001-0001-000000000002',
  'Shruti Agarwal', 'shruti.agarwal@gmail.com', '+91-9876543304',
  'ML Engineer', 'Samsung R&D', 3, 'fitvector_organic', 'applied', 'weak_fit',
  41,
  '{"skills":14,"experience":12,"education":8,"role_match":7}'::jsonb,
  'ML engineer but very junior. PyTorch focus with no API or production LLM experience. Not a fit for this role.',
  '{"name":"Shruti Agarwal","email":"shruti.agarwal@gmail.com","experience_years":3,"current_role":"ML Engineer","current_company":"Samsung R&D","skills":["Python","PyTorch","TensorFlow","NumPy","CUDA"],"education":[{"degree":"M.Tech AI","institution":"IIIT Bangalore","year":2021}],"work_history":[{"company":"Samsung R&D","role":"ML Engineer","duration":"2021-present","highlights":["On-device model optimisation","CUDA kernel writing","Computer vision models"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I work on on-device ML, not LLM APIs. I have experimented with Llama locally."},{"question_id":"sq2","answer":"I do not have production LLM experience yet."},{"question_id":"sq3","answer":"18 LPA"}]'::jsonb
),

-- ── ai_screened (3) ─────────────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000005',
  'dddddddd-0001-0001-0001-000000000002',
  'Vivek Menon', 'vivek.menon@gmail.com', '+91-9876543305',
  'AI/ML Engineer', 'Zoho', 5, 'fitvector_organic', 'ai_screened', 'strong_fit',
  86,
  '{"skills":31,"experience":20,"education":15,"role_match":20}'::jsonb,
  'Excellent AI Engineer at Zoho. FastAPI + LangChain in production. RAG pipeline experience. Strong fit.',
  '{"name":"Vivek Menon","email":"vivek.menon@gmail.com","experience_years":5,"current_role":"AI/ML Engineer","current_company":"Zoho","skills":["Python","FastAPI","LangChain","PyTorch","Pydantic","PostgreSQL","pgvector","Redis","Docker","Gemini API"],"education":[{"degree":"B.Tech CSE","institution":"NIT Calicut","year":2019}],"work_history":[{"company":"Zoho","role":"Software Engineer","duration":"2019-2022","highlights":["Python microservices","FastAPI REST APIs"]},{"company":"Zoho","role":"AI/ML Engineer","duration":"2022-present","highlights":["Built RAG pipeline serving 100K queries/day","LangChain + pgvector for semantic search","Gemini API integration for document Q&A"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a RAG system at Zoho serving 100K daily queries. Used LangChain for orchestration, pgvector for embeddings, Gemini API for generation. Hardest part was chunk strategy for long documents."},{"question_id":"sq2","answer":"I use output parsers with retry logic, fallback prompts, and confidence scoring. For critical paths, I validate structured output against a Pydantic model."},{"question_id":"sq3","answer":"34 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000006',
  'dddddddd-0001-0001-0001-000000000002',
  'Ritika Sharma', 'ritika.sharma@gmail.com', '+91-9876543306',
  'Senior Python Developer', 'PhonePe', 6, 'fitvector_organic', 'ai_screened', 'good_fit',
  76,
  '{"skills":28,"experience":22,"education":14,"role_match":12}'::jsonb,
  'Strong Python and FastAPI. PhonePe scale experience. LLM experience is newer (1 year) but promising.',
  '{"name":"Ritika Sharma","email":"ritika.sharma@gmail.com","experience_years":6,"current_role":"Senior Python Developer","current_company":"PhonePe","skills":["Python","FastAPI","Pydantic","PostgreSQL","Redis","Celery","Docker","Kafka","OpenAI API"],"education":[{"degree":"B.Tech IT","institution":"VIT Chennai","year":2018}],"work_history":[{"company":"PhonePe","role":"Python Developer","duration":"2018-2021","highlights":["FastAPI payment microservices","Redis caching at fintech scale"]},{"company":"PhonePe","role":"Senior Python Developer","duration":"2021-present","highlights":["Async FastAPI with 10K RPS","Built AI-powered fraud detection with OpenAI","Kafka event streaming"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"1 year LLM experience. Built fraud explanation feature using OpenAI API at PhonePe. Engineered retry and fallback because LLM latency was unpredictable."},{"question_id":"sq2","answer":"Rate limit LLM calls, cache common responses in Redis, use async queues for non-urgent LLM work. For reliability: always have a rule-based fallback."},{"question_id":"sq3","answer":"38 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000007',
  'dddddddd-0001-0001-0001-000000000002',
  'Harsh Aggarwal', 'harsh.aggarwal@outlook.com', '+91-9876543307',
  'Backend Python Engineer', 'Ola', 4, 'external_link', 'ai_screened', 'potential_fit',
  62,
  '{"skills":21,"experience":16,"education":12,"role_match":13}'::jsonb,
  'Decent Python backend at Ola. FastAPI experience but LangChain only in hobby projects. Border line fit.',
  '{"name":"Harsh Aggarwal","email":"harsh.aggarwal@outlook.com","experience_years":4,"current_role":"Backend Python Engineer","current_company":"Ola","skills":["Python","FastAPI","Pydantic","MySQL","Redis","Docker","REST APIs"],"education":[{"degree":"B.E. IT","institution":"DCE Delhi","year":2020}],"work_history":[{"company":"Ola","role":"Backend Engineer","duration":"2020-present","highlights":["FastAPI ride-matching APIs","Redis for real-time driver tracking","MySQL at scale"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"4 years FastAPI. LangChain only in hobby projects. I understand the concepts but haven''t shipped LLM features in production."},{"question_id":"sq2","answer":"I would add timeouts, retry with exponential backoff, and log every LLM call with input/output for debugging."},{"question_id":"sq3","answer":"24 LPA"}]'::jsonb
),

-- ── assessment_pending (2) ───────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000008',
  'dddddddd-0001-0001-0001-000000000002',
  'Devansh Trivedi', 'devansh.trivedi@gmail.com', '+91-9876543308',
  'AI Platform Engineer', 'Razorpay', 5, 'fitvector_organic', 'assessment_pending', 'strong_fit',
  84,
  '{"skills":30,"experience":20,"education":15,"role_match":19}'::jsonb,
  'Strong AI platform engineer at Razorpay. FastAPI + LangChain production experience. Assessment invite sent.',
  '{"name":"Devansh Trivedi","email":"devansh.trivedi@gmail.com","experience_years":5,"current_role":"AI Platform Engineer","current_company":"Razorpay","skills":["Python","FastAPI","LangChain","Pydantic","PostgreSQL","pgvector","Redis","Docker","GCP","Gemini API"],"education":[{"degree":"B.Tech CSE","institution":"BITS Goa","year":2019}],"work_history":[{"company":"Razorpay","role":"Backend Engineer","duration":"2019-2022","highlights":["FastAPI payment APIs"]},{"company":"Razorpay","role":"AI Platform Engineer","duration":"2022-present","highlights":["Built LLM-powered dispute analysis","LangChain RAG pipeline","pgvector semantic search"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a dispute analysis LLM pipeline at Razorpay processing 5K documents daily. Hardest engineering challenge was making it reliable — LLM timeout handling and graceful degradation."},{"question_id":"sq2","answer":"Structured output mode + Pydantic schema validation. If output fails validation, retry with corrective prompt up to 3 times, then flag for human review."},{"question_id":"sq3","answer":"36 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000009',
  'dddddddd-0001-0001-0001-000000000002',
  'Nidhi Sharma', 'nidhi.sharma@gmail.com', '+91-9876543309',
  'Senior AI Engineer', 'Swiggy', 6, 'referral', 'assessment_pending', 'strong_fit',
  88,
  '{"skills":32,"experience":22,"education":15,"role_match":19}'::jsonb,
  'Excellent AI engineer. Swiggy scale. LangChain + FastAPI + GCP expertise. Assessment invite sent.',
  '{"name":"Nidhi Sharma","email":"nidhi.sharma@gmail.com","experience_years":6,"current_role":"Senior AI Engineer","current_company":"Swiggy","skills":["Python","FastAPI","LangChain","PyTorch","Pydantic","PostgreSQL","Redis","GCP","Vertex AI","Docker","Kubernetes"],"education":[{"degree":"M.Tech AI & ML","institution":"IIT Bombay","year":2018}],"work_history":[{"company":"Swiggy","role":"ML Engineer","duration":"2018-2021","highlights":["Recommendation models in PyTorch","GCP Vertex AI deployment"]},{"company":"Swiggy","role":"Senior AI Engineer","duration":"2021-present","highlights":["LLM-powered menu analysis system","LangChain + Vertex AI production pipelines","FastAPI for AI feature serving"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built menu analysis system at Swiggy using Gemini + LangChain. Hardest part: handling multi-lingual restaurant menus with inconsistent formatting. Built a pre-processing pipeline."},{"question_id":"sq2","answer":"Combination of output validation (Pydantic), confidence scoring, fallback chains, and human-in-the-loop for low confidence outputs."},{"question_id":"sq3","answer":"45 LPA"}]'::jsonb
),

-- ── assessment_completed (2) ─────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000010',
  'dddddddd-0001-0001-0001-000000000002',
  'Aakash Malhotra', 'aakash.malhotra@gmail.com', '+91-9876543310',
  'AI Engineer', 'Paytm', 5, 'fitvector_organic', 'assessment_completed', 'strong_fit',
  81,
  '{"skills":29,"experience":20,"education":14,"role_match":18}'::jsonb,
  'Strong AI engineer. Assessment score 80 — above passing (70). Solid Python and FastAPI. Advance to AI interview.',
  '{"name":"Aakash Malhotra","email":"aakash.malhotra@gmail.com","experience_years":5,"current_role":"AI Engineer","current_company":"Paytm","skills":["Python","FastAPI","LangChain","Pydantic","PostgreSQL","Redis","Docker","OpenAI API","Celery"],"education":[{"degree":"B.Tech CSE","institution":"IIIT Allahabad","year":2019}],"work_history":[{"company":"Paytm","role":"Python Developer","duration":"2019-2022","highlights":["FastAPI microservices","Celery async tasks"]},{"company":"Paytm","role":"AI Engineer","duration":"2022-present","highlights":["LLM-powered customer support triage","LangChain agent for document Q&A","OpenAI API integration with retry logic"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built customer support triage system at Paytm. Hardest challenge: making the LangChain agent reliable for edge cases — added extensive guardrails and fallback rules."},{"question_id":"sq2","answer":"Retry decorator with exponential backoff, Redis cache for repeated queries, async queue for non-blocking LLM calls."},{"question_id":"sq3","answer":"33 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000011',
  'dddddddd-0001-0001-0001-000000000002',
  'Poonam Bajaj', 'poonam.bajaj@gmail.com', '+91-9876543311',
  'Python AI Developer', 'Unacademy', 4, 'external_link', 'assessment_completed', 'good_fit',
  69,
  '{"skills":24,"experience":16,"education":13,"role_match":16}'::jsonb,
  'Good Python AI developer. Assessment score 72 — pass. LangChain experience from edtech. Border line on experience level.',
  '{"name":"Poonam Bajaj","email":"poonam.bajaj@gmail.com","experience_years":4,"current_role":"Python AI Developer","current_company":"Unacademy","skills":["Python","FastAPI","LangChain","OpenAI API","PostgreSQL","Redis","Docker","Pydantic"],"education":[{"degree":"B.Tech CSE","institution":"Amity University","year":2020}],"work_history":[{"company":"Unacademy","role":"Python Developer","duration":"2020-2022","highlights":["FastAPI quiz APIs","PostgreSQL schema design"]},{"company":"Unacademy","role":"Python AI Developer","duration":"2022-present","highlights":["LangChain-powered study assistant","OpenAI API integration","RAG for course content Q&A"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built study assistant chatbot at Unacademy. LangChain for retrieval, OpenAI for generation. Challenge was keeping answers grounded and preventing hallucination on educational content."},{"question_id":"sq2","answer":"Source citations in every response, confidence threshold with fallback to ''I don''t know'', human review queue for flagged outputs."},{"question_id":"sq3","answer":"24 LPA"}]'::jsonb
),

-- ── ai_interview_pending (2) ─────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000002',
  'Rohan Pillai', 'rohan.pillai@gmail.com', '+91-9876543312',
  'Senior AI Engineer', 'Flipkart', 6, 'fitvector_organic', 'ai_interview_pending', 'strong_fit',
  87,
  '{"skills":31,"experience":22,"education":15,"role_match":19}'::jsonb,
  'Top candidate. Flipkart AI experience. Assessment score 85. AI interview invite sent.',
  '{"name":"Rohan Pillai","email":"rohan.pillai@gmail.com","experience_years":6,"current_role":"Senior AI Engineer","current_company":"Flipkart","skills":["Python","FastAPI","LangChain","PyTorch","pgvector","PostgreSQL","Redis","Docker","GCP","Gemini API","Kubernetes"],"education":[{"degree":"M.Tech CSE","institution":"IIT Roorkee","year":2018}],"work_history":[{"company":"Flipkart","role":"ML Engineer","duration":"2018-2021","highlights":["Recommendation models","A/B testing infrastructure"]},{"company":"Flipkart","role":"Senior AI Engineer","duration":"2021-present","highlights":["LLM-powered product description generation","LangChain + Gemini API pipeline","FastAPI serving 2K RPS"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Product description generation at Flipkart scale. Hardest challenge: batch processing 1M+ product updates efficiently — used async FastAPI + Celery + Redis queue."},{"question_id":"sq2","answer":"For product descriptions: keyword guardrails, banned words filter, Pydantic validation, human spot-check sampling."},{"question_id":"sq3","answer":"42 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000002',
  'Sneha Krishnaswamy', 'sneha.krishnaswamy@gmail.com', '+91-9876543313',
  'AI Platform Engineer', 'Ather Energy', 5, 'fitvector_organic', 'ai_interview_pending', 'good_fit',
  74,
  '{"skills":27,"experience":19,"education":14,"role_match":14}'::jsonb,
  'Good AI platform engineer. Niche domain but strong Python skills. Assessment score 77. AI interview invite sent.',
  '{"name":"Sneha Krishnaswamy","email":"sneha.krishnaswamy@gmail.com","experience_years":5,"current_role":"AI Platform Engineer","current_company":"Ather Energy","skills":["Python","FastAPI","LangChain","Pydantic","PostgreSQL","Redis","Docker","OpenAI API"],"education":[{"degree":"B.Tech ECE","institution":"PSG Tech","year":2019}],"work_history":[{"company":"Ather Energy","role":"Software Engineer","duration":"2019-2022","highlights":["IoT data APIs in FastAPI","PostgreSQL time-series data"]},{"company":"Ather Energy","role":"AI Platform Engineer","duration":"2022-present","highlights":["LLM-powered diagnostic assistant for service centres","FastAPI + LangChain","OpenAI API with retry handling"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built EV diagnostic assistant using LangChain + OpenAI. Hardest challenge was domain-specific knowledge retrieval — built custom chunking for technical manuals."},{"question_id":"sq2","answer":"Structured prompts with explicit format instructions, validate with Pydantic, fallback to deterministic rules when confidence is low."},{"question_id":"sq3","answer":"29 LPA"}]'::jsonb
),

-- ── ai_interviewed (2) ────────────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000002',
  'Akshay Kulkarni', 'akshay.kulkarni@gmail.com', '+91-9876543314',
  'Senior AI Engineer', 'CRED', 6, 'fitvector_organic', 'ai_interviewed', 'strong_fit',
  89,
  '{"skills":33,"experience":22,"education":15,"role_match":19}'::jsonb,
  'Exceptional. CRED AI experience. AI interview score 86. Highly recommend for human interview round.',
  '{"name":"Akshay Kulkarni","email":"akshay.kulkarni@gmail.com","experience_years":6,"current_role":"Senior AI Engineer","current_company":"CRED","skills":["Python","FastAPI","LangChain","PyTorch","Pydantic","PostgreSQL","pgvector","Redis","Docker","GCP","Gemini API","LLM Evaluation"],"education":[{"degree":"B.Tech CSE","institution":"IIT Gandhinagar","year":2018}],"work_history":[{"company":"CRED","role":"ML Engineer","duration":"2018-2021","highlights":["Credit scoring models","Feature engineering pipelines"]},{"company":"CRED","role":"Senior AI Engineer","duration":"2021-present","highlights":["LLM-powered financial insights","LangChain agent for member queries","pgvector semantic search for rewards discovery","LLM evaluation framework"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built financial insights system at CRED. Most complex: reliable LLM outputs for financial data — cannot hallucinate. Solution: RAG with verified data sources + output validation + audit logging."},{"question_id":"sq2","answer":"Three layers: guardrails (LLM guardrails library), structured output validation (Pydantic), and automated eval suite that runs after every model update."},{"question_id":"sq3","answer":"48 LPA"}]'::jsonb
),
(
  'app00002-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000002',
  'Gaurav Jain', 'gaurav.jain@gmail.com', '+91-9876543315',
  'AI/LLM Engineer', 'Meesho', 5, 'fitvector_organic', 'ai_interviewed', 'strong_fit',
  83,
  '{"skills":30,"experience":20,"education":14,"role_match":19}'::jsonb,
  'Strong LLM engineer. Meesho commerce AI experience. AI interview score 81. Good candidate for human round.',
  '{"name":"Gaurav Jain","email":"gaurav.jain@gmail.com","experience_years":5,"current_role":"AI/LLM Engineer","current_company":"Meesho","skills":["Python","FastAPI","LangChain","Pydantic","OpenAI API","PostgreSQL","Redis","Docker","AWS Lambda","LLM Fine-tuning"],"education":[{"degree":"B.Tech CSE","institution":"IIT BHU","year":2019}],"work_history":[{"company":"Meesho","role":"Backend Engineer","duration":"2019-2022","highlights":["FastAPI catalogue APIs","PostgreSQL performance"]},{"company":"Meesho","role":"AI/LLM Engineer","duration":"2022-present","highlights":["Vernacular product description generation","LangChain + OpenAI for multi-lingual content","Fine-tuned LLM for Hinglish support"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Vernacular product descriptions at Meesho — 8 Indian languages. Hardest: quality for low-resource languages. Fine-tuned a model for Hinglish and built evaluation benchmarks."},{"question_id":"sq2","answer":"Language-specific evaluation datasets, native speaker spot-checks, automatic fluency scoring, and rejection of outputs below threshold."},{"question_id":"sq3","answer":"38 LPA"}]'::jsonb
),

-- ── human_interview (1) ───────────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000002',
  'Prateek Bansal', 'prateek.bansal@gmail.com', '+91-9876543316',
  'Staff AI Engineer', 'Zomato', 8, 'referral', 'human_interview', 'strong_fit',
  93,
  '{"skills":35,"experience":28,"education":15,"role_match":15}'::jsonb,
  'Exceptional staff AI engineer. Zomato scale. AI interview score 90. Human interview scheduled.',
  '{"name":"Prateek Bansal","email":"prateek.bansal@gmail.com","experience_years":8,"current_role":"Staff AI Engineer","current_company":"Zomato","skills":["Python","FastAPI","LangChain","PyTorch","Pydantic","PostgreSQL","pgvector","Redis","Docker","Kubernetes","GCP","Vertex AI","Gemini API","LLM Ops"],"education":[{"degree":"M.Tech CSE","institution":"IIT Delhi","year":2016}],"work_history":[{"company":"Zomato","role":"ML Engineer","duration":"2016-2020","highlights":["Recommendation systems","Ranking models"]},{"company":"Zomato","role":"Staff AI Engineer","duration":"2020-present","highlights":["Led LLM platform team (4 engineers)","Multi-modal AI for food image analysis","LangChain production at 100K RPS","LLM Ops: monitoring, eval, deployment"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Led Zomato''s LLM platform. Hardest engineering challenge was LLM observability at scale — built custom tracing with prompt/response logging, latency tracking, and cost attribution."},{"question_id":"sq2","answer":"End-to-end LLM Ops: eval dataset (human + automatic), drift detection on output quality, canary rollouts for model updates, circuit breaker for latency spikes."},{"question_id":"sq3","answer":"60 LPA"}]'::jsonb
),

-- ── offer (1) ──────────────────────────────────────────────────────────────────
(
  'app00002-0001-0001-0001-000000000017',
  'dddddddd-0001-0001-0001-000000000002',
  'Madhuri Iyer', 'madhuri.iyer@gmail.com', '+91-9876543317',
  'Principal AI Engineer', 'Google India', 9, 'referral', 'offer', 'strong_fit',
  97,
  '{"skills":37,"experience":30,"education":16,"role_match":14}'::jsonb,
  'Outstanding. Google AI background. All rounds exceptional. Offer extended.',
  '{"name":"Madhuri Iyer","email":"madhuri.iyer@gmail.com","experience_years":9,"current_role":"Principal AI Engineer","current_company":"Google India","skills":["Python","FastAPI","LangChain","PyTorch","Pydantic","PostgreSQL","pgvector","GCP","Vertex AI","Gemini API","LLM Ops","System Design","Team Leadership"],"education":[{"degree":"M.Tech AI","institution":"IISc Bengaluru","year":2015}],"work_history":[{"company":"Google India","role":"Software Engineer","duration":"2015-2018","highlights":["Backend services at Google scale"]},{"company":"Google India","role":"Senior AI Engineer","duration":"2018-2022","highlights":["Gemini API features","Production LLM serving infra"]},{"company":"Google India","role":"Principal AI Engineer","duration":"2022-present","highlights":["Technical lead for Gemini API integrations","Vertex AI platform contributions","Cross-functional AI strategy"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"9 years building AI systems. At Google I worked directly on Gemini API production features and Vertex AI platform. Every LLM challenge I have hit at scale."},{"question_id":"sq2","answer":"Ground truth evals, semantic similarity scoring, human feedback loops, A/B testing with statistical significance, and model cards for every deployment."},{"question_id":"sq3","answer":"75 LPA"}]'::jsonb
),

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB 3 · Frontend Developer (React)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── applied (4) ─────────────────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000003',
  'Ankit Saxena', 'ankit.saxena@gmail.com', '+91-9876543401',
  'Junior Frontend Developer', 'Wipro', 2, 'external_link', 'applied', 'weak_fit',
  36,
  '{"skills":10,"experience":8,"education":10,"role_match":8}'::jsonb,
  'Too junior. 2 years, mostly HTML/CSS. Not at the 2-year React production level required.',
  '{"name":"Ankit Saxena","email":"ankit.saxena@gmail.com","experience_years":2,"current_role":"Junior Frontend Developer","current_company":"Wipro","skills":["HTML","CSS","JavaScript","Bootstrap","jQuery"],"education":[{"degree":"BCA","institution":"Aligarh Muslim University","year":2022}],"work_history":[{"company":"Wipro","role":"Junior Frontend Developer","duration":"2022-present","highlights":["HTML/CSS web pages","jQuery animations","Bootstrap layout"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I mostly build HTML pages and I am just starting to learn React."},{"question_id":"sq2","answer":"I have not worked with accessibility APIs yet."},{"question_id":"sq3","answer":"7 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000002',
  'dddddddd-0001-0001-0001-000000000003',
  'Ankita Gupta', 'ankita.gupta@gmail.com', '+91-9876543402',
  'React Developer', 'Mphasis', 3, 'fitvector_organic', 'applied', 'potential_fit',
  58,
  '{"skills":20,"experience":12,"education":13,"role_match":13}'::jsonb,
  'Decent React developer. 3 years. Limited TypeScript and no Tailwind. Could be a fit with upskilling.',
  '{"name":"Ankita Gupta","email":"ankita.gupta@gmail.com","experience_years":3,"current_role":"React Developer","current_company":"Mphasis","skills":["React","JavaScript","Redux","REST APIs","CSS","HTML","Styled Components"],"education":[{"degree":"B.Sc IT","institution":"Symbiosis Pune","year":2021}],"work_history":[{"company":"Mphasis","role":"React Developer","duration":"2021-present","highlights":["React SPAs for banking clients","Redux state management","REST API integration"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"I built a complex multi-step form wizard in React with Redux. Proud of the nested state management."},{"question_id":"sq2","answer":"I use aria-label attributes but haven''t done deep a11y testing."},{"question_id":"sq3","answer":"15 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000003',
  'dddddddd-0001-0001-0001-000000000003',
  'Varun Mehta', 'varun.mehta@gmail.com', '+91-9876543403',
  'Frontend Engineer', 'Razorpay', 4, 'referral', 'applied', 'good_fit',
  73,
  '{"skills":26,"experience":16,"education":14,"role_match":17}'::jsonb,
  'Strong React and TypeScript at Razorpay. Tailwind CSS. 4 years. Good fit for the role.',
  '{"name":"Varun Mehta","email":"varun.mehta@gmail.com","experience_years":4,"current_role":"Frontend Engineer","current_company":"Razorpay","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","REST APIs","Figma","Jest","Git"],"education":[{"degree":"B.Tech CSE","institution":"DTU Delhi","year":2020}],"work_history":[{"company":"Razorpay","role":"Frontend Engineer","duration":"2020-present","highlights":["Built payment dashboard in React + TypeScript","Tailwind CSS design system","React Query for server state","Figma to code translation"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a real-time transaction dashboard with complex filtering and live updates using React Query + WebSockets. Challenging because of streaming data reconciliation."},{"question_id":"sq2","answer":"I use ARIA roles, keyboard navigation testing, and run Lighthouse accessibility audits before every release."},{"question_id":"sq3","answer":"21 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000004',
  'dddddddd-0001-0001-0001-000000000003',
  'Riya Jain', 'riya.jain@gmail.com', '+91-9876543404',
  'UI Developer', 'Zendesk India', 3, 'fitvector_organic', 'applied', 'potential_fit',
  61,
  '{"skills":22,"experience":12,"education":14,"role_match":13}'::jsonb,
  'React and TypeScript solid. Tailwind limited. Figma to code experience is good. Border line.',
  '{"name":"Riya Jain","email":"riya.jain@gmail.com","experience_years":3,"current_role":"UI Developer","current_company":"Zendesk India","skills":["React","TypeScript","CSS Modules","REST APIs","Figma","Storybook","Jest"],"education":[{"degree":"B.Tech IT","institution":"VJTI Mumbai","year":2021}],"work_history":[{"company":"Zendesk India","role":"UI Developer","duration":"2021-present","highlights":["React component library with Storybook","Figma design implementation","TypeScript across all components"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built an accessible dropdown component with keyboard navigation, screen reader support, and multi-select. Most complex reusable component I have built."},{"question_id":"sq2","answer":"I test keyboard navigation manually and with axe-core. I write ARIA attributes for custom interactive components."},{"question_id":"sq3","answer":"16 LPA"}]'::jsonb
),

-- ── ai_screened (3) ─────────────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000005',
  'dddddddd-0001-0001-0001-000000000003',
  'Mihir Bhatt', 'mihir.bhatt@gmail.com', '+91-9876543405',
  'Senior Frontend Engineer', 'Juspay', 5, 'fitvector_organic', 'ai_screened', 'strong_fit',
  85,
  '{"skills":30,"experience":20,"education":15,"role_match":20}'::jsonb,
  'Strong senior frontend at Juspay (fintech). React + TypeScript + Tailwind expert. Figma proficiency. Advance to interview.',
  '{"name":"Mihir Bhatt","email":"mihir.bhatt@gmail.com","experience_years":5,"current_role":"Senior Frontend Engineer","current_company":"Juspay","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Storybook","Jest","Playwright","REST APIs","WebSockets"],"education":[{"degree":"B.Tech CSE","institution":"DAIICT","year":2019}],"work_history":[{"company":"Juspay","role":"Frontend Engineer","duration":"2019-2022","highlights":["React payment UI","TypeScript migration"]},{"company":"Juspay","role":"Senior Frontend Engineer","duration":"2022-present","highlights":["Led design system with Tailwind + Storybook","Figma handoff process","React Query server state management","Playwright E2E tests"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built Juspay''s checkout SDK in React — used by thousands of merchants. Most complex part: customisable theming system that merchants configure without writing code."},{"question_id":"sq2","answer":"Accessibility is core to our payment flows. I use ARIA live regions for dynamic updates, keyboard trap for modals, focus management on route change, and axe-core in CI."},{"question_id":"sq3","answer":"31 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000006',
  'dddddddd-0001-0001-0001-000000000003',
  'Pallavi Srivastava', 'pallavi.srivastava@gmail.com', '+91-9876543406',
  'React Developer', 'Fampay', 4, 'fitvector_organic', 'ai_screened', 'good_fit',
  71,
  '{"skills":25,"experience":16,"education":14,"role_match":16}'::jsonb,
  'Good React + TypeScript developer at Fampay. Tailwind experience. Figma to code competent.',
  '{"name":"Pallavi Srivastava","email":"pallavi.srivastava@gmail.com","experience_years":4,"current_role":"React Developer","current_company":"Fampay","skills":["React","TypeScript","Tailwind CSS","REST APIs","Figma","Jest","Git","React Hook Form"],"education":[{"degree":"B.E. CSE","institution":"RV College Bengaluru","year":2020}],"work_history":[{"company":"Fampay","role":"Frontend Developer","duration":"2020-2022","highlights":["React mobile-first UI","REST API integration"]},{"company":"Fampay","role":"React Developer","duration":"2022-present","highlights":["TypeScript migration","Tailwind CSS design system","Figma design to production"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a transaction history component with infinite scroll, filter chips, and real-time balance updates. Complex state management with React Query and Zustand."},{"question_id":"sq2","answer":"I use aria-label, role attributes, and test with keyboard navigation. I aim to meet WCAG 2.1 AA."},{"question_id":"sq3","answer":"19 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000007',
  'dddddddd-0001-0001-0001-000000000003',
  'Kunal Agarwal', 'kunal.agarwal@outlook.com', '+91-9876543407',
  'Frontend Developer', 'Nykaa', 3, 'external_link', 'ai_screened', 'potential_fit',
  62,
  '{"skills":21,"experience":12,"education":13,"role_match":16}'::jsonb,
  'Decent React developer from Nykaa. TypeScript recent. Limited Tailwind. Marginal fit.',
  '{"name":"Kunal Agarwal","email":"kunal.agarwal@outlook.com","experience_years":3,"current_role":"Frontend Developer","current_company":"Nykaa","skills":["React","JavaScript","TypeScript","CSS","REST APIs","Figma","Git"],"education":[{"degree":"B.Sc CS","institution":"Christ University Bengaluru","year":2021}],"work_history":[{"company":"Nykaa","role":"Frontend Developer","duration":"2021-present","highlights":["React product listing pages","JavaScript to TypeScript migration (in progress)","Figma implementation"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built product listing page with filters and infinite scroll. Challenging part was combining multiple filter states."},{"question_id":"sq2","answer":"I add alt text to images and use semantic HTML. I am learning more about ARIA."},{"question_id":"sq3","answer":"16 LPA"}]'::jsonb
),

-- ── assessment_pending (2) ── (no assessment for Job 3, so these stay as pending AI interview)
(
  'app00003-0001-0001-0001-000000000008',
  'dddddddd-0001-0001-0001-000000000003',
  'Trishna Das', 'trishna.das@gmail.com', '+91-9876543408',
  'Frontend Engineer', 'Dream11', 5, 'fitvector_organic', 'assessment_pending', 'strong_fit',
  84,
  '{"skills":30,"experience":20,"education":15,"role_match":19}'::jsonb,
  'Excellent frontend engineer at Dream11. React + TypeScript + Tailwind at scale. Strong Figma collaboration.',
  '{"name":"Trishna Das","email":"trishna.das@gmail.com","experience_years":5,"current_role":"Frontend Engineer","current_company":"Dream11","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Playwright","Storybook","WebSockets","Performance Optimization"],"education":[{"degree":"B.Tech CSE","institution":"Jadavpur University","year":2019}],"work_history":[{"company":"Dream11","role":"Frontend Developer","duration":"2019-2022","highlights":["React live sports UI","WebSockets real-time scores"]},{"company":"Dream11","role":"Frontend Engineer","duration":"2022-present","highlights":["React performance optimisation for 10M+ concurrent users","Tailwind CSS design system","Storybook component library","Playwright E2E testing"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built live cricket scorecard at Dream11 used by 10M+ concurrent users during IPL. Complex: reconciling WebSocket updates with React render batching for smooth UI."},{"question_id":"sq2","answer":"Accessibility is critical for sports apps with large user bases. I implement skip links, focus management, reduced motion support, and ARIA live regions for score updates."},{"question_id":"sq3","answer":"33 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000009',
  'dddddddd-0001-0001-0001-000000000003',
  'Amar Yadav', 'amar.yadav@gmail.com', '+91-9876543409',
  'Senior React Developer', 'MakeMyTrip', 5, 'referral', 'assessment_pending', 'strong_fit',
  80,
  '{"skills":28,"experience":20,"education":14,"role_match":18}'::jsonb,
  'Strong senior React developer at MakeMyTrip. TypeScript and Tailwind solid. Good Figma to code skills.',
  '{"name":"Amar Yadav","email":"amar.yadav@gmail.com","experience_years":5,"current_role":"Senior React Developer","current_company":"MakeMyTrip","skills":["React","TypeScript","Tailwind CSS","React Query","Redux Toolkit","Figma","Jest","REST APIs","CSS Animations"],"education":[{"degree":"B.Tech CSE","institution":"Manipal University","year":2019}],"work_history":[{"company":"MakeMyTrip","role":"React Developer","duration":"2019-2022","highlights":["Flight search and booking UI","React + TypeScript migration"]},{"company":"MakeMyTrip","role":"Senior React Developer","duration":"2022-present","highlights":["Led Tailwind CSS adoption","Figma DS implementation","React Query for complex data fetching"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built MakeMyTrip''s hotel search page with complex filtering, map integration, and real-time price updates. Hardest: keeping React renders fast with large option sets."},{"question_id":"sq2","answer":"I focus on keyboard navigation for search forms, ARIA for dynamic results, and ensure screen readers announce price changes correctly."},{"question_id":"sq3","answer":"28 LPA"}]'::jsonb
),

-- ── assessment_completed (2) ─────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000010',
  'dddddddd-0001-0001-0001-000000000003',
  'Priya Shetty', 'priya.shetty@gmail.com', '+91-9876543410',
  'Frontend Developer', 'Udaan', 4, 'fitvector_organic', 'assessment_completed', 'good_fit',
  70,
  '{"skills":24,"experience":16,"education":13,"role_match":17}'::jsonb,
  'Good React developer. Tailwind and TypeScript solid. Assessment score 71. Marginal pass — advance with note.',
  '{"name":"Priya Shetty","email":"priya.shetty@gmail.com","experience_years":4,"current_role":"Frontend Developer","current_company":"Udaan","skills":["React","TypeScript","Tailwind CSS","Figma","REST APIs","Git","Jest"],"education":[{"degree":"B.E. IT","institution":"BMS College Bengaluru","year":2020}],"work_history":[{"company":"Udaan","role":"Frontend Developer","duration":"2020-present","highlights":["B2B commerce UI in React","Tailwind CSS components","TypeScript refactoring"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built product catalogue page with complex bulk order management UI. Multi-select, quantity inputs, and real-time total calculation."},{"question_id":"sq2","answer":"I use semantic HTML and basic ARIA. Tailwind makes it easy to maintain consistent focus styles."},{"question_id":"sq3","answer":"20 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000011',
  'dddddddd-0001-0001-0001-000000000003',
  'Sameer Verma', 'sameer.verma@gmail.com', '+91-9876543411',
  'React Developer', 'Healthkart', 3, 'external_link', 'assessment_completed', 'potential_fit',
  63,
  '{"skills":22,"experience":12,"education":13,"role_match":16}'::jsonb,
  'Potential fit. Assessment score 65 — just passed. React and TypeScript competent. Tailwind needs work.',
  '{"name":"Sameer Verma","email":"sameer.verma@gmail.com","experience_years":3,"current_role":"React Developer","current_company":"Healthkart","skills":["React","TypeScript","CSS Modules","REST APIs","Figma","Git"],"education":[{"degree":"BCA","institution":"IP University","year":2021}],"work_history":[{"company":"Healthkart","role":"React Developer","duration":"2021-present","highlights":["Health product listing in React","TypeScript components","Figma to code"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built a supplement product page with variant selection and cart functionality."},{"question_id":"sq2","answer":"I add alt text and use heading hierarchy. Still learning ARIA."},{"question_id":"sq3","answer":"15 LPA"}]'::jsonb
),

-- ── ai_interview_pending (2) ─────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000003',
  'Neha Kapoor', 'neha.kapoor@gmail.com', '+91-9876543412',
  'Senior Frontend Engineer', 'Urban Company', 5, 'fitvector_organic', 'ai_interview_pending', 'strong_fit',
  83,
  '{"skills":29,"experience":20,"education":15,"role_match":19}'::jsonb,
  'Strong senior frontend at Urban Company. React + TypeScript + Tailwind + Figma expert. AI interview invite sent.',
  '{"name":"Neha Kapoor","email":"neha.kapoor@gmail.com","experience_years":5,"current_role":"Senior Frontend Engineer","current_company":"Urban Company","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Storybook","Jest","REST APIs","CSS Animations"],"education":[{"degree":"B.Tech IT","institution":"IIT (ISM) Dhanbad","year":2019}],"work_history":[{"company":"Urban Company","role":"Frontend Developer","duration":"2019-2022","highlights":["React service booking UI","REST API integration"]},{"company":"Urban Company","role":"Senior Frontend Engineer","duration":"2022-present","highlights":["Component library with Tailwind + Storybook","Figma design system collaboration","React Query migration from Redux","Performance: CLS and LCP improvements"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built Urban Company''s booking flow — multi-step, real-time slot availability. Most complex: handling race conditions when slots update while user is on the page."},{"question_id":"sq2","answer":"WCAG 2.1 AA compliance for all booking flows. I use focus traps for modals, announce slot availability changes with ARIA live, and test with NVDA."},{"question_id":"sq3","answer":"30 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000003',
  'Rajat Bhatia', 'rajat.bhatia@gmail.com', '+91-9876543413',
  'Frontend Developer', 'Lenskart', 4, 'fitvector_organic', 'ai_interview_pending', 'good_fit',
  72,
  '{"skills":25,"experience":16,"education":14,"role_match":17}'::jsonb,
  'Good React developer from Lenskart. TypeScript solid. Tailwind and Figma experience. AI interview invite sent.',
  '{"name":"Rajat Bhatia","email":"rajat.bhatia@gmail.com","experience_years":4,"current_role":"Frontend Developer","current_company":"Lenskart","skills":["React","TypeScript","Tailwind CSS","REST APIs","Figma","Git","React Hook Form","Jest"],"education":[{"degree":"B.Tech CSE","institution":"Thapar University","year":2020}],"work_history":[{"company":"Lenskart","role":"Frontend Developer","duration":"2020-present","highlights":["AR try-on product pages in React","TypeScript components","Tailwind CSS","Figma handoff"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built AR try-on feature integration in React — complex because of 3D model loading states and mobile device fallbacks."},{"question_id":"sq2","answer":"I ensure keyboard accessibility for all interactive elements and use ARIA descriptions for non-text content like 3D models."},{"question_id":"sq3","answer":"21 LPA"}]'::jsonb
),

-- ── ai_interviewed (2) ────────────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000003',
  'Simran Kaur', 'simran.kaur@gmail.com', '+91-9876543414',
  'Senior Frontend Engineer', 'Groww', 5, 'fitvector_organic', 'ai_interviewed', 'strong_fit',
  86,
  '{"skills":31,"experience":20,"education":15,"role_match":20}'::jsonb,
  'Excellent frontend engineer from Groww (fintech). React + TypeScript + Tailwind expert. AI interview score 83. Strong hire.',
  '{"name":"Simran Kaur","email":"simran.kaur@gmail.com","experience_years":5,"current_role":"Senior Frontend Engineer","current_company":"Groww","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Storybook","Playwright","WebSockets","Performance Optimization","Design Systems"],"education":[{"degree":"B.Tech CSE","institution":"Thapar University","year":2019}],"work_history":[{"company":"Groww","role":"Frontend Developer","duration":"2019-2022","highlights":["React investment dashboard","REST API integration"]},{"company":"Groww","role":"Senior Frontend Engineer","duration":"2022-present","highlights":["Design system with 80+ Tailwind components","Real-time portfolio updates via WebSockets","Playwright E2E test suite","Core Web Vitals improvements: LCP 40% faster"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built Groww''s portfolio dashboard — real-time price updates for 200+ holdings. Complex: batching WebSocket updates to avoid excessive React renders while keeping UI snappy."},{"question_id":"sq2","answer":"A11y is a priority at Groww. I write accessible table components for financial data, manage focus on route change, and run automated a11y CI checks with axe-core."},{"question_id":"sq3","answer":"34 LPA"}]'::jsonb
),
(
  'app00003-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000003',
  'Tarun Bose', 'tarun.bose@gmail.com', '+91-9876543415',
  'Frontend Engineer', 'Zepto', 4, 'fitvector_organic', 'ai_interviewed', 'good_fit',
  75,
  '{"skills":26,"experience":16,"education":14,"role_match":19}'::jsonb,
  'Good frontend engineer at Zepto. React + Tailwind strong. TypeScript solid. AI interview score 77.',
  '{"name":"Tarun Bose","email":"tarun.bose@gmail.com","experience_years":4,"current_role":"Frontend Engineer","current_company":"Zepto","skills":["React","TypeScript","Tailwind CSS","React Query","Figma","REST APIs","Jest","Git"],"education":[{"degree":"B.E. CSE","institution":"PESIT Bengaluru","year":2020}],"work_history":[{"company":"Zepto","role":"Frontend Engineer","duration":"2020-present","highlights":["React q-commerce UI","Tailwind CSS","Figma to production","React Query data fetching"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Built quick commerce order tracking with real-time status updates and map integration. Complex animation transitions between states."},{"question_id":"sq2","answer":"I use semantic HTML, focus management, and test keyboard navigation. Learning more about ARIA patterns."},{"question_id":"sq3","answer":"22 LPA"}]'::jsonb
),

-- ── human_interview (1) ───────────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000003',
  'Harshita Sharma', 'harshita.sharma@gmail.com', '+91-9876543416',
  'Senior Frontend Engineer', 'CRED', 6, 'fitvector_organic', 'human_interview', 'strong_fit',
  90,
  '{"skills":33,"experience":22,"education":15,"role_match":20}'::jsonb,
  'Top candidate. CRED design system experience. AI interview score 87. Human interview scheduled.',
  '{"name":"Harshita Sharma","email":"harshita.sharma@gmail.com","experience_years":6,"current_role":"Senior Frontend Engineer","current_company":"CRED","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Storybook","Playwright","Design Systems","CSS Architecture","Animation","Performance"],"education":[{"degree":"B.Tech CSE","institution":"IIT Jodhpur","year":2018}],"work_history":[{"company":"CRED","role":"Frontend Developer","duration":"2018-2021","highlights":["React finance UI","Design system foundations"]},{"company":"CRED","role":"Senior Frontend Engineer","duration":"2021-present","highlights":["Led CRED''s design system (200+ components)","Figma DS collaboration with design team","Playwright visual regression testing","Core Web Vitals: all green across app"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Led CRED''s design system — 200+ Tailwind + Storybook components used across 8 product teams. Most complex: polymorphic component API that satisfies TypeScript, Figma tokens, and runtime theming simultaneously."},{"question_id":"sq2","answer":"A11y is a first-class concern at CRED. I built our a11y testing pipeline: axe-core in CI, keyboard-only navigation QA checklist, screen reader testing matrix, and quarterly a11y audits."},{"question_id":"sq3","answer":"44 LPA"}]'::jsonb
),

-- ── offer (1) ──────────────────────────────────────────────────────────────────
(
  'app00003-0001-0001-0001-000000000017',
  'dddddddd-0001-0001-0001-000000000003',
  'Aditi Patel', 'aditi.patel@gmail.com', '+91-9876543417',
  'Staff Frontend Engineer', 'Swiggy', 7, 'referral', 'offer', 'strong_fit',
  94,
  '{"skills":35,"experience":25,"education":15,"role_match":19}'::jsonb,
  'Outstanding staff frontend engineer. Swiggy scale. All rounds top scores. Offer extended.',
  '{"name":"Aditi Patel","email":"aditi.patel@gmail.com","experience_years":7,"current_role":"Staff Frontend Engineer","current_company":"Swiggy","skills":["React","TypeScript","Tailwind CSS","React Query","Zustand","Figma","Storybook","Playwright","Performance","Design Systems","Team Leadership","CSS Architecture"],"education":[{"degree":"B.Tech CSE","institution":"IIT Kharagpur","year":2017}],"work_history":[{"company":"Swiggy","role":"Frontend Developer","duration":"2017-2020","highlights":["React order tracking UI"]},{"company":"Swiggy","role":"Senior Frontend Engineer","duration":"2020-2023","highlights":["Design system","Performance optimisation"]},{"company":"Swiggy","role":"Staff Frontend Engineer","duration":"2023-present","highlights":["Frontend platform strategy for 3 product lines","Core Web Vitals programme","Hiring and mentoring 12 engineers"]}]}'::jsonb,
  '[{"question_id":"sq1","answer":"Led Swiggy''s frontend platform. Most proud of our performance programme that brought LCP under 2.5s across all major pages for 100M+ monthly users."},{"question_id":"sq2","answer":"Built Swiggy''s a11y programme — policy, tooling, training, and quarterly audits. We hit WCAG 2.1 AA across all core flows."},{"question_id":"sq3","answer":"58 LPA"}]'::jsonb
);

-- Batch 4 complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 9 · ASSESSMENT SUBMISSIONS
--
-- Job 1 (Full Stack): 2 assessment_pending → invited, 2 assessment_completed → graded
-- Job 2 (AI Eng):     2 assessment_pending → invited, 2 assessment_completed → graded
-- Job 3 (Frontend):   No assessment, skip
-- attempt_number column added by migration 20260414000001_add_attempt_number.sql
-- =============================================================================

INSERT INTO public.assessment_submissions (
  id, assessment_id, applicant_id, job_post_id, status,
  invited_at, started_at, submitted_at, graded_at,
  time_taken_minutes, answers, auto_score, manual_score, final_score,
  grader_id, grader_notes, proctoring_flags, attempt_number
)
VALUES

-- ── Job 1 · Full Stack Engineer Assessment ───────────────────────────────────

-- Ananya Singh (assessment_pending → invited)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000001',
  'app00001-0001-0001-0001-000000000008',
  'dddddddd-0001-0001-0001-000000000001',
  'invited',
  NOW() - INTERVAL '2 days',
  NULL, NULL, NULL,
  NULL,
  '[]'::jsonb, NULL, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 1
),
-- Karthik Iyer (assessment_pending → invited)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000001',
  'app00001-0001-0001-0001-000000000009',
  'dddddddd-0001-0001-0001-000000000001',
  'invited',
  NOW() - INTERVAL '1 day',
  NULL, NULL, NULL,
  NULL,
  '[]'::jsonb, NULL, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 1
),
-- Divya Menon (assessment_completed → graded, score 78)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000001',
  'app00001-0001-0001-0001-000000000010',
  'dddddddd-0001-0001-0001-000000000001',
  'graded',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days' + INTERVAL '30 minutes',
  NOW() - INTERVAL '7 days' + INTERVAL '88 minutes',
  NOW() - INTERVAL '5 days',
  58,
  '[
    {"question_id":"q1","answer":"getServerSideProps","is_correct":true,"points_awarded":10},
    {"question_id":"q2","answer":"PUT","is_correct":true,"points_awarded":10},
    {"question_id":"q3","answer":"A full table scan — no index used","is_correct":true,"points_awarded":10},
    {"question_id":"q4","answer":"''object''","is_correct":true,"points_awarded":10},
    {"question_id":"q5","answer":"useEffect with a dependency array","is_correct":true,"points_awarded":10},
    {"question_id":"q6","answer":"function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}","is_correct":true,"points_awarded":20,"test_results":{"passed":2,"failed":0}},
    {"question_id":"q7","answer":"WITH user_stats AS (\n  SELECT user_id, SUM(amount) AS total_spend, COUNT(*) AS order_count, AVG(amount) AS avg_order_value FROM orders GROUP BY user_id\n)\nSELECT user_id, total_spend, order_count, ROUND(avg_order_value,2) FROM user_stats ORDER BY total_spend DESC LIMIT 3;","is_correct":true,"points_awarded":20,"test_results":{"passed":1,"failed":0}}
  ]'::jsonb,
  90, NULL, 78,
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Strong performance. MCQ perfect. Debounce implementation clean. SQL CTE well-written. Advance to AI interview.',
  '[{"type":"tab_switch","count":1,"timestamp":"2026-04-07T10:45:00Z"}]'::jsonb, 1
),
-- Suresh Kumar (assessment_completed → graded, score 69 — marginal pass)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000001',
  'app00001-0001-0001-0001-000000000011',
  'dddddddd-0001-0001-0001-000000000001',
  'graded',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days' + INTERVAL '45 minutes',
  NOW() - INTERVAL '6 days' + INTERVAL '95 minutes',
  NOW() - INTERVAL '4 days',
  50,
  '[
    {"question_id":"q1","answer":"getServerSideProps","is_correct":true,"points_awarded":10},
    {"question_id":"q2","answer":"POST","is_correct":false,"points_awarded":0},
    {"question_id":"q3","answer":"A full table scan — no index used","is_correct":true,"points_awarded":10},
    {"question_id":"q4","answer":"''object''","is_correct":true,"points_awarded":10},
    {"question_id":"q5","answer":"useEffect with a dependency array","is_correct":true,"points_awarded":10},
    {"question_id":"q6","answer":"function debounce(fn, delay) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), delay);\n  };\n}","is_correct":true,"points_awarded":18,"test_results":{"passed":1,"failed":1}},
    {"question_id":"q7","answer":"SELECT user_id, SUM(amount) as total FROM orders GROUP BY user_id ORDER BY total DESC LIMIT 3;","is_correct":false,"points_awarded":11,"test_results":{"passed":0,"failed":1}}
  ]'::jsonb,
  69, NULL, 69,
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Marginal pass (65 threshold). MCQ mostly correct. Debounce functional but test case 2 failed. SQL missing CTE and missing order count/avg — partial credit. Consider advancing with caveat.',
  '[{"type":"tab_switch","count":2,"timestamp":"2026-04-08T11:20:00Z"},{"type":"tab_switch","count":2,"timestamp":"2026-04-08T11:52:00Z"}]'::jsonb, 1
),

-- ── Job 2 · AI Engineer Python Assessment ────────────────────────────────────

-- Devansh Trivedi (assessment_pending → invited)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000002',
  'app00002-0001-0001-0001-000000000008',
  'dddddddd-0001-0001-0001-000000000002',
  'invited',
  NOW() - INTERVAL '3 days',
  NULL, NULL, NULL,
  NULL,
  '[]'::jsonb, NULL, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 1
),
-- Nidhi Sharma (assessment_pending → invited)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000002',
  'app00002-0001-0001-0001-000000000009',
  'dddddddd-0001-0001-0001-000000000002',
  'invited',
  NOW() - INTERVAL '2 days',
  NULL, NULL, NULL,
  NULL,
  '[]'::jsonb, NULL, NULL, NULL,
  NULL, NULL,
  '[]'::jsonb, 1
),
-- Aakash Malhotra (assessment_completed → graded, score 80)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000002',
  'app00002-0001-0001-0001-000000000010',
  'dddddddd-0001-0001-0001-000000000002',
  'graded',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days' + INTERVAL '20 minutes',
  NOW() - INTERVAL '8 days' + INTERVAL '68 minutes',
  NOW() - INTERVAL '6 days',
  48,
  '[
    {"question_id":"q1","answer":"import time\nimport functools\n\ndef retry(max_attempts, delay_seconds=1):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            last_exc = None\n            for attempt in range(max_attempts):\n                try:\n                    return fn(*args, **kwargs)\n                except Exception as e:\n                    last_exc = e\n                    if attempt < max_attempts - 1:\n                        time.sleep(delay_seconds)\n            raise last_exc\n        return wrapper\n    return decorator","is_correct":true,"points_awarded":33,"test_results":{"passed":2,"failed":0}},
    {"question_id":"q2","answer":"def chunk_text(text, chunk_size, overlap):\n    if not text: return []\n    chunks = []\n    start = 0\n    while start < len(text):\n        end = min(start + chunk_size, len(text))\n        chunks.append(text[start:end])\n        if end == len(text): break\n        start += chunk_size - overlap\n    return chunks","is_correct":true,"points_awarded":28,"test_results":{"passed":1,"failed":1}},
    {"question_id":"q3","answer":"from pydantic import BaseModel, field_validator, EmailStr, Field\nfrom typing import List\n\nclass JobApplication(BaseModel):\n    name: str = Field(min_length=2)\n    email: EmailStr\n    experience_years: int = Field(ge=0)\n    skills: List[str] = Field(min_length=1)\n\n    @field_validator(''skills'')\n    @classmethod\n    def normalise(cls, v):\n        return [s.lower() for s in v]","is_correct":true,"points_awarded":19,"test_results":{"passed":2,"failed":1}}
  ]'::jsonb,
  80, NULL, 80,
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Strong performance. Retry decorator perfect. Chunk text minor issue on edge case overlap. Pydantic model mostly correct — missed Field(min_length=1) on skills. Above passing threshold (70). Advance.',
  '[{"type":"tab_switch","count":1,"timestamp":"2026-04-06T14:33:00Z"}]'::jsonb, 1
),
-- Poonam Bajaj (assessment_completed → graded, score 72 — pass)
(
  gen_random_uuid(),
  'cccccccc-0001-0001-0001-000000000002',
  'app00002-0001-0001-0001-000000000011',
  'dddddddd-0001-0001-0001-000000000002',
  'graded',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days' + INTERVAL '35 minutes',
  NOW() - INTERVAL '7 days' + INTERVAL '72 minutes',
  NOW() - INTERVAL '5 days',
  37,
  '[
    {"question_id":"q1","answer":"import time\nimport functools\n\ndef retry(max_attempts, delay_seconds=1):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            for attempt in range(max_attempts):\n                try:\n                    return fn(*args, **kwargs)\n                except Exception as e:\n                    if attempt == max_attempts - 1:\n                        raise\n                    time.sleep(delay_seconds)\n        return wrapper\n    return decorator","is_correct":true,"points_awarded":30,"test_results":{"passed":2,"failed":0}},
    {"question_id":"q2","answer":"def chunk_text(text, chunk_size, overlap):\n    chunks = []\n    i = 0\n    while i < len(text):\n        chunks.append(text[i:i+chunk_size])\n        i += chunk_size - overlap\n    return chunks","is_correct":false,"points_awarded":20,"test_results":{"passed":1,"failed":1}},
    {"question_id":"q3","answer":"from pydantic import BaseModel, EmailStr\nfrom typing import List\n\nclass JobApplication(BaseModel):\n    name: str\n    email: EmailStr\n    experience_years: int\n    skills: List[str]","is_correct":false,"points_awarded":22,"test_results":{"passed":1,"failed":2}}
  ]'::jsonb,
  72, NULL, 72,
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Pass (70 threshold). Retry decorator good but slightly different exception pattern. Chunk text misses empty string edge case. Pydantic model missing Field validators. Marginal — consider advancing.',
  '[]'::jsonb, 1
);

-- =============================================================================
-- SECTION 10 · AI INTERVIEWS
--
-- 6 completed (2 per job) + 6 invited (2 per job)
-- Applicants at ai_interviewed → completed with full transcript
-- Applicants at ai_interview_pending → invited
-- =============================================================================

INSERT INTO public.ai_interviews (
  id, applicant_id, job_post_id, interview_type,
  duration_planned, duration_actual, status,
  invite_sent_at, invite_expires_at, started_at, completed_at,
  transcript, evaluation_report, overall_score, skill_scores,
  strengths, concerns, cheating_confidence, cheating_signals,
  communication_assessment, ai_recommendation
)
VALUES

-- ══════════════════════════════════════════════════════════════════════════════
-- JOB 1 · Senior Full Stack Engineer
-- ══════════════════════════════════════════════════════════════════════════════

-- Pooja Verma (ai_interviewed, score 84)
(
  gen_random_uuid(),
  'app00001-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000001',
  'technical',
  45, 43, 'completed',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days' + INTERVAL '3 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days' + INTERVAL '43 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Hello Pooja! Welcome to your technical interview for the Senior Full Stack Engineer role at Cognizant. Let''s start with Next.js. Can you walk me through how you decide whether to use a Server Component or a Client Component in the App Router?"},
    {"turn":2,"speaker":"candidate","text":"Sure. My default is to start with a Server Component — they run on the server and can directly fetch data from the database or external APIs without client-side JavaScript. I switch to a Client Component only when I need interactivity: event handlers like onClick, useState, useEffect, browser APIs, or third-party client-side libraries. For example, a product listing page is a Server Component that fetches data, but the filter panel with controlled inputs is a Client Component. The key insight is you can compose them — Server Components can render Client Components as children."},
    {"turn":3,"speaker":"ai","text":"Great answer. Now, you mentioned migrations to Next.js App Router. How do you handle authentication and session management in App Router, and what pitfalls did you encounter?"},
    {"turn":4,"speaker":"candidate","text":"We use NextAuth.js with a custom adapter. The main pitfall is that cookies are read-only in Server Components — you cannot set them directly. So session reads happen in server components using getServerSession, but anything that modifies the session must go through a Route Handler or Server Action. Another pitfall: the middleware runs on the Edge runtime, which doesn''t have access to Node.js APIs, so we had to move our JWT verification logic to be Edge-compatible. We also discovered that layout.tsx caches server component renders unless you use dynamic or set revalidate to 0 on the route."},
    {"turn":5,"speaker":"ai","text":"Excellent depth on the Edge runtime constraint. Let''s shift to PostgreSQL. You mentioned optimising a 300K DAU product. Walk me through a specific database performance issue you solved and your process."},
    {"turn":6,"speaker":"candidate","text":"We had a home feed query that was joining users, follows, posts, and media tables with a complex WHERE clause. p95 was 4.2 seconds. I started with EXPLAIN ANALYZE and found two issues: a Seq Scan on the posts table because the index on user_id existed but wasn''t being used due to a cast mismatch — the column was UUID but we were comparing with a text cast. Fixed the cast, dropped from 4.2s to 800ms. Then I found the remaining time was a sort on created_at with no index. Added a composite index on (user_id, created_at DESC) and it dropped to 120ms. Total improvement: 35x."},
    {"turn":7,"speaker":"ai","text":"Outstanding systematic approach. Last question: describe your ideal architecture for a real-time notification system for 300K concurrent users. What tech stack would you choose and why?"},
    {"turn":8,"speaker":"candidate","text":"For 300K concurrent users I would use a fan-out on write pattern. When an event occurs, a background job (Celery or BullMQ) fans out notifications to each subscriber''s notification queue stored in Redis Sorted Sets, scored by timestamp. Each connected client maintains a WebSocket connection to a Node.js server that subscribes to their Redis channel via Redis Pub/Sub. I would horizontally scale the WebSocket servers behind a load balancer with sticky sessions or use Redis Streams for durability so clients can catch up on missed notifications after reconnect. Postgres stores the persistent notification log. This architecture cleanly separates write throughput from read connections."}
  ]'::jsonb,
  '{"summary":"Pooja demonstrated exceptional depth in Next.js App Router internals, PostgreSQL optimisation methodology, and distributed systems design. She clearly has production experience at scale and communicated technical concepts precisely.","strengths":["Deep App Router knowledge including Edge runtime constraints","Systematic database debugging process (cast mismatch → index → composite)","Thoughtful distributed systems design with Redis Pub/Sub fan-out"],"areas_for_improvement":["Could explore trade-offs of fan-out on write vs. fan-out on read for very high-follow-count users","Mentioned Celery and BullMQ without choosing — should commit to a recommendation"]}'::jsonb,
  84,
  '[{"skill":"Next.js App Router","score":90,"evidence":"Correctly explained server vs client component decision tree and Edge runtime constraint"},{"skill":"PostgreSQL Performance","score":88,"evidence":"Systematic EXPLAIN ANALYZE approach, identified cast mismatch and missing composite index"},{"skill":"System Design","score":82,"evidence":"Redis Pub/Sub fan-out pattern, horizontal scaling, Redis Streams for durability"},{"skill":"TypeScript/Node.js","score":78,"evidence":"Solid fundamentals, no deep dive in this session"}]'::jsonb,
  '["Deep Next.js production knowledge","Systematic debugging methodology","Clear technical communication","Proactive trade-off discussion"]'::jsonb,
  '["Did not commit to a specific choice between Celery and BullMQ","Could be stronger on cost analysis of proposed architecture"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":9,"structure":8,"technical_depth":9,"confidence":8,"overall":8.5}'::jsonb,
  'strong_advance'
),

-- Nikhil Rao (ai_interviewed, score 79)
(
  gen_random_uuid(),
  'app00001-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000001',
  'technical',
  45, 41, 'completed',
  NOW() - INTERVAL '11 days',
  NOW() - INTERVAL '11 days' + INTERVAL '3 days',
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '9 days' + INTERVAL '41 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Welcome Nikhil! You have 7 years of full stack experience. Let''s start with a technical challenge: how do you handle data mutations in Next.js App Router, and what''s your view on Server Actions vs API Routes?"},
    {"turn":2,"speaker":"candidate","text":"Server Actions are great for simple form mutations — co-located with the component, automatic revalidation, progressive enhancement. I use them for typical CRUD operations where the client doesn''t need to know the implementation details. API Routes I still prefer for complex scenarios: batch operations, webhooks, when I need fine-grained HTTP status codes, or when I need to reuse the endpoint from a mobile app. The main limitation of Server Actions is they always POST — you lose HTTP semantics. But for internal product mutations, I lean toward Server Actions for simplicity."},
    {"turn":3,"speaker":"ai","text":"Good nuanced answer. Let''s talk about your PostgreSQL experience. You manage a large codebase — how do you handle schema migrations at scale with zero downtime?"},
    {"turn":4,"speaker":"candidate","text":"We follow the expand-contract pattern. For adding a column: first add it as nullable, deploy, then backfill data in batches, then add the NOT NULL constraint. Never add NOT NULL with a DEFAULT in a single migration on a large table — it locks the entire table. For column renames: add the new column, dual-write to both old and new for a deploy cycle, migrate reads to new column, drop old column. We use Flyway for migration management and always test migrations on a production-sized snapshot before release."},
    {"turn":5,"speaker":"ai","text":"Excellent. Expand-contract is exactly the right answer. Tell me about a time your architectural decision caused problems in production and what you learned from it."},
    {"turn":6,"speaker":"candidate","text":"Early in my tech lead role I chose to use a monorepo for what I thought was a tightly coupled set of services. 8 months later the CI build time was 18 minutes because every change triggered a full rebuild. We had 3 teams on the repo and deployments were serialised. The lesson: monorepo tooling (Nx, Turborepo) must be set up from day one with proper caching and affected-only builds. We retrofitted Turborepo and got build times back to 4 minutes, but the migration took a sprint. I now factor in CI/CD strategy as a first-class architectural concern."},
    {"turn":7,"speaker":"ai","text":"That''s a valuable real-world lesson. Final question: how do you approach Node.js service reliability — what patterns do you use to make services resilient to downstream failures?"},
    {"turn":8,"speaker":"candidate","text":"Circuit breaker pattern for all external calls — I use opossum library. If an external service fails past a threshold, the circuit opens and returns cached or degraded data instead of cascading failures. Timeout on every outbound call — never let a slow dependency block your event loop. Retry with exponential backoff and jitter for transient failures. Bulkhead pattern to isolate critical paths from non-critical ones using separate connection pools. And always log and alert on circuit opens so you catch degraded mode before users do."}
  ]'::jsonb,
  '{"summary":"Nikhil showed strong technical depth across Next.js, PostgreSQL migrations, and Node.js reliability patterns. Excellent real-world war story about monorepo decision. Communication style is slightly indirect at times but technically sound.","strengths":["Expand-contract migration pattern — exactly correct","Real production incident with clear learnings","Comprehensive Node.js resilience patterns (circuit breaker, bulkhead)"],"areas_for_improvement":["Communication could be more direct and structured","Did not proactively mention monitoring/observability in reliability answer"]}'::jsonb,
  79,
  '[{"skill":"Next.js App Router","score":80,"evidence":"Good Server Actions vs API Routes analysis with clear trade-offs"},{"skill":"PostgreSQL Migrations","score":88,"evidence":"Expand-contract pattern, batch backfill, avoid NOT NULL DEFAULT on large tables"},{"skill":"System Design","score":78,"evidence":"Monorepo lesson shows architectural thinking"},{"skill":"Node.js Reliability","score":82,"evidence":"Circuit breaker, bulkhead, retry with jitter — complete set"}]'::jsonb,
  '["Expand-contract migration expertise","Node.js resilience pattern knowledge","Real production incident experience"]'::jsonb,
  '["Communication directness could improve","Missing observability mention in reliability discussion"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":7,"structure":7,"technical_depth":8,"confidence":8,"overall":7.5}'::jsonb,
  'advance'
),

-- ── invited (2, Job 1) ────────────────────────────────────────────────────────
(
  gen_random_uuid(),
  'app00001-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000001',
  'technical', 45, NULL, 'invited',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
),
(
  gen_random_uuid(),
  'app00001-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000001',
  'technical', 45, NULL, 'invited',
  NOW(),
  NOW() + INTERVAL '7 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
),

-- ══════════════════════════════════════════════════════════════════════════════
-- JOB 2 · AI Engineer (Python/FastAPI)
-- ══════════════════════════════════════════════════════════════════════════════

-- Akshay Kulkarni (ai_interviewed, score 86)
(
  gen_random_uuid(),
  'app00002-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000002',
  'technical',
  45, 44, 'completed',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days' + INTERVAL '3 days',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days' + INTERVAL '44 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Welcome Akshay! Let''s dive straight into AI engineering. You have worked on financial LLM features at CRED. How do you ensure a RAG pipeline produces factually accurate outputs for financial data?"},
    {"turn":2,"speaker":"candidate","text":"Financial data accuracy is non-negotiable, so I use a layered approach. First, retrieval quality: I use a hybrid search — dense embeddings with pgvector for semantic similarity plus BM25 for keyword precision. For financial numbers, keyword precision matters more than semantics. Second, generation constraints: I always pass the retrieved context with an explicit instruction ''Only answer from the provided context. If the answer is not in the context, say you don''t know.'' Third, output validation: I parse the LLM response with a Pydantic model and check that any numbers mentioned exist verbatim in the retrieved context using a simple regex. If validation fails, I return a safe fallback response. Fourth, audit logging: every query, retrieved context, and response is logged for compliance review."},
    {"turn":3,"speaker":"ai","text":"Excellent multi-layered approach. Tell me about your LangChain production experience — what are its limitations and how do you work around them?"},
    {"turn":4,"speaker":"candidate","text":"LangChain''s main limitations in production are: one, it is opinionated and abstraction leaks when you hit edge cases — we ended up with a lot of custom chain subclasses. Two, debugging is harder because the call stack is deep. I work around this by using LangSmith for tracing, which gives full visibility into each chain step. Three, versioning is unstable — breaking changes every minor release. We pin all LangChain versions and have a dedicated update branch that runs our eval suite before we adopt any new version. For simple chains I now prefer writing the LLM calls directly with the Gemini/OpenAI SDK and handling retries myself — less magic, easier to debug."},
    {"turn":5,"speaker":"ai","text":"Very pragmatic take on LangChain. Now, how do you design a FastAPI service for high-throughput LLM inference — what does the architecture look like?"},
    {"turn":6,"speaker":"candidate","text":"For high-throughput LLM inference I use an async architecture. FastAPI with async endpoints, Celery or ARQ for background task queue, Redis as the broker. When a request comes in, the FastAPI endpoint validates input with Pydantic, enqueues the LLM task, and returns a task ID immediately. The client polls or uses Server-Sent Events for completion. The worker pool handles LLM calls with rate limiting (token bucket) and circuit breaker (opossum equivalent in Python). Results are cached in Redis with a TTL keyed on request hash to avoid duplicate LLM calls. I also use connection pooling via asyncpg for PostgreSQL writes. This gives us predictable latency and lets us scale workers independently of the API layer."},
    {"turn":7,"speaker":"ai","text":"Textbook async LLM service design. Last question: how do you evaluate LLM output quality at scale without human labellers for every response?"},
    {"turn":8,"speaker":"candidate","text":"I use LLM-as-a-judge for scalable eval. I maintain a golden dataset of 500 queries with human-labelled correct answers. For each model update or prompt change, I run the full golden set and have GPT-4 or Gemini Pro score each response on a rubric: factual accuracy, relevance, conciseness, and format compliance. I calculate aggregate scores and track trends in Grafana. For production monitoring, I sample 2% of live traffic, run LLM-as-a-judge in the background, and alert if quality drops below a threshold. I also collect thumbs up/down feedback in the UI and use those as additional signal. This gives me coverage without needing human annotators for every evaluation cycle."}
  ]'::jsonb,
  '{"summary":"Akshay demonstrated expert-level AI engineering knowledge — from RAG accuracy techniques to LangChain production trade-offs to async service architecture. Particularly strong on LLM evaluation strategy. This is a rare candidate for senior AI roles.","strengths":["Multi-layered RAG accuracy approach (hybrid search, output validation, audit log)","Pragmatic LangChain critique with concrete workarounds","Async FastAPI + Celery architecture for LLM throughput","LLM-as-a-judge eval strategy with golden dataset"],"areas_for_improvement":["Could quantify more — mentioned high-throughput but no specific RPS targets","Vector DB indexing strategies not mentioned (HNSW vs. IVFFlat trade-offs)"]}'::jsonb,
  86,
  '[{"skill":"RAG Engineering","score":92,"evidence":"Hybrid search, output validation against source, audit logging for compliance"},{"skill":"LangChain/Production LLM","score":86,"evidence":"Specific LangChain limitations with concrete workarounds, LangSmith tracing"},{"skill":"FastAPI/Async Python","score":88,"evidence":"Async queue architecture, rate limiting, circuit breaker, result caching"},{"skill":"LLM Evaluation","score":85,"evidence":"Golden dataset, LLM-as-a-judge, production sampling, UI feedback collection"}]'::jsonb,
  '["RAG accuracy multi-layer approach","Pragmatic engineering over framework magic","Comprehensive async architecture","Scalable eval without human annotators"]'::jsonb,
  '["No RPS numbers given for high-throughput claim","Vector DB index strategy not mentioned"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":9,"structure":9,"technical_depth":9,"confidence":9,"overall":9.0}'::jsonb,
  'strong_advance'
),

-- Gaurav Jain (ai_interviewed, score 81)
(
  gen_random_uuid(),
  'app00002-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000002',
  'technical',
  45, 42, 'completed',
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '9 days' + INTERVAL '3 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days' + INTERVAL '42 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Hello Gaurav! You built vernacular LLM features at Meesho. Tell me about the architecture of that system and the main engineering challenges."},
    {"turn":2,"speaker":"candidate","text":"The system generates product descriptions in 8 Indian languages for Meesho''s seller catalogue. Architecture: a FastAPI async service receives a batch of product attributes (name, category, key features) and target language. It constructs a prompt using a language-specific template, calls the LLM API (we use Gemini Pro for most languages), validates the output, and writes to PostgreSQL. For Hinglish — a mix of Hindi and English — we fine-tuned a smaller model because the base Gemini output was inconsistent. The main engineering challenge was quality variation across low-resource languages like Marathi and Bhojpuri — we built language-specific eval benchmarks and tuned generation parameters per language."},
    {"turn":3,"speaker":"ai","text":"Impressive. Tell me how you built the fine-tuning pipeline for the Hinglish model."},
    {"turn":4,"speaker":"candidate","text":"We collected 10K Hinglish product description examples from Meesho''s existing catalogue and cleaned them with native speaker review. We used LoRA fine-tuning on Llama 3 8B — efficient and deployable on a single A100. Training on GCP with Vertex AI custom training jobs. Evaluation: BLEU score baseline plus native speaker ratings on a 100-sample test set. We did 3 iterations — each iteration we identified failure patterns from native speaker feedback and added adversarial examples to the training set. Final model outperformed base Gemini Pro on Hinglish fluency by 23% on our internal benchmark."},
    {"turn":5,"speaker":"ai","text":"Great detail on the fine-tuning iteration. How do you handle the LLM in production when it generates an unacceptable output — what is your rejection and fallback strategy?"},
    {"turn":6,"speaker":"candidate","text":"Three layers: First, output schema validation — I define a Pydantic model for the expected response and validate every output. If the model returns malformed JSON or misses required fields, I retry with a corrective prompt up to 2 times. Second, content policy check — I run the output through a lightweight classifier that flags inappropriate content (we had incidents with competitive brand mentions). Third, length and quality heuristics — if the output is below 30 words or above 300 words for the target format, it fails quality checks and goes to a human review queue. In production about 2% of outputs hit the review queue daily."},
    {"turn":7,"speaker":"ai","text":"Solid fallback architecture. Last question: how do you keep the LLM service costs predictable at scale?"},
    {"turn":8,"speaker":"candidate","text":"Three strategies. First, caching: I hash the input (product attributes + language) and cache LLM outputs in Redis for 7 days. Since product catalogues don''t change frequently, about 40% of requests are cache hits. Second, batching: I batch single-item requests into groups of 20 before calling the API — reduces per-token overhead. Third, model routing: for simple products with fewer than 5 attributes, I route to a cheaper smaller model. Complex products with many attributes go to Gemini Pro. This tiered routing reduced our monthly LLM spend by 35% with no measurable quality degradation."}
  ]'::jsonb,
  '{"summary":"Gaurav showed strong practical AI engineering skills — fine-tuning pipeline, fallback architecture, and cost optimisation. Meesho multi-lingual experience is directly relevant. Slightly less depth on distributed systems than Akshay but very solid.","strengths":["LoRA fine-tuning pipeline with iterative improvement","Multi-layer output fallback (schema validation + content policy + heuristics)","Cost optimisation through caching, batching, and model routing"],"areas_for_improvement":["Less depth on FastAPI async architecture","Did not discuss monitoring/observability for the production LLM service"]}'::jsonb,
  81,
  '[{"skill":"LLM Fine-tuning","score":87,"evidence":"LoRA pipeline, iterative training with adversarial examples, BLEU + human eval"},{"skill":"Production LLM Engineering","score":82,"evidence":"Multi-layer fallback, content policy, 2% human review rate"},{"skill":"Cost Optimisation","score":84,"evidence":"Caching, batching, tiered model routing — 35% cost reduction"},{"skill":"FastAPI/Python","score":74,"evidence":"Mentioned async FastAPI but limited depth on architecture patterns"}]'::jsonb,
  '["LoRA fine-tuning expertise","Practical cost optimisation","Multi-layer output validation"]'::jsonb,
  '["Limited FastAPI async architecture depth","No observability/monitoring discussion"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":8,"structure":8,"technical_depth":8,"confidence":8,"overall":8.0}'::jsonb,
  'advance'
),

-- ── invited (2, Job 2) ────────────────────────────────────────────────────────
(
  gen_random_uuid(),
  'app00002-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000002',
  'technical', 45, NULL, 'invited',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
),
(
  gen_random_uuid(),
  'app00002-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000002',
  'technical', 45, NULL, 'invited',
  NOW(),
  NOW() + INTERVAL '7 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
),

-- ══════════════════════════════════════════════════════════════════════════════
-- JOB 3 · Frontend Developer (React)
-- ══════════════════════════════════════════════════════════════════════════════

-- Simran Kaur (ai_interviewed, score 83)
(
  gen_random_uuid(),
  'app00003-0001-0001-0001-000000000014',
  'dddddddd-0001-0001-0001-000000000003',
  'technical',
  40, 39, 'completed',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days' + INTERVAL '3 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days' + INTERVAL '39 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Welcome Simran! You built Groww''s portfolio dashboard with real-time updates. Walk me through how you handle high-frequency WebSocket updates in React without causing performance issues."},
    {"turn":2,"speaker":"candidate","text":"The challenge at Groww was that stock prices update every second for 200+ holdings, which would cause 200+ setState calls per second. My solution: I buffer incoming WebSocket messages in a ref (not state) at the socket handler level, and use a setInterval at 250ms to batch all buffered updates into a single setState call. This means React re-renders at most 4 times per second regardless of WebSocket frequency. I also use useMemo to memoize the sorted portfolio list and React.memo on each holding row, so only rows with changed prices re-render. Result: smooth 60fps UI even during market open."},
    {"turn":3,"speaker":"ai","text":"Excellent batching strategy. Tell me about how you built the Tailwind design system at Groww — what decisions went into it?"},
    {"turn":4,"speaker":"candidate","text":"We started by auditing our existing UI to extract the token set: colour palette, spacing scale, typography, border radius, shadows. We extended tailwind.config.ts with these brand tokens as CSS custom properties so they work with dark mode. We built component variants using the cva (class-variance-authority) library — it gives you a type-safe API for variant combinations like Button with variants for primary/secondary/ghost and sizes small/medium/large, all in Tailwind classes. We wrote every component with Storybook stories and included accessibility tests with axe. The design system is now in a separate package consumed by 3 frontend repositories."},
    {"turn":5,"speaker":"ai","text":"I like the cva approach. How do you handle form validation in React — what is your preferred pattern and why?"},
    {"turn":6,"speaker":"candidate","text":"React Hook Form with Zod for schema validation. The key advantage of React Hook Form is that it uses uncontrolled inputs by default — no re-render on every keystroke, which is critical for complex forms. Zod gives me type-safe schema definition shared between frontend and backend (we export the same schemas from a shared package). For complex forms with conditional fields — like Groww''s KYC flow — I use useFieldArray for dynamic sections and watch specific fields for conditional rendering. I avoid useEffect for field dependencies and use watch with conditional logic in the render function instead."},
    {"turn":7,"speaker":"ai","text":"Last question: how do you approach improving Core Web Vitals on a React application that is already in production?"},
    {"turn":8,"speaker":"candidate","text":"I start with measurement: Lighthouse in CI, WebPageTest for real-network profiles, and RUM (Real User Monitoring) with Vercel Analytics or Datadog to see p75 values by geography and device. For LCP I focus on the hero element — preload the LCP image with fetchpriority=high, avoid lazy loading above-the-fold images, eliminate any render-blocking scripts. For CLS I audit all images for explicit width/height, use aspect-ratio CSS for dynamic content containers, and avoid inserting content above existing content on load. For INP in React I use React Profiler to find expensive renders, apply useMemo and useCallback judiciously (not everywhere), and defer non-critical work with startTransition. At Groww we moved LCP from 3.8s to 2.1s and CLS from 0.18 to 0.04 with these techniques."}
  ]'::jsonb,
  '{"summary":"Simran demonstrated senior-level React performance expertise — WebSocket batching, Tailwind design system architecture, React Hook Form best practices, and data-driven Core Web Vitals improvement. Exactly the profile needed for this role.","strengths":["WebSocket batching with buffering + interval approach","cva-based Tailwind design system with proper token extraction","React Hook Form + Zod uncontrolled pattern","Quantified Core Web Vitals improvements (LCP 3.8s → 2.1s)"],"areas_for_improvement":["Could mention code-splitting and dynamic imports for bundle size","TypeScript generics depth not tested"]}'::jsonb,
  83,
  '[{"skill":"React Performance","score":90,"evidence":"WebSocket batching, React.memo, useMemo — quantified 60fps result"},{"skill":"Tailwind/Design Systems","score":86,"evidence":"cva, CSS custom properties, Storybook, separate DS package"},{"skill":"Forms","score":84,"evidence":"React Hook Form + Zod, useFieldArray, watch pattern for conditional fields"},{"skill":"Core Web Vitals","score":82,"evidence":"LCP, CLS, INP — specific techniques with measured improvements"}]'::jsonb,
  '["WebSocket performance batching","Data-driven CWV improvement process","Design system architecture depth"]'::jsonb,
  '["Bundle size/code splitting not discussed","TypeScript generics depth unknown"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":8,"structure":9,"technical_depth":8,"confidence":9,"overall":8.5}'::jsonb,
  'strong_advance'
),

-- Tarun Bose (ai_interviewed, score 77)
(
  gen_random_uuid(),
  'app00003-0001-0001-0001-000000000015',
  'dddddddd-0001-0001-0001-000000000003',
  'technical',
  40, 38, 'completed',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days' + INTERVAL '3 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '38 minutes',
  '[
    {"turn":1,"speaker":"ai","text":"Hi Tarun! You work at Zepto on the q-commerce frontend. Tell me about the most complex React state management challenge you faced."},
    {"turn":2,"speaker":"candidate","text":"The order tracking page had complex state: real-time location updates, ETA recalculation, status transitions, and rider chat — all simultaneously. Initially I used Redux for everything and it became unwieldy. I refactored to separate concerns: Zustand for UI state (modals, selected tab), React Query for server state (order details, ETA), and a custom WebSocket hook for real-time updates that directly updates the React Query cache using queryClient.setQueryData. This separation made the code much cleaner and the page more performant — we eliminated redundant API calls because React Query handled caching."},
    {"turn":3,"speaker":"ai","text":"Good state separation approach. Tell me about your experience with TypeScript — how do you handle complex generic types?"},
    {"turn":4,"speaker":"candidate","text":"I use TypeScript generics mostly for reusable component props and API response types. For example, our ApiResponse generic wraps all API calls with data, error, and status fields. For component props I use conditional types with generics to handle polymorphic components — like a Button that can render as an anchor tag when href is provided. I am comfortable with mapped types and utility types like Partial, Required, and Pick. I will admit that complex inferred conditional types still sometimes require trial and error."},
    {"turn":5,"speaker":"ai","text":"Honest answer. How do you test React components — what is your testing philosophy and strategy?"},
    {"turn":6,"speaker":"candidate","text":"I follow the testing trophy: mostly integration tests at the component level using React Testing Library, fewer unit tests for pure utility functions, and Playwright for critical user flows. My philosophy is test behaviour, not implementation — I query by role and text like a user would, not by className or data-testid. For the order tracking page I write tests that simulate WebSocket messages and assert on the visible text changes. I avoid testing internal state. One thing I improved at Zepto was adding snapshot tests for our most-used design system components to catch unintended visual regressions."},
    {"turn":7,"speaker":"ai","text":"Good testing philosophy. Last: how do you handle errors in a React application — what is your error boundary strategy?"},
    {"turn":8,"speaker":"candidate","text":"I use React error boundaries at route-level granularity — one error boundary per page route — so a crash in one section doesn''t take down the whole app. For async errors like failed API calls I handle them at the React Query level with the onError callback and show inline error states rather than crashing the component. I have a global error boundary at the app root as the last resort with a friendly error page and automatic error reporting to Sentry. For production debugging I always include the error boundary fallback with an error ID that maps to the Sentry trace."}
  ]'::jsonb,
  '{"summary":"Tarun showed solid React skills with good state management architecture and testing philosophy. TypeScript depth is adequate but not exceptional. Communication is clear. Good mid-level candidate — slightly below the senior bar but could grow quickly.","strengths":["State separation: Zustand + React Query + custom WebSocket hook","Testing philosophy aligned with React Testing Library best practices","Error boundary strategy with Sentry integration"],"areas_for_improvement":["TypeScript complex generic types — acknowledged gaps","Core Web Vitals not mentioned despite q-commerce context (performance critical)","Could be stronger on accessibility answers"]}'::jsonb,
  77,
  '[{"skill":"React State Management","score":82,"evidence":"Zustand + React Query + WebSocket hook separation, queryClient.setQueryData"},{"skill":"TypeScript","score":72,"evidence":"Comfortable with generics and utility types, honest about limitations on complex inference"},{"skill":"Testing","score":80,"evidence":"Integration-first, behaviour testing, snapshot for DS components"},{"skill":"Error Handling","score":78,"evidence":"Route-level error boundaries, React Query onError, Sentry integration"}]'::jsonb,
  '["State management architecture","Testing philosophy","Error handling strategy"]'::jsonb,
  '["TypeScript advanced generics gaps","No CWV discussion","A11y depth limited"]'::jsonb,
  'low',
  '[]'::jsonb,
  '{"clarity":8,"structure":8,"technical_depth":7,"confidence":7,"overall":7.5}'::jsonb,
  'advance'
),

-- ── invited (2, Job 3) ────────────────────────────────────────────────────────
(
  gen_random_uuid(),
  'app00003-0001-0001-0001-000000000012',
  'dddddddd-0001-0001-0001-000000000003',
  'technical', 40, NULL, 'invited',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
),
(
  gen_random_uuid(),
  'app00003-0001-0001-0001-000000000013',
  'dddddddd-0001-0001-0001-000000000003',
  'technical', 40, NULL, 'invited',
  NOW(),
  NOW() + INTERVAL '7 days',
  NULL, NULL,
  '[]'::jsonb, NULL, NULL, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, NULL, '[]'::jsonb, NULL, NULL
);

-- Batch 5 complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 11 · HUMAN INTERVIEWS  (1 per job, for the human_interview stage applicant)
-- =============================================================================

INSERT INTO public.human_interviews (
  id, applicant_id, job_post_id, interviewer_id,
  round_number, interview_type, scheduled_at, duration_minutes,
  meeting_link, status, notes
)
VALUES
-- Job 1: Ishaan Malhotra — Technical Deep-Dive
(
  'ffffffff-0001-0001-0001-000000000001',
  'app00001-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  4, 'technical',
  NOW() + INTERVAL '3 days',
  60,
  'https://meet.google.com/abc-defg-hij',
  'scheduled',
  'AI interview score: 88. Focus on system design for distributed systems. Probe on Kubernetes experience and cost optimisation examples.'
),
-- Job 2: Prateek Bansal — System Design: AI Infra
(
  'ffffffff-0001-0001-0001-000000000002',
  'app00002-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000002',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  4, 'technical',
  NOW() + INTERVAL '5 days',
  60,
  'https://meet.google.com/xyz-uvwx-yz1',
  'scheduled',
  'AI interview score: 90. Zomato LLM platform lead. Deep dive on LLM Ops architecture, cost attribution, and multi-model routing strategy.'
),
-- Job 3: Harshita Sharma — Frontend Technical Round
(
  'ffffffff-0001-0001-0001-000000000003',
  'app00003-0001-0001-0001-000000000016',
  'dddddddd-0001-0001-0001-000000000003',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  3, 'technical',
  NOW() + INTERVAL '7 days',
  60,
  'https://meet.google.com/pqr-stuv-wx2',
  'scheduled',
  'AI interview score: 87. CRED design system lead. Live coding: build a polymorphic component with TypeScript. Also probe on Playwright visual regression testing setup.'
);

-- =============================================================================
-- SECTION 12 · INTERVIEW PARTICIPANTS
-- =============================================================================

INSERT INTO public.interview_participants (human_interview_id, user_id, role, response_status)
VALUES
(
  'ffffffff-0001-0001-0001-000000000001',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'lead',
  'accepted'
),
(
  'ffffffff-0001-0001-0001-000000000002',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'lead',
  'accepted'
),
(
  'ffffffff-0001-0001-0001-000000000003',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'lead',
  'accepted'
);

-- =============================================================================
-- SECTION 13 · CANDIDATE NOTES
-- (Written by employer on the human_interview stage candidates)
-- =============================================================================

INSERT INTO public.candidate_notes (applicant_id, author_id, body)
VALUES
(
  'app00001-0001-0001-0001-000000000016',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Ishaan is an IIT Delhi grad with 7 years at Nagarro. AI interview score 88 — strongest App Router depth in the funnel. Confirmed 1M+ user production experience. CTC ask is 48 LPA — within budget. Key question for technical round: probe his Kubernetes knowledge and whether he can lead a migration to EKS.'
),
(
  'app00002-0001-0001-0001-000000000016',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Prateek leads the LLM platform at Zomato — 4 engineers, 100K RPS. AI interview score 90 — best AI engineering responses we have seen. His LLM Ops observability approach is exactly what we need. CTC ask is 60 LPA — stretches the band but might be worth it for this profile. Verify: does he want to remain IC or move to management here?'
),
(
  'app00003-0001-0001-0001-000000000016',
  (SELECT id FROM public.users WHERE email = :'employer_email'),
  'Harshita leads CRED''s design system (200+ components). AI interview score 87. Her a11y programme experience is unique in this funnel. CTC ask 44 LPA. Live coding task: polymorphic Button component with TypeScript. Also ask about her approach to migrating legacy class-based components she might encounter in our codebase.'
);

-- =============================================================================
-- SECTION 14 · CANDIDATE VOTES
-- (Employer votes on ai_interviewed and human_interview candidates)
-- =============================================================================

INSERT INTO public.candidate_votes (applicant_id, voter_id, vote)
VALUES
-- Job 1
('app00001-0001-0001-0001-000000000014', (SELECT id FROM public.users WHERE email = :'employer_email'), 'strong_hire'),   -- Pooja Verma
('app00001-0001-0001-0001-000000000015', (SELECT id FROM public.users WHERE email = :'employer_email'), 'hire'),          -- Nikhil Rao
('app00001-0001-0001-0001-000000000016', (SELECT id FROM public.users WHERE email = :'employer_email'), 'strong_hire'),   -- Ishaan Malhotra
-- Job 2
('app00002-0001-0001-0001-000000000014', (SELECT id FROM public.users WHERE email = :'employer_email'), 'strong_hire'),   -- Akshay Kulkarni
('app00002-0001-0001-0001-000000000015', (SELECT id FROM public.users WHERE email = :'employer_email'), 'hire'),          -- Gaurav Jain
-- Job 3
('app00003-0001-0001-0001-000000000014', (SELECT id FROM public.users WHERE email = :'employer_email'), 'strong_hire'),   -- Simran Kaur
('app00003-0001-0001-0001-000000000015', (SELECT id FROM public.users WHERE email = :'employer_email'), 'hire'),          -- Tarun Bose
('app00003-0001-0001-0001-000000000016', (SELECT id FROM public.users WHERE email = :'employer_email'), 'strong_hire');   -- Harshita Sharma

-- Batch 6 complete ✓
-- =============================================================================

-- =============================================================================
-- SECTION 15 · EXTERNAL JOBS (jobs table — seeker job board)
-- Accenture + Capgemini scraped listings
-- =============================================================================

INSERT INTO public.jobs (
  id, source, fingerprint, url, title, company_name, company_logo_url,
  location, city, state, country, work_mode, job_type,
  description, skills_required, skills_nice_to_have,
  experience_min, experience_max, salary_min, salary_max, salary_currency,
  is_active, posted_at, is_easy_apply, apply_url
)
VALUES
(
  'eeee0001-0001-0001-0001-000000000001',
  'direct',
  'accenture-fullstack-blr-001',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00001',
  'Full Stack Developer (React/Node.js)',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Bengaluru, Karnataka', 'Bengaluru', 'Karnataka', 'India',
  'hybrid', 'fulltime',
  'Accenture is looking for a Full Stack Developer to join our Digital Engineering practice. You will build enterprise-grade applications using React and Node.js for our global clients across BFSI and retail sectors.

Key Responsibilities:
• Develop scalable React and Node.js applications
• Integrate with RESTful and GraphQL APIs
• Participate in Agile ceremonies and sprint planning
• Collaborate with cross-functional global teams',
  ARRAY['React','Node.js','TypeScript','REST APIs','Git'],
  ARRAY['GraphQL','AWS','Docker','PostgreSQL'],
  3, 7,
  1800000, 3200000, 'INR',
  true,
  NOW() - INTERVAL '5 days',
  true,
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00001'
),
(
  'eeee0001-0001-0001-0001-000000000002',
  'direct',
  'accenture-cloud-engineer-hyd-001',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00002',
  'Cloud Infrastructure Engineer (AWS)',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Hyderabad, Telangana', 'Hyderabad', 'Telangana', 'India',
  'hybrid', 'fulltime',
  'Join Accenture Cloud First practice to design, build, and manage cloud infrastructure for Fortune 500 clients. You will architect resilient AWS solutions, implement Infrastructure as Code, and ensure cloud security best practices.',
  ARRAY['AWS','Terraform','Docker','Kubernetes','Linux','Python'],
  ARRAY['Azure','GCP','Ansible','Prometheus','Grafana'],
  4, 8,
  2200000, 4000000, 'INR',
  true,
  NOW() - INTERVAL '3 days',
  false,
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00002'
),
(
  'eeee0001-0001-0001-0001-000000000003',
  'direct',
  'accenture-data-engineer-blr-001',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00003',
  'Senior Data Engineer (Spark/Python)',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Bengaluru, Karnataka', 'Bengaluru', 'Karnataka', 'India',
  'remote', 'fulltime',
  'Accenture''s Data & AI practice is seeking a Senior Data Engineer to build large-scale data pipelines for enterprise analytics platforms. You will design ETL workflows, optimise Spark jobs, and ensure data quality at scale.',
  ARRAY['Python','Apache Spark','SQL','AWS S3','Airflow','Pandas'],
  ARRAY['dbt','Snowflake','Databricks','Kafka','Great Expectations'],
  5, 9,
  2500000, 4500000, 'INR',
  true,
  NOW() - INTERVAL '7 days',
  true,
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00003'
),
(
  'eeee0001-0001-0001-0001-000000000004',
  'direct',
  'accenture-product-manager-mum-001',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00004',
  'Product Manager — FinTech',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 'India',
  'hybrid', 'fulltime',
  'We are looking for a Product Manager to define and drive digital product strategy for our FinTech clients. You will work with engineering, design, and business stakeholders to ship products that solve real financial challenges.',
  ARRAY['Product Management','Agile','User Research','SQL','Jira','Roadmapping'],
  ARRAY['Figma','Python','A/B Testing','OKRs','FinTech domain knowledge'],
  5, 10,
  3000000, 5500000, 'INR',
  true,
  NOW() - INTERVAL '10 days',
  false,
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00004'
),
(
  'eeee0001-0001-0001-0001-000000000005',
  'direct',
  'capgemini-react-dev-pune-001',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-react-001',
  'React Developer (Mid-Senior)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Pune, Maharashtra', 'Pune', 'Maharashtra', 'India',
  'hybrid', 'fulltime',
  'Capgemini''s Engineering Services is hiring a React Developer to build modern web applications for our manufacturing and automotive clients. You will collaborate with global teams and architect reusable frontend solutions.',
  ARRAY['React','JavaScript','TypeScript','REST APIs','CSS','Git'],
  ARRAY['Next.js','Tailwind CSS','React Query','Jest','Storybook'],
  3, 7,
  1600000, 2800000, 'INR',
  true,
  NOW() - INTERVAL '4 days',
  true,
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-react-001'
),
(
  'eeee0001-0001-0001-0001-000000000006',
  'direct',
  'capgemini-python-ai-blr-001',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-python-ai-001',
  'Python AI Developer (LLM/GenAI)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Bengaluru, Karnataka', 'Bengaluru', 'Karnataka', 'India',
  'remote', 'fulltime',
  'Capgemini''s Intelligent Industry practice is hiring a Python AI Developer to build GenAI solutions for enterprise clients. You will implement LLM-powered features, design RAG pipelines, and integrate AI into production workflows using FastAPI.',
  ARRAY['Python','FastAPI','LangChain','OpenAI API','PostgreSQL','Docker'],
  ARRAY['Gemini API','pgvector','PyTorch','GCP','Kubernetes'],
  4, 8,
  2400000, 4200000, 'INR',
  true,
  NOW() - INTERVAL '2 days',
  false,
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-python-ai-001'
),
(
  'eeee0001-0001-0001-0001-000000000007',
  'direct',
  'capgemini-devops-hyd-001',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-devops-001',
  'Senior DevOps Engineer (Kubernetes/Terraform)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Hyderabad, Telangana', 'Hyderabad', 'Telangana', 'India',
  'hybrid', 'fulltime',
  'Seeking a Senior DevOps Engineer to design and manage CI/CD pipelines and cloud infrastructure for Capgemini''s enterprise clients. You will implement GitOps workflows, manage Kubernetes clusters, and drive infrastructure automation.',
  ARRAY['Kubernetes','Docker','Terraform','AWS','CI/CD','GitOps','Linux'],
  ARRAY['Helm','ArgoCD','Prometheus','Grafana','Python','Azure DevOps'],
  5, 9,
  2800000, 5000000, 'INR',
  true,
  NOW() - INTERVAL '6 days',
  true,
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-devops-001'
),
(
  'eeee0001-0001-0001-0001-000000000008',
  'direct',
  'capgemini-frontend-lead-mum-001',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-frontend-lead-001',
  'Frontend Lead (Next.js/Design Systems)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 'India',
  'onsite', 'fulltime',
  'Capgemini is looking for a Frontend Lead to head the UI engineering practice for a strategic banking client. You will define frontend architecture, build a design system, and mentor a team of 6 frontend engineers.',
  ARRAY['Next.js','React','TypeScript','Tailwind CSS','Design Systems','Team Leadership'],
  ARRAY['Storybook','Playwright','Figma','AWS','Performance Optimisation'],
  7, 12,
  4000000, 7000000, 'INR',
  true,
  NOW() - INTERVAL '8 days',
  false,
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-frontend-lead-001'
);

-- =============================================================================
-- SECTION 16 · SEEKER APPLICATION TRACKER (applications table)
-- Linked to your seeker account — 5 rows across all status stages
-- =============================================================================

INSERT INTO public.applications (
  id, user_id, job_id, job_title, company_name, company_logo_url,
  location, job_url, job_source, status, status_history,
  applied_at, notes, position_order
)
VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'eeee0001-0001-0001-0001-000000000001',
  'Full Stack Developer (React/Node.js)',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Bengaluru, Karnataka',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00001',
  'direct',
  'applied',
  '[{"status":"saved","timestamp":"2026-04-05T09:00:00Z"},{"status":"applied","timestamp":"2026-04-07T10:30:00Z"}]'::jsonb,
  NOW() - INTERVAL '7 days',
  'Applied via Accenture careers portal. Tailored my resume to emphasise Next.js and Node.js projects.',
  1
),
(
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'eeee0001-0001-0001-0001-000000000006',
  'Python AI Developer (LLM/GenAI)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Bengaluru, Karnataka',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-python-ai-001',
  'direct',
  'interview',
  '[{"status":"saved","timestamp":"2026-04-03T14:00:00Z"},{"status":"applied","timestamp":"2026-04-04T11:00:00Z"},{"status":"interview","timestamp":"2026-04-10T09:00:00Z"}]'::jsonb,
  NOW() - INTERVAL '10 days',
  'Interview scheduled for next week. Prepare: LangChain RAG architecture, FastAPI async patterns, Pydantic v2.',
  2
),
(
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'eeee0001-0001-0001-0001-000000000005',
  'React Developer (Mid-Senior)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Pune, Maharashtra',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-react-001',
  'direct',
  'offer',
  '[{"status":"applied","timestamp":"2026-04-01T10:00:00Z"},{"status":"interview","timestamp":"2026-04-06T12:00:00Z"},{"status":"offer","timestamp":"2026-04-11T15:00:00Z"}]'::jsonb,
  NOW() - INTERVAL '13 days',
  'Offer received: 24 LPA. Considering — location is Pune (preference is Bengaluru). Decision by April 20.',
  3
),
(
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'eeee0001-0001-0001-0001-000000000004',
  'Product Manager — FinTech',
  'Accenture India',
  'https://logo.clearbit.com/accenture.com',
  'Mumbai, Maharashtra',
  'https://www.accenture.com/in-en/careers/jobdetails?id=ACNJP00004',
  'direct',
  'rejected',
  '[{"status":"applied","timestamp":"2026-03-28T09:00:00Z"},{"status":"rejected","timestamp":"2026-04-08T16:00:00Z"}]'::jsonb,
  NOW() - INTERVAL '17 days',
  'Rejection email received. Feedback: looking for more FinTech domain experience. Follow up with recruiter.',
  4
),
(
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'eeee0001-0001-0001-0001-000000000007',
  'Senior DevOps Engineer (Kubernetes/Terraform)',
  'Capgemini India',
  'https://logo.clearbit.com/capgemini.com',
  'Hyderabad, Telangana',
  'https://www.capgemini.com/in-en/careers/jobs/capgemini-devops-001',
  'direct',
  'saved',
  '[{"status":"saved","timestamp":"2026-04-12T11:00:00Z"}]'::jsonb,
  NULL,
  'Interested but DevOps is not primary stack. Review JD more carefully before applying.',
  5
);

-- =============================================================================
-- SECTION 17 · FITVECTOR APPLICATION + APPLICANT ROW
-- Links seeker account to Cognizant Job 1 for end-to-end WebSocket testing.
-- Log in as seeker → see your application.
-- Log in as employer → drag seeker across Kanban stages.
-- =============================================================================

-- Seeker applicant row (employer-side Kanban)
INSERT INTO public.applicants (
  id, job_post_id, user_id, name, email, phone,
  role_title, current_company, experience, source, pipeline_stage, bucket,
  screening_score, screening_breakdown, screening_summary, resume_parsed_json
)
SELECT
  'seeker00-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000001',
  u.id,
  COALESCE(u.full_name, split_part(u.email, '@', 1)),
  u.email,
  '+91-9999999999',
  'Full Stack Developer',
  'Self',
  4,
  'fitvector_organic',
  'applied',
  'good_fit',
  74,
  '{"skills":26,"experience":16,"education":14,"role_match":18}'::jsonb,
  'Your seeker account. Use this to test the WebSocket end-to-end: log in as employer and drag this card across the Kanban to see real-time status updates on the seeker dashboard.',
  '{"name":"Seeker Account","email":"your-seeker@email.com","experience_years":4,"skills":["Next.js","React","TypeScript","Node.js","PostgreSQL"]}'::jsonb
FROM public.users u
WHERE u.email = :'seeker_email';

-- FitVector application row (seeker-side tracker)
INSERT INTO public.fitvector_applications (
  applicant_user_id, job_post_id, applicant_id,
  match_score, status, status_timeline,
  interest_note, resume_name, is_boosted
)
SELECT
  u.id,
  'dddddddd-0001-0001-0001-000000000001',
  'seeker00-0001-0001-0001-000000000001',
  74,
  'applied',
  '[{"status":"applied","timestamp":"2026-04-14T08:00:00Z","note":"Applied via FitVector"}]'::jsonb,
  'Excited about working on Next.js at scale at Cognizant. I have 4 years of full stack experience and want to grow into a senior role.',
  'my_resume_fullstack.pdf',
  false
FROM public.users u
WHERE u.email = :'seeker_email';

-- =============================================================================
-- SECTION 18 · COMMUNITY POSTS + COMMENTS
-- =============================================================================

INSERT INTO public.community_posts (
  user_id, post_type, title, body, category, is_anonymous,
  upvotes, downvotes, comments_count, status, interview_data
)
VALUES
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'interview_experience',
  'Cognizant Senior Full Stack Interview Experience (Next.js/Node.js) — April 2026',
  'Just completed all 4 rounds at Cognizant for the Senior Full Stack Engineer role. Sharing my experience for the community.

**Round 1 — AI Screen:** Automated screening questions about Next.js App Router, PostgreSQL optimisation, and experience. Pretty straightforward if you know your stuff.

**Round 2 — Technical Assessment (60 min):** 5 MCQs on React/Next.js concepts + 2 coding problems. One was a debounce implementation in Node.js, the other was a SQL CTE query. The debounce was standard, the SQL was trickier than expected — make sure you know CTEs well.

**Round 3 — AI Video Interview:** 45 min async video interview. 4 questions on Next.js internals, PostgreSQL debugging, system design for real-time notifications. The AI interviewer was surprisingly natural.

**Round 4 — Human Technical Round:** 1 hour with the engineering manager. Deep dive on system design — I got a distributed notification system question (similar to Round 3!). Also discussed my experience leading migrations.

Overall: rigorous process but fair. Prepare your EXPLAIN ANALYZE stories and a solid system design answer.',
  'tech',
  false,
  24, 1, 3,
  'published',
  '{"company":"Cognizant","role":"Senior Full Stack Engineer","location":"Bengaluru","result":"Pending","rounds":[{"round":1,"type":"AI Screen","duration":"15min","difficulty":"medium"},{"round":2,"type":"Technical Assessment","duration":"60min","difficulty":"hard"},{"round":3,"type":"AI Video Interview","duration":"45min","difficulty":"hard"},{"round":4,"type":"Technical","duration":"60min","difficulty":"hard"}]}'::jsonb
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'discussion',
  'Next.js App Router vs Pages Router in 2026 — which are you using in production?',
  'Curious where the community is at with Next.js App Router adoption. I started migrating our product from Pages Router to App Router 6 months ago and here are my honest takes:

**Pros:**
- Server Components are genuinely great for data-heavy pages — co-located fetch, no waterfall, faster TTFB
- Server Actions cleaned up a LOT of our API route boilerplate
- Streaming with Suspense for perceived performance is excellent

**Cons:**
- Edge cases with cookies and session in server components took time to figure out
- Some third-party libraries not compatible with server components yet
- The mental model shift is real — junior devs struggled for the first month

Overall I am bullish on App Router. What is your experience?',
  'tech',
  false,
  41, 3, 7,
  'published',
  NULL
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'interview_experience',
  'Razorpay SDE-2 Frontend Interview — Rejected but learned a lot',
  'Applied for SDE-2 Frontend at Razorpay. 3 rounds, did not get through. Sharing for transparency.

**Round 1 — DSA (90 min):** LeetCode medium on sliding window, one on graph traversal. I solved both but the graph one was not clean. Lesson: practice more graph problems.

**Round 2 — Frontend Machine Coding (90 min):** Build a multi-select dropdown with keyboard navigation, search, and virtual scrolling. I built the core functionality but the virtual scrolling was incomplete. This is where I lost it.

**Round 3 — System Design:** Design a real-time collaborative doc editor (like Google Docs lite). I gave a decent answer with OT/CRDT discussion but the interviewer pushed hard on conflict resolution edge cases I had not prepared.

Net: frontend machine coding practice is non-negotiable for product companies. I am practising on GreatFrontend now.',
  'tech',
  true,
  67, 2, 12,
  'published',
  '{"company":"Razorpay","role":"SDE-2 Frontend","location":"Bengaluru","result":"Rejected","rounds":[{"round":1,"type":"DSA","duration":"90min"},{"round":2,"type":"Machine Coding","duration":"90min"},{"round":3,"type":"System Design","duration":"60min"}]}'::jsonb
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'interview_experience',
  'Google India L4 SWE — Final Round Experience (2026)',
  'Completed Google India L4 onsite. 5 rounds in one day, sharing the structure.

**DSA (2 rounds):** One on trees with a tricky follow-up on serialisation. One on dynamic programming — coin change variant. Both solved but not perfectly.

**System Design:** Design a URL shortener at Google scale. Focus was on consistent hashing, data model, and global CDN strategy.

**Behavioural:** STAR format. Questions on ownership, conflict resolution, impact.

**Googleyness:** Cultural fit, how you handle ambiguity.

The coding bar is real — Google expects clean, bug-free code under pressure. My advice: practise writing code in a plain text editor, not an IDE. No autocomplete in real interviews.',
  'tech',
  true,
  134, 4, 19,
  'published',
  '{"company":"Google India","role":"SWE L4","location":"Hyderabad","result":"Pending","rounds":[{"round":1,"type":"DSA","duration":"45min"},{"round":2,"type":"DSA","duration":"45min"},{"round":3,"type":"System Design","duration":"60min"},{"round":4,"type":"Behavioural","duration":"45min"},{"round":5,"type":"Googleyness","duration":"45min"}]}'::jsonb
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'discussion',
  'How are you all preparing for AI Engineer roles in 2026? Resources that worked for me',
  'After 6 months of job searching specifically for AI Engineer roles (Python/FastAPI/LLM focus), here are the resources that actually moved the needle for me:

**LLM Engineering:**
- "Building LLMs for Production" book — practical, not academic
- LangChain docs + source code (reading the source taught me more than tutorials)
- Anthropic + Google cookbook repos on GitHub

**FastAPI:**
- Tiangolo''s own advanced tutorials — most courses skip the async stuff
- Writing a production-grade FastAPI project from scratch (most important)

**System Design for AI:**
- Chip Huyen''s blog on ML system design
- Designing ML Systems (book) — essential

**For interviews specifically:**
- LeetCode Python — still required at most companies
- Pramp for mock interviews

What worked for you? Drop your resources below.',
  'tech',
  false,
  89, 2, 14,
  'published',
  NULL
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'interview_experience',
  'Flipkart SDE-2 Backend (Python) — Offer Accepted!',
  'Got an offer from Flipkart for SDE-2 Backend. Here is the full process for people targeting similar roles.

**Round 1 — DSA (60 min):** Two Sum + a harder question on interval merging. Standard LeetCode medium.

**Round 2 — LLD (90 min):** Design a parking lot system in Python. Focus was on OOP principles, SOLID, and extensibility. I used Strategy + Observer patterns which the interviewer liked.

**Round 3 — HLD (60 min):** Design Flipkart''s flash sale system (handle 10M concurrent users for a 15-minute sale). Key: pre-warming cache, queue-based inventory management, circuit breakers.

**Round 4 — Hiring Manager:** Culture fit + career goals. Discussed Python expertise and where I want to go.

CTC offered: 32 LPA + 15% variable. Happy with it.',
  'career_advice',
  false,
  203, 6, 28,
  'published',
  '{"company":"Flipkart","role":"SDE-2 Backend (Python)","location":"Bengaluru","result":"Offer Accepted","ctc_offered":"32 LPA","rounds":[{"round":1,"type":"DSA","duration":"60min"},{"round":2,"type":"LLD","duration":"90min"},{"round":3,"type":"HLD","duration":"60min"},{"round":4,"type":"Hiring Manager","duration":"45min"}]}'::jsonb
);

-- =============================================================================
-- SECTION 19 · SALARY REPORTS  (10 INR data points)
-- =============================================================================

INSERT INTO public.salary_reports (
  user_id, role_title, company_name, company_size,
  location, experience_years, base_salary, total_compensation, currency, is_verified
)
VALUES
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Senior Full Stack Engineer', 'Cognizant Technology Solutions', '1000+',
  'Bengaluru, Karnataka', 6, 2800000, 3200000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Full Stack Engineer', 'Accenture India', '1000+',
  'Bengaluru, Karnataka', 4, 1900000, 2200000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'AI Engineer (Python/FastAPI)', 'Razorpay', '1000+',
  'Bengaluru, Karnataka', 5, 3200000, 3800000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Senior AI/ML Engineer', 'Flipkart', '1000+',
  'Bengaluru, Karnataka', 6, 3800000, 4500000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Frontend Developer (React)', 'Capgemini India', '1000+',
  'Pune, Maharashtra', 3, 1500000, 1700000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Senior Frontend Engineer', 'CRED', '201-1000',
  'Bengaluru, Karnataka', 6, 4000000, 4800000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Staff Frontend Engineer', 'Swiggy', '1000+',
  'Bengaluru, Karnataka', 8, 5500000, 6500000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Python Developer (FastAPI)', 'Freshworks', '1000+',
  'Chennai, Tamil Nadu', 4, 1700000, 2000000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Technical Lead (Full Stack)', 'Mphasis', '1000+',
  'Bengaluru, Karnataka', 8, 4200000, 5000000, 'INR', false
),
(
  (SELECT id FROM public.users WHERE email = :'seeker_email'),
  'Software Engineer II (Node.js)', 'HCL Technologies', '1000+',
  'Noida, Uttar Pradesh', 4, 1600000, 1850000, 'INR', false
);

-- =============================================================================
-- SECTION 20 · USER REPUTATION (seeker account)
-- =============================================================================

INSERT INTO public.user_reputation (user_id, karma_points, helpful_reviews_count, interview_experiences_count)
SELECT id, 142, 3, 3
FROM public.users
WHERE email = :'seeker_email'
ON CONFLICT (user_id) DO UPDATE
SET karma_points = 142,
    helpful_reviews_count = 3,
    interview_experiences_count = 3;

-- =============================================================================
-- SEED COMPLETE ✓
-- =============================================================================
-- Tables seeded:
--   companies (3), company_members (1), interview_panels (2)
--   question_bank (12), assessments (2)
--   job_posts (3), applicants (52 = 51 seeded + 1 seeker)
--   assessment_submissions (8), ai_interviews (12 = 6 completed + 6 invited)
--   human_interviews (3), interview_participants (3)
--   candidate_notes (3), candidate_votes (8)
--   jobs/external (8), applications/tracker (5)
--   fitvector_applications (1), community_posts (6)
--   salary_reports (10), user_reputation (1)
--
-- HOW TO RUN:
--   1. Edit the \set lines at the top with your real email addresses.
--   2. Supabase SQL Editor → paste the entire file → Run
--      OR: psql $DATABASE_URL < supabase/seed.sql
--      OR: npx supabase db reset  (applies migrations + seed.sql together)
-- =============================================================================






