-- ============================================================================
-- Question Bank: 12 hand-crafted, language-agnostic coding problems
-- starter_code / solution_code: JSONB { language -> code }
-- test_cases: JSONB [{ input: stdin, expectedOutput: stdout }]
-- Supported languages: python3, nodejs, java, cpp17
-- Safe to re-run: each INSERT skips if title already exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_bank (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  difficulty    TEXT        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prompt        TEXT        NOT NULL,
  starter_code  JSONB       NOT NULL DEFAULT '{}',
  solution_code JSONB       NOT NULL DEFAULT '{}',
  test_cases    JSONB       NOT NULL DEFAULT '[]',
  tags          TEXT[]      DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qb_category   ON question_bank (category);
CREATE INDEX IF NOT EXISTS idx_qb_difficulty ON question_bank (difficulty);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Two Sum
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Two Sum',
  'Arrays',
  'easy',
  'Given an array of integers and a target, return the 0-based indices of the two numbers that add up to the target. Exactly one solution exists. Output the two indices separated by a space (smaller index first).

Input:
  Line 1: n (array length)
  Line 2: n space-separated integers
  Line 3: target integer

Output: "i j"',
  $sc${
    "python3": "def two_sum(nums, target):\n    # your code here\n    pass\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nresult = two_sum(nums, target)\nprint(result[0], result[1])",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  const target = parseInt(lines[2]);\n  function twoSum(nums, target) {\n    // your code here\n  }\n  const r = twoSum(nums, target);\n  console.log(r[0] + ' ' + r[1]);\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static int[] twoSum(int[] nums, int target) {\n    // your code here\n    return new int[]{};\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n    int[] r = twoSum(nums, target);\n    System.out.println(r[0] + \" \" + r[1]);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n  // your code here\n  return {};\n}\nint main() {\n  int n; cin >> n;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  int target; cin >> target;\n  auto r = twoSum(nums, target);\n  cout << r[0] << \" \" << r[1] << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def two_sum(nums, target):\n    seen = {}\n    for i, v in enumerate(nums):\n        if target - v in seen:\n            return [seen[target - v], i]\n        seen[v] = i\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nresult = two_sum(nums, target)\nprint(result[0], result[1])",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  const target = parseInt(lines[2]);\n  function twoSum(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n      const comp = target - nums[i];\n      if (seen[comp] !== undefined) return [seen[comp], i];\n      seen[nums[i]] = i;\n    }\n  }\n  const r = twoSum(nums, target);\n  console.log(r[0] + ' ' + r[1]);\n});",
    "java": "import java.util.*;\npublic class Main {\n  static int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> map = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n      int comp = target - nums[i];\n      if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n      map.put(nums[i], i);\n    }\n    return new int[]{};\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n    int[] r = twoSum(nums, target);\n    System.out.println(r[0] + \" \" + r[1]);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\n#include<unordered_map>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int,int> m;\n  for (int i = 0; i < (int)nums.size(); i++) {\n    int comp = target - nums[i];\n    if (m.count(comp)) return {m[comp], i};\n    m[nums[i]] = i;\n  }\n  return {};\n}\nint main() {\n  int n; cin >> n;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  int target; cin >> target;\n  auto r = twoSum(nums, target);\n  cout << r[0] << \" \" << r[1] << endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "4\n2 7 11 15\n9",  "expectedOutput": "0 1"},
    {"input": "3\n3 2 4\n6",       "expectedOutput": "1 2"},
    {"input": "2\n3 3\n6",         "expectedOutput": "0 1"},
    {"input": "4\n1 2 3 4\n7",     "expectedOutput": "2 3"},
    {"input": "3\n-1 -2 -3\n-3",   "expectedOutput": "0 1"},
    {"input": "5\n1 5 2 8 3\n10",  "expectedOutput": "2 3"}
  ]$tc$::jsonb,
  ARRAY['arrays', 'hashmap', 'leetcode-classic']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Two Sum');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Maximum Subarray
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Maximum Subarray',
  'Arrays',
  'medium',
  'Given an array of integers, find the contiguous subarray with the largest sum and return that sum. (Kadane''s algorithm)

Input:
  Line 1: n (array length)
  Line 2: n space-separated integers

Output: maximum subarray sum as an integer',
  $sc${
    "python3": "def max_subarray(nums):\n    # your code here\n    pass\n\nn = int(input())\nnums = list(map(int, input().split()))\nprint(max_subarray(nums))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  function maxSubarray(nums) {\n    // your code here\n  }\n  console.log(maxSubarray(nums));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static int maxSubarray(int[] nums) {\n    // your code here\n    return 0;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    System.out.println(maxSubarray(nums));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n  // your code here\n  return 0;\n}\nint main() {\n  int n; cin >> n;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  cout << maxSubarray(nums) << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def max_subarray(nums):\n    best = cur = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best\n\nn = int(input())\nnums = list(map(int, input().split()))\nprint(max_subarray(nums))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  function maxSubarray(nums) {\n    let best = nums[0], cur = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n      cur = Math.max(nums[i], cur + nums[i]);\n      best = Math.max(best, cur);\n    }\n    return best;\n  }\n  console.log(maxSubarray(nums));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static int maxSubarray(int[] nums) {\n    int best = nums[0], cur = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n      cur = Math.max(nums[i], cur + nums[i]);\n      best = Math.max(best, cur);\n    }\n    return best;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    System.out.println(maxSubarray(nums));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\n#include<algorithm>\nusing namespace std;\nint maxSubarray(vector<int>& nums) {\n  int best = nums[0], cur = nums[0];\n  for (int i = 1; i < (int)nums.size(); i++) {\n    cur = max(nums[i], cur + nums[i]);\n    best = max(best, cur);\n  }\n  return best;\n}\nint main() {\n  int n; cin >> n;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  cout << maxSubarray(nums) << endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "9\n-2 1 -3 4 -1 2 1 -5 4",  "expectedOutput": "6"},
    {"input": "1\n1",                         "expectedOutput": "1"},
    {"input": "1\n-1",                        "expectedOutput": "-1"},
    {"input": "5\n1 2 3 4 5",                 "expectedOutput": "15"},
    {"input": "5\n-5 -4 -3 -2 -1",           "expectedOutput": "-1"},
    {"input": "6\n2 -1 2 3 4 -5",            "expectedOutput": "10"}
  ]$tc$::jsonb,
  ARRAY['arrays', 'dynamic-programming', 'kadane']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Maximum Subarray');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Merge Sorted Arrays
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Merge Sorted Arrays',
  'Arrays',
  'medium',
  'Given two sorted arrays, merge them into a single sorted array and output the result.

Input:
  Line 1: n (length of first array)
  Line 2: n space-separated integers (sorted)
  Line 3: m (length of second array)
  Line 4: m space-separated integers (sorted)

Output: merged sorted array, space-separated on one line',
  $sc${
    "python3": "def merge(a, b):\n    # your code here\n    pass\n\nn = int(input())\na = list(map(int, input().split()))\nm = int(input())\nb = list(map(int, input().split()))\nprint(*merge(a, b))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const a = lines[1].split(' ').map(Number);\n  const b = lines[3].split(' ').map(Number);\n  function merge(a, b) {\n    // your code here\n  }\n  console.log(merge(a, b).join(' '));\n});",
    "java": "import java.util.*;\npublic class Main {\n  static int[] merge(int[] a, int[] b) {\n    // your code here\n    return new int[]{};\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n    int m = sc.nextInt();\n    int[] b = new int[m];\n    for (int i = 0; i < m; i++) b[i] = sc.nextInt();\n    int[] r = merge(a, b);\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(' '); sb.append(r[i]); }\n    System.out.println(sb);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nvector<int> merge(vector<int>& a, vector<int>& b) {\n  // your code here\n  return {};\n}\nint main() {\n  int n; cin >> n; vector<int> a(n);\n  for (int i = 0; i < n; i++) cin >> a[i];\n  int m; cin >> m; vector<int> b(m);\n  for (int i = 0; i < m; i++) cin >> b[i];\n  auto r = merge(a, b);\n  for (int i = 0; i < (int)r.size(); i++) { if (i) cout << ' '; cout << r[i]; }\n  cout << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def merge(a, b):\n    result = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]: result.append(a[i]); i += 1\n        else: result.append(b[j]); j += 1\n    return result + a[i:] + b[j:]\n\nn = int(input())\na = list(map(int, input().split()))\nm = int(input())\nb = list(map(int, input().split()))\nprint(*merge(a, b))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const a = lines[1].split(' ').map(Number);\n  const b = lines[3].split(' ').map(Number);\n  function merge(a, b) {\n    const r = []; let i = 0, j = 0;\n    while (i < a.length && j < b.length)\n      r.push(a[i] <= b[j] ? a[i++] : b[j++]);\n    return r.concat(a.slice(i)).concat(b.slice(j));\n  }\n  console.log(merge(a, b).join(' '));\n});",
    "java": "import java.util.*;\npublic class Main {\n  static int[] merge(int[] a, int[] b) {\n    int[] r = new int[a.length + b.length];\n    int i = 0, j = 0, k = 0;\n    while (i < a.length && j < b.length)\n      r[k++] = a[i] <= b[j] ? a[i++] : b[j++];\n    while (i < a.length) r[k++] = a[i++];\n    while (j < b.length) r[k++] = b[j++];\n    return r;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt(); int[] a = new int[n];\n    for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n    int m = sc.nextInt(); int[] b = new int[m];\n    for (int i = 0; i < m; i++) b[i] = sc.nextInt();\n    int[] r = merge(a, b);\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(' '); sb.append(r[i]); }\n    System.out.println(sb);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nvector<int> merge(vector<int>& a, vector<int>& b) {\n  vector<int> r; int i=0,j=0;\n  while(i<(int)a.size()&&j<(int)b.size())\n    r.push_back(a[i]<=b[j]?a[i++]:b[j++]);\n  while(i<(int)a.size()) r.push_back(a[i++]);\n  while(j<(int)b.size()) r.push_back(b[j++]);\n  return r;\n}\nint main() {\n  int n; cin>>n; vector<int> a(n);\n  for(int i=0;i<n;i++) cin>>a[i];\n  int m; cin>>m; vector<int> b(m);\n  for(int i=0;i<m;i++) cin>>b[i];\n  auto r=merge(a,b);\n  for(int i=0;i<(int)r.size();i++){if(i) cout<<' '; cout<<r[i];}\n  cout<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "3\n1 3 5\n4\n2 4 6 8",       "expectedOutput": "1 2 3 4 5 6 8"},
    {"input": "3\n1 2 3\n3\n4 5 6",          "expectedOutput": "1 2 3 4 5 6"},
    {"input": "1\n5\n1\n5",                   "expectedOutput": "5 5"},
    {"input": "2\n-3 -1\n2\n0 2",            "expectedOutput": "-3 -1 0 2"},
    {"input": "4\n1 1 2 4\n3\n1 3 5",        "expectedOutput": "1 1 1 2 3 4 5"},
    {"input": "2\n100 200\n3\n50 150 250",   "expectedOutput": "50 100 150 200 250"}
  ]$tc$::jsonb,
  ARRAY['arrays', 'two-pointers', 'sorting']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Merge Sorted Arrays');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Valid Palindrome
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Valid Palindrome',
  'Strings',
  'easy',
  'Given a string of lowercase letters, determine whether it reads the same forwards and backwards.

Input:
  Line 1: a string of lowercase letters (no spaces)

Output: "true" if palindrome, "false" otherwise',
  $sc${
    "python3": "def is_palindrome(s):\n    # your code here\n    pass\n\ns = input().strip()\nprint('true' if is_palindrome(s) else 'false')",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const s = lines[0];\n  function isPalindrome(s) {\n    // your code here\n  }\n  console.log(isPalindrome(s) ? 'true' : 'false');\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static boolean isPalindrome(String s) {\n    // your code here\n    return false;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.next();\n    System.out.println(isPalindrome(s));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\nusing namespace std;\nbool isPalindrome(string s) {\n  // your code here\n  return false;\n}\nint main() {\n  string s; cin >> s;\n  cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def is_palindrome(s):\n    return s == s[::-1]\n\ns = input().strip()\nprint('true' if is_palindrome(s) else 'false')",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const s = lines[0];\n  function isPalindrome(s) {\n    return s === s.split('').reverse().join('');\n  }\n  console.log(isPalindrome(s) ? 'true' : 'false');\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static boolean isPalindrome(String s) {\n    int l = 0, r = s.length() - 1;\n    while (l < r) { if (s.charAt(l++) != s.charAt(r--)) return false; }\n    return true;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.next();\n    System.out.println(isPalindrome(s));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<algorithm>\nusing namespace std;\nbool isPalindrome(string s) {\n  string r = s; reverse(r.begin(), r.end());\n  return s == r;\n}\nint main() {\n  string s; cin >> s;\n  cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "racecar", "expectedOutput": "true"},
    {"input": "hello",   "expectedOutput": "false"},
    {"input": "level",   "expectedOutput": "true"},
    {"input": "a",       "expectedOutput": "true"},
    {"input": "abcba",   "expectedOutput": "true"},
    {"input": "abcde",   "expectedOutput": "false"}
  ]$tc$::jsonb,
  ARRAY['strings', 'two-pointers']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Valid Palindrome');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Anagram Check
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Anagram Check',
  'Strings',
  'easy',
  'Given two strings of lowercase letters, determine whether one is an anagram of the other (same characters, same frequencies, any order).

Input:
  Line 1: first string
  Line 2: second string

Output: "true" if anagram, "false" otherwise',
  $sc${
    "python3": "def is_anagram(a, b):\n    # your code here\n    pass\n\na = input().strip()\nb = input().strip()\nprint('true' if is_anagram(a, b) else 'false')",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const [a, b] = [lines[0], lines[1]];\n  function isAnagram(a, b) {\n    // your code here\n  }\n  console.log(isAnagram(a, b) ? 'true' : 'false');\n});",
    "java": "import java.util.*;\npublic class Main {\n  static boolean isAnagram(String a, String b) {\n    // your code here\n    return false;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String a = sc.next(), b = sc.next();\n    System.out.println(isAnagram(a, b));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\nusing namespace std;\nbool isAnagram(string a, string b) {\n  // your code here\n  return false;\n}\nint main() {\n  string a, b; cin >> a >> b;\n  cout << (isAnagram(a, b) ? \"true\" : \"false\") << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "from collections import Counter\ndef is_anagram(a, b):\n    return Counter(a) == Counter(b)\n\na = input().strip()\nb = input().strip()\nprint('true' if is_anagram(a, b) else 'false')",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const [a, b] = [lines[0], lines[1]];\n  function isAnagram(a, b) {\n    if (a.length !== b.length) return false;\n    const count = {};\n    for (const c of a) count[c] = (count[c] || 0) + 1;\n    for (const c of b) { if (!count[c]) return false; count[c]--; }\n    return true;\n  }\n  console.log(isAnagram(a, b) ? 'true' : 'false');\n});",
    "java": "import java.util.*;\npublic class Main {\n  static boolean isAnagram(String a, String b) {\n    if (a.length() != b.length()) return false;\n    int[] count = new int[26];\n    for (char c : a.toCharArray()) count[c-'a']++;\n    for (char c : b.toCharArray()) { if (--count[c-'a'] < 0) return false; }\n    return true;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String a = sc.next(), b = sc.next();\n    System.out.println(isAnagram(a, b));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<array>\nusing namespace std;\nbool isAnagram(string a, string b) {\n  if (a.size() != b.size()) return false;\n  array<int,26> cnt{};\n  for (char c : a) cnt[c-'a']++;\n  for (char c : b) { if (--cnt[c-'a'] < 0) return false; }\n  return true;\n}\nint main() {\n  string a, b; cin >> a >> b;\n  cout << (isAnagram(a, b) ? \"true\" : \"false\") << endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "listen\nsilent",   "expectedOutput": "true"},
    {"input": "hello\nworld",    "expectedOutput": "false"},
    {"input": "anagram\nnagaram","expectedOutput": "true"},
    {"input": "rat\ncar",        "expectedOutput": "false"},
    {"input": "a\na",            "expectedOutput": "true"},
    {"input": "abc\ncba",        "expectedOutput": "true"}
  ]$tc$::jsonb,
  ARRAY['strings', 'hashmap', 'sorting']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Anagram Check');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Reverse Words in a String
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Reverse Words in a String',
  'Strings',
  'easy',
  'Given a sentence, reverse the order of the words. Words are separated by single spaces.

Input:
  Line 1: a sentence of space-separated words

Output: the words in reversed order, separated by single spaces',
  $sc${
    "python3": "def reverse_words(s):\n    # your code here\n    pass\n\ns = input()\nprint(reverse_words(s))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n  function reverseWords(s) {\n    // your code here\n  }\n  console.log(reverseWords(lines[0]));\n});",
    "java": "import java.util.*;\npublic class Main {\n  static String reverseWords(String s) {\n    // your code here\n    return s;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.nextLine();\n    System.out.println(reverseWords(s));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<sstream>\n#include<vector>\nusing namespace std;\nstring reverseWords(string s) {\n  // your code here\n  return s;\n}\nint main() {\n  string s; getline(cin, s);\n  cout << reverseWords(s) << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def reverse_words(s):\n    return ' '.join(reversed(s.split()))\n\ns = input()\nprint(reverse_words(s))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n  function reverseWords(s) {\n    return s.split(' ').reverse().join(' ');\n  }\n  console.log(reverseWords(lines[0]));\n});",
    "java": "import java.util.*;\npublic class Main {\n  static String reverseWords(String s) {\n    String[] words = s.split(\" \");\n    StringBuilder sb = new StringBuilder();\n    for (int i = words.length - 1; i >= 0; i--) {\n      if (sb.length() > 0) sb.append(' ');\n      sb.append(words[i]);\n    }\n    return sb.toString();\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.nextLine();\n    System.out.println(reverseWords(s));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<sstream>\n#include<vector>\n#include<algorithm>\nusing namespace std;\nstring reverseWords(string s) {\n  istringstream iss(s);\n  vector<string> words;\n  string w;\n  while (iss >> w) words.push_back(w);\n  reverse(words.begin(), words.end());\n  string r;\n  for (int i=0;i<(int)words.size();i++){if(i) r+=' '; r+=words[i];}\n  return r;\n}\nint main() {\n  string s; getline(cin, s);\n  cout << reverseWords(s) << endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "hello world",          "expectedOutput": "world hello"},
    {"input": "the sky is blue",      "expectedOutput": "blue is sky the"},
    {"input": "hello",                "expectedOutput": "hello"},
    {"input": "a good example",       "expectedOutput": "example good a"},
    {"input": "one two three four",   "expectedOutput": "four three two one"},
    {"input": "foo bar baz",          "expectedOutput": "baz bar foo"}
  ]$tc$::jsonb,
  ARRAY['strings', 'arrays']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Reverse Words in a String');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Fibonacci Number
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Fibonacci Number',
  'Recursion',
  'easy',
  'Return the nth Fibonacci number (0-indexed). fib(0) = 0, fib(1) = 1, fib(n) = fib(n-1) + fib(n-2).

Input:
  Line 1: n (non-negative integer)

Output: fib(n)',
  $sc${
    "python3": "def fib(n):\n    # your code here\n    pass\n\nn = int(input())\nprint(fib(n))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  function fib(n) {\n    // your code here\n  }\n  console.log(fib(n));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static long fib(int n) {\n    // your code here\n    return 0;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    System.out.println(fib(n));\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nlong long fib(int n) {\n  // your code here\n  return 0;\n}\nint main() {\n  int n; cin >> n;\n  cout << fib(n) << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def fib(n):\n    a, b = 0, 1\n    for _ in range(n): a, b = b, a + b\n    return a\n\nn = int(input())\nprint(fib(n))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  function fib(n) {\n    let a = 0, b = 1;\n    for (let i = 0; i < n; i++) [a, b] = [b, a + b];\n    return a;\n  }\n  console.log(fib(n));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static long fib(int n) {\n    long a = 0, b = 1;\n    for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }\n    return a;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    System.out.println(fib(n));\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nlong long fib(int n) {\n  long long a=0, b=1;\n  for(int i=0;i<n;i++){long long t=a+b;a=b;b=t;}\n  return a;\n}\nint main() {\n  int n; cin>>n;\n  cout<<fib(n)<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "0",  "expectedOutput": "0"},
    {"input": "1",  "expectedOutput": "1"},
    {"input": "5",  "expectedOutput": "5"},
    {"input": "7",  "expectedOutput": "13"},
    {"input": "10", "expectedOutput": "55"},
    {"input": "15", "expectedOutput": "610"}
  ]$tc$::jsonb,
  ARRAY['recursion', 'dynamic-programming', 'math']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Fibonacci Number');

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Binary Search
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Binary Search',
  'Algorithms',
  'medium',
  'Given a sorted array of distinct integers and a target, implement binary search and return the 0-based index of the target. Return -1 if not found.

Input:
  Line 1: n (array length)
  Line 2: n space-separated sorted integers
  Line 3: target integer

Output: index of target, or -1',
  $sc${
    "python3": "def binary_search(nums, target):\n    # your code here\n    pass\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nprint(binary_search(nums, target))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  const target = parseInt(lines[2]);\n  function binarySearch(nums, target) {\n    // your code here\n  }\n  console.log(binarySearch(nums, target));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static int binarySearch(int[] nums, int target) {\n    // your code here\n    return -1;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n    System.out.println(binarySearch(nums, target));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n  // your code here\n  return -1;\n}\nint main() {\n  int n; cin >> n;\n  vector<int> nums(n);\n  for (int i = 0; i < n; i++) cin >> nums[i];\n  int target; cin >> target;\n  cout << binarySearch(nums, target) << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nprint(binary_search(nums, target))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const nums = lines[1].split(' ').map(Number);\n  const target = parseInt(lines[2]);\n  function binarySearch(nums, target) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n      const mid = (lo + hi) >> 1;\n      if (nums[mid] === target) return mid;\n      else if (nums[mid] < target) lo = mid + 1;\n      else hi = mid - 1;\n    }\n    return -1;\n  }\n  console.log(binarySearch(nums, target));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static int binarySearch(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n      int mid = lo + (hi - lo) / 2;\n      if (nums[mid] == target) return mid;\n      else if (nums[mid] < target) lo = mid + 1;\n      else hi = mid - 1;\n    }\n    return -1;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] nums = new int[n];\n    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n    int target = sc.nextInt();\n    System.out.println(binarySearch(nums, target));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<vector>\nusing namespace std;\nint binarySearch(vector<int>& nums, int target) {\n  int lo=0, hi=(int)nums.size()-1;\n  while(lo<=hi){\n    int mid=lo+(hi-lo)/2;\n    if(nums[mid]==target) return mid;\n    else if(nums[mid]<target) lo=mid+1;\n    else hi=mid-1;\n  }\n  return -1;\n}\nint main() {\n  int n; cin>>n;\n  vector<int> nums(n);\n  for(int i=0;i<n;i++) cin>>nums[i];\n  int target; cin>>target;\n  cout<<binarySearch(nums,target)<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "5\n1 3 5 7 9\n5",    "expectedOutput": "2"},
    {"input": "5\n1 3 5 7 9\n1",    "expectedOutput": "0"},
    {"input": "5\n1 3 5 7 9\n9",    "expectedOutput": "4"},
    {"input": "5\n1 3 5 7 9\n4",    "expectedOutput": "-1"},
    {"input": "1\n42\n42",          "expectedOutput": "0"},
    {"input": "6\n2 4 6 8 10 12\n6","expectedOutput": "2"}
  ]$tc$::jsonb,
  ARRAY['algorithms', 'binary-search', 'arrays']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Binary Search');

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. FizzBuzz
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'FizzBuzz',
  'Basic',
  'easy',
  'Print numbers from 1 to n. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".

Input:
  Line 1: n (positive integer)

Output: one value per line from 1 to n',
  $sc${
    "python3": "n = int(input())\nfor i in range(1, n + 1):\n    # your code here\n    pass",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  for (let i = 1; i <= n; i++) {\n    // your code here\n  }\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      // your code here\n    }\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nint main() {\n  int n; cin >> n;\n  for (int i = 1; i <= n; i++) {\n    // your code here\n  }\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "n = int(input())\nfor i in range(1, n + 1):\n    if i % 15 == 0: print('FizzBuzz')\n    elif i % 3 == 0: print('Fizz')\n    elif i % 5 == 0: print('Buzz')\n    else: print(i)",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) console.log('FizzBuzz');\n    else if (i % 3 === 0) console.log('Fizz');\n    else if (i % 5 === 0) console.log('Buzz');\n    else console.log(i);\n  }\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      if (i % 15 == 0) System.out.println(\"FizzBuzz\");\n      else if (i % 3 == 0) System.out.println(\"Fizz\");\n      else if (i % 5 == 0) System.out.println(\"Buzz\");\n      else System.out.println(i);\n    }\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nint main() {\n  int n; cin>>n;\n  for(int i=1;i<=n;i++){\n    if(i%15==0) cout<<\"FizzBuzz\\n\";\n    else if(i%3==0) cout<<\"Fizz\\n\";\n    else if(i%5==0) cout<<\"Buzz\\n\";\n    else cout<<i<<\"\\n\";\n  }\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "1",  "expectedOutput": "1"},
    {"input": "3",  "expectedOutput": "1\n2\nFizz"},
    {"input": "5",  "expectedOutput": "1\n2\nFizz\n4\nBuzz"},
    {"input": "6",  "expectedOutput": "1\n2\nFizz\n4\nBuzz\nFizz"},
    {"input": "15", "expectedOutput": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"},
    {"input": "20", "expectedOutput": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz"}
  ]$tc$::jsonb,
  ARRAY['basic', 'conditionals', 'loops']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'FizzBuzz');

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Power Function
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Power Function',
  'Algorithms',
  'medium',
  'Implement a function that computes base raised to a non-negative integer exponent without using any built-in power function (no Math.pow, no **, no pow()).

Input:
  Line 1: base (integer)
  Line 2: exponent (non-negative integer)

Output: base^exponent as an integer',
  $sc${
    "python3": "def power(base, exp):\n    # your code here — do not use ** or pow()\n    pass\n\nbase = int(input())\nexp = int(input())\nprint(power(base, exp))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const base = parseInt(lines[0]);\n  const exp = parseInt(lines[1]);\n  function power(base, exp) {\n    // your code here — do not use Math.pow\n  }\n  console.log(power(base, exp));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static long power(long base, int exp) {\n    // your code here — do not use Math.pow\n    return 0;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    long base = sc.nextLong();\n    int exp = sc.nextInt();\n    System.out.println(power(base, exp));\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nlong long power(long long base, int exp) {\n  // your code here — do not use pow()\n  return 0;\n}\nint main() {\n  long long base; int exp;\n  cin >> base >> exp;\n  cout << power(base, exp) << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def power(base, exp):\n    if exp == 0: return 1\n    if exp % 2 == 0:\n        half = power(base, exp // 2)\n        return half * half\n    return base * power(base, exp - 1)\n\nbase = int(input())\nexp = int(input())\nprint(power(base, exp))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const base = parseInt(lines[0]);\n  const exp = parseInt(lines[1]);\n  function power(base, exp) {\n    if (exp === 0) return 1;\n    if (exp % 2 === 0) { const h = power(base, exp / 2); return h * h; }\n    return base * power(base, exp - 1);\n  }\n  console.log(power(base, exp));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static long power(long base, int exp) {\n    if (exp == 0) return 1;\n    if (exp % 2 == 0) { long h = power(base, exp/2); return h*h; }\n    return base * power(base, exp-1);\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    long base = sc.nextLong();\n    int exp = sc.nextInt();\n    System.out.println(power(base, exp));\n  }\n}",
    "cpp17": "#include<iostream>\nusing namespace std;\nlong long power(long long base, int exp) {\n  if(exp==0) return 1;\n  if(exp%2==0){long long h=power(base,exp/2);return h*h;}\n  return base*power(base,exp-1);\n}\nint main(){\n  long long base; int exp;\n  cin>>base>>exp;\n  cout<<power(base,exp)<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "2\n10", "expectedOutput": "1024"},
    {"input": "3\n0",  "expectedOutput": "1"},
    {"input": "5\n3",  "expectedOutput": "125"},
    {"input": "1\n100","expectedOutput": "1"},
    {"input": "2\n0",  "expectedOutput": "1"},
    {"input": "7\n4",  "expectedOutput": "2401"}
  ]$tc$::jsonb,
  ARRAY['algorithms', 'recursion', 'math', 'divide-and-conquer']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Power Function');

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Longest Common Prefix
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Longest Common Prefix',
  'Strings',
  'medium',
  'Find the longest string that is a prefix of all strings in the array. If no common prefix exists, return an empty string (output a blank line).

Input:
  Line 1: n (number of strings)
  Lines 2..n+1: one string per line

Output: the longest common prefix, or empty line if none',
  $sc${
    "python3": "def longest_prefix(words):\n    # your code here\n    pass\n\nn = int(input())\nwords = [input().strip() for _ in range(n)]\nprint(longest_prefix(words))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  const words = lines.slice(1, n + 1);\n  function longestPrefix(words) {\n    // your code here\n  }\n  console.log(longestPrefix(words));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static String longestPrefix(String[] words) {\n    // your code here\n    return \"\";\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt(); sc.nextLine();\n    String[] words = new String[n];\n    for (int i = 0; i < n; i++) words[i] = sc.nextLine().trim();\n    System.out.println(longestPrefix(words));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<vector>\nusing namespace std;\nstring longestPrefix(vector<string>& words) {\n  // your code here\n  return \"\";\n}\nint main() {\n  int n; cin>>n; cin.ignore();\n  vector<string> words(n);\n  for(int i=0;i<n;i++) getline(cin,words[i]);\n  cout<<longestPrefix(words)<<endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def longest_prefix(words):\n    if not words: return ''\n    prefix = words[0]\n    for w in words[1:]:\n        while not w.startswith(prefix):\n            prefix = prefix[:-1]\n            if not prefix: return ''\n    return prefix\n\nn = int(input())\nwords = [input().strip() for _ in range(n)]\nprint(longest_prefix(words))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const n = parseInt(lines[0]);\n  const words = lines.slice(1, n + 1);\n  function longestPrefix(words) {\n    if (!words.length) return '';\n    let prefix = words[0];\n    for (let i = 1; i < words.length; i++)\n      while (!words[i].startsWith(prefix)) {\n        prefix = prefix.slice(0, -1);\n        if (!prefix) return '';\n      }\n    return prefix;\n  }\n  console.log(longestPrefix(words));\n});",
    "java": "import java.util.Scanner;\npublic class Main {\n  static String longestPrefix(String[] words) {\n    if (words.length == 0) return \"\";\n    String prefix = words[0];\n    for (int i = 1; i < words.length; i++)\n      while (!words[i].startsWith(prefix))\n        prefix = prefix.substring(0, prefix.length() - 1);\n    return prefix;\n  }\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt(); sc.nextLine();\n    String[] words = new String[n];\n    for (int i = 0; i < n; i++) words[i] = sc.nextLine().trim();\n    System.out.println(longestPrefix(words));\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<vector>\nusing namespace std;\nstring longestPrefix(vector<string>& words) {\n  if(words.empty()) return \"\";\n  string prefix=words[0];\n  for(int i=1;i<(int)words.size();i++)\n    while(words[i].substr(0,prefix.size())!=prefix)\n      prefix=prefix.substr(0,prefix.size()-1);\n  return prefix;\n}\nint main(){\n  int n; cin>>n; cin.ignore();\n  vector<string> words(n);\n  for(int i=0;i<n;i++) getline(cin,words[i]);\n  cout<<longestPrefix(words)<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "3\nflower\nflow\nflight",          "expectedOutput": "fl"},
    {"input": "3\ndog\nracecar\ncar",              "expectedOutput": ""},
    {"input": "1\nhello",                          "expectedOutput": "hello"},
    {"input": "2\ninterspecies\ninterstellar",     "expectedOutput": "inters"},
    {"input": "3\nabc\nabc\nabc",                  "expectedOutput": "abc"},
    {"input": "3\nab\na\nabc",                     "expectedOutput": "a"}
  ]$tc$::jsonb,
  ARRAY['strings', 'leetcode-classic']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Longest Common Prefix');

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Count Character Frequency
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO question_bank (title, category, difficulty, prompt, starter_code, solution_code, test_cases, tags)
SELECT
  'Count Character Frequency',
  'HashMap',
  'easy',
  'Given a string of lowercase letters, count the frequency of each character and output the results sorted alphabetically by character.

Input:
  Line 1: a string of lowercase letters

Output: space-separated "char:count" pairs sorted alphabetically (e.g. "a:2 b:3 c:1")',
  $sc${
    "python3": "def char_freq(s):\n    # your code here\n    pass\n\ns = input().strip()\nresult = char_freq(s)\nprint(' '.join(f'{c}:{n}' for c, n in sorted(result.items())))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const s = lines[0];\n  function charFreq(s) {\n    // your code here — return an object { char: count }\n  }\n  const freq = charFreq(s);\n  const out = Object.keys(freq).sort().map(k => k + ':' + freq[k]).join(' ');\n  console.log(out);\n});",
    "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.next();\n    TreeMap<Character, Integer> map = new TreeMap<>();\n    // your code here — populate map with character frequencies\n    StringBuilder sb = new StringBuilder();\n    for (Map.Entry<Character,Integer> e : map.entrySet()) {\n      if (sb.length() > 0) sb.append(' ');\n      sb.append(e.getKey()).append(':').append(e.getValue());\n    }\n    System.out.println(sb);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<map>\nusing namespace std;\nint main() {\n  string s; cin >> s;\n  map<char,int> freq;\n  // your code here — populate freq\n  bool first = true;\n  for (auto& [c, n] : freq) {\n    if (!first) cout << ' ';\n    cout << c << ':' << n;\n    first = false;\n  }\n  cout << endl;\n}"
  }$sc$::jsonb,
  $sol${
    "python3": "def char_freq(s):\n    freq = {}\n    for c in s: freq[c] = freq.get(c, 0) + 1\n    return freq\n\ns = input().strip()\nresult = char_freq(s)\nprint(' '.join(f'{c}:{n}' for c, n in sorted(result.items())))",
    "nodejs": "const rl = require('readline').createInterface({input: process.stdin});\nconst lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  const s = lines[0];\n  function charFreq(s) {\n    const freq = {};\n    for (const c of s) freq[c] = (freq[c] || 0) + 1;\n    return freq;\n  }\n  const freq = charFreq(s);\n  const out = Object.keys(freq).sort().map(k => k + ':' + freq[k]).join(' ');\n  console.log(out);\n});",
    "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.next();\n    TreeMap<Character, Integer> map = new TreeMap<>();\n    for (char c : s.toCharArray()) map.merge(c, 1, Integer::sum);\n    StringBuilder sb = new StringBuilder();\n    for (Map.Entry<Character,Integer> e : map.entrySet()) {\n      if (sb.length() > 0) sb.append(' ');\n      sb.append(e.getKey()).append(':').append(e.getValue());\n    }\n    System.out.println(sb);\n  }\n}",
    "cpp17": "#include<iostream>\n#include<string>\n#include<map>\nusing namespace std;\nint main(){\n  string s; cin>>s;\n  map<char,int> freq;\n  for(char c:s) freq[c]++;\n  bool first=true;\n  for(auto&[c,n]:freq){\n    if(!first) cout<<' ';\n    cout<<c<<':'<<n;\n    first=false;\n  }\n  cout<<endl;\n}"
  }$sol$::jsonb,
  $tc$[
    {"input": "hello",       "expectedOutput": "e:1 h:1 l:2 o:1"},
    {"input": "aabbc",       "expectedOutput": "a:2 b:2 c:1"},
    {"input": "a",           "expectedOutput": "a:1"},
    {"input": "abcabc",      "expectedOutput": "a:2 b:2 c:2"},
    {"input": "programming", "expectedOutput": "a:1 g:2 i:1 m:2 n:1 o:1 p:1 r:2"},
    {"input": "zzzzz",       "expectedOutput": "z:5"}
  ]$tc$::jsonb,
  ARRAY['hashmap', 'strings', 'sorting']
WHERE NOT EXISTS (SELECT 1 FROM question_bank WHERE title = 'Count Character Frequency');
