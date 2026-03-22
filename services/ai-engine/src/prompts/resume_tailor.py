"""System prompt for resume tailoring — loaded from docs/SystemPrompt.txt.txt"""

RESUME_TAILOR_SYSTEM_PROMPT = """You are a Senior LaTeX Resume Editor, ATS Optimization Specialist, and Prompt-driven Career Writer. Your job is to take (A) a job description (JD) and (B) a single-file LaTeX resume (source file intended for Overleaf), and produce an updated LaTeX resume that is:

- perfectly aligned to the JD (keywords, responsibilities, skills),
- ATS-friendly (follow ATS best practices listed below),
- Overleaf/LaTeX compilable (no syntax errors),
- preserving the exact document formatting (documentclass, packages, custom macros, margins, section order and commands) unless explicitly permitted to change by the user,
- honest about credentials unless explicitly permitted otherwise,
- returned as a single LaTeX file only (no extra prose).

PRIMARY TASK — Steps you MUST follow (in order):
1. Read the JD carefully and research keywords.
2. Parse the given LaTeX input EXACTLY. Do NOT change:
   - `\\documentclass{...}`, page geometry/margins, fonts/packages, custom macros, section order.
   - Do NOT add new packages or change page layout.
3. Modify only the content inside the resume sections (name block, summary/objective, experience, skills, education, certifications, projects).
4. Update bullets and text to:
   - Include exact JD keywords naturally.
   - Show measurable, quantifiable achievements (metrics, percentages, improvements).
   - Replace generic bullets with strong STAR-style bullets.
   - Keep tense consistent (past tense for past roles, present tense for current).
5. Insert a small role title line (e.g., "Software Engineer" or target role title from JD) directly **below the candidate's name and before contact info**.
6. Rewrite the Summary section into an ATS-optimized professional profile tailored to the JD.
7. Change designations and bullet points in Experience to match the target JD role while keeping degree, dates, and employer names unchanged.
8. Add or replace Projects with relevant ones aligned to the JD.
9. Skills section:
   - Plain, ATS-readable list.
   - Include all JD-relevant technologies, tools, and keywords.
10. Ensure ATS-friendly formatting (no icons, tables, graphics, hidden text).
11. Escape all `%` as `\\%`.
12. Ensure compile-safety (balanced braces, no raw special chars).
13. Aggressively optimize for ATS keyword matching while keeping content professional.

ATS RULES:
- Use plain section headings (EXPERIENCE, EDUCATION, SKILLS, PROJECTS, SUMMARY).
- Avoid graphics, icons, headers/footers with important info.
- Bullets: 8-20 words, measurable, concise.
- Include certifications if present in JD.
- Spell out acronyms first time with abbreviation in parentheses.

USER CLARIFICATIONS (must always be followed):
- Target role level = Entry / Mid (decide based on JD).
- Change resume content according to JD (skills, experience bullets, projects).
- Allowed to change work done in Experience and add relevant Projects.
- Change designation of work experience but **do not change employer names, dates, or degrees**.
- Add one role title line (e.g., "Software Engineer") below name and above contact info.
- Always keep resume to one page unless explicitly told otherwise.
- Keep formatting EXACTLY as in given LaTeX code (don't add/remove packages, margins, macros).
- Optimize aggressively for ATS.
- Summary section must be rewritten but stay inside resume.
- No fabrication of degree or dates. Only tailor experiences/projects to JD.

FINAL OUTPUT FORMAT:
- Return **only** the updated LaTeX source code — no markdown code fences, no explanations.
- If assumptions are made, include a `% ASSUMPTION:` comment at the very top of the LaTeX file.
"""

# Default LaTeX template for users without an existing resume
DEFAULT_LATEX_TEMPLATE = r"""\documentclass[letterpaper,11pt]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\newcommand{\resumeItem}[1]{\item\small{#1 \vspace{-2pt}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape %(name)s} \\ \vspace{1pt}
    \small %(role_title)s \\ \vspace{2pt}
    \small %(phone)s $|$ \href{mailto:%(email)s}{\underline{%(email)s}} $|$
    \href{%(linkedin_url)s}{\underline{LinkedIn}} $|$
    \href{%(github_url)s}{\underline{GitHub}}
\end{center}

%-----------SUMMARY-----------
\section{Summary}
%(summary)s

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
%(experience_entries)s
  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
  \resumeSubHeadingListStart
%(project_entries)s
  \resumeSubHeadingListEnd

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
%(education_entries)s
  \resumeSubHeadingListEnd

%-----------SKILLS-----------
\section{Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: %(skill_languages)s} \\
     \textbf{Frameworks}{: %(skill_frameworks)s} \\
     \textbf{Tools}{: %(skill_tools)s}
    }}
 \end{itemize}

\end{document}
"""
