import type {
  InterviewExperience,
  DiscussionThread,
  DiscussionReply,
  SalaryEntry,
  SalaryAggregation,
} from "@/types/community";

// ─── Interview Experiences (30) ────────────────────────────────────────────

export const MOCK_INTERVIEW_EXPERIENCES: InterviewExperience[] = [
  {
    id: "ie-001",
    companyName: "Google",
    role: "Frontend Developer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Tell me about yourself", "Explain the event loop in JavaScript"] },
      { roundNumber: 2, type: "Technical", questions: ["Implement a debounce function", "Design a virtual scrolling list component"] },
      { roundNumber: 3, type: "System Design", questions: ["Design Google Docs collaborative editing frontend"] },
      { roundNumber: 4, type: "Culture Fit", questions: ["Describe a time you disagreed with a teammate", "Why Google?"] },
    ],
    outcome: "rejected",
    processDescription: "Applied through referral. Got a call within a week. The process took about 3 weeks total with 4 rounds. Each round was 45 minutes. The interviewers were professional but the bar was very high.",
    tips: "Practice system design for frontend specifically. They care a lot about scalability of UI components. LeetCode medium-hard is the baseline for coding rounds.",
    overallRating: 4,
    upvotes: 87,
    downvotes: 3,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "ie-002",
    companyName: "Flipkart",
    role: "Backend Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a rate limiter", "SQL query optimization question"] },
      { roundNumber: 2, type: "Technical", questions: ["Implement an LRU cache", "Discuss microservices vs monolith"] },
      { roundNumber: 3, type: "HR", questions: ["Salary expectations", "Notice period", "Why leaving current company?"] },
    ],
    outcome: "got_offer",
    processDescription: "Applied on their careers page. HR reached out in 2 days. Very structured process — each round had clear evaluation criteria shared upfront. Offer came within a week of final round.",
    tips: "Know your system design fundamentals. They value practical experience over theoretical knowledge. Be ready to discuss real projects in depth.",
    overallRating: 5,
    upvotes: 64,
    downvotes: 2,
    isAnonymous: false,
    authorName: "Vikram S.",
    createdAt: "2026-03-12T14:30:00Z",
  },
  {
    id: "ie-003",
    companyName: "Razorpay",
    role: "Full Stack Developer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Background discussion", "JavaScript closure explanation"] },
      { roundNumber: 2, type: "Take-home", questions: ["Build a payment dashboard with React and Node.js (48 hours)"] },
      { roundNumber: 3, type: "Technical", questions: ["Code review of take-home", "Discuss scalability improvements"] },
    ],
    outcome: "got_offer",
    processDescription: "Referral from a friend who works there. The take-home was very well-designed — realistic problem, clear requirements, reasonable time. The code review round felt like a real collaboration.",
    tips: "Pay attention to code quality in the take-home. They review your Git history, testing approach, and documentation. Don't just make it work — make it production-ready.",
    overallRating: 5,
    upvotes: 112,
    downvotes: 1,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-10T09:00:00Z",
  },
  {
    id: "ie-004",
    companyName: "Swiggy",
    role: "Product Designer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Walk me through your portfolio", "Your design process?"] },
      { roundNumber: 2, type: "Take-home", questions: ["Redesign the Swiggy restaurant listing page for better discoverability"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["How do you handle design feedback?", "Team collaboration style"] },
    ],
    outcome: "got_offer",
    processDescription: "Very design-focused process. They cared deeply about my process and thinking, not just the final output. The portfolio review was thorough but fair.",
    tips: "Prepare case studies with clear problem-solution-impact format. They love data-driven design decisions. Show your Figma prototyping skills.",
    overallRating: 4,
    upvotes: 45,
    downvotes: 0,
    isAnonymous: false,
    authorName: "Meera K.",
    createdAt: "2026-03-08T11:30:00Z",
  },
  {
    id: "ie-005",
    companyName: "PhonePe",
    role: "Backend Engineer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a distributed transaction system", "Java concurrency deep dive"] },
      { roundNumber: 2, type: "System Design", questions: ["Design PhonePe's payment processing pipeline at scale"] },
      { roundNumber: 3, type: "Technical", questions: ["Algorithm: find median in a stream of numbers", "Database sharding strategies"] },
      { roundNumber: 4, type: "HR", questions: ["Leadership style", "Conflict resolution"] },
    ],
    outcome: "rejected",
    processDescription: "Intense process. Very Java/JVM focused. They expect deep knowledge of distributed systems. The system design round was the hardest — they drill into every decision.",
    tips: "Brush up on Java internals (GC, threading, memory model). Know CAP theorem cold. Practice distributed system design patterns. They value consistency over availability.",
    overallRating: 3,
    upvotes: 56,
    downvotes: 4,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-05T16:00:00Z",
  },
  {
    id: "ie-006",
    companyName: "TechStartup Inc",
    role: "Frontend Developer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["React hooks explanation", "CSS Flexbox vs Grid"] },
      { roundNumber: 2, type: "Technical", questions: ["Build a todo app with drag and drop in 45 minutes"] },
    ],
    outcome: "got_offer",
    processDescription: "Fast process — just 2 rounds over 3 days. Very startup-friendly vibe. They cared more about shipping ability than algorithmic excellence.",
    tips: "Show enthusiasm for building products. Know React well. They don't ask LeetCode-style questions — it's all practical coding.",
    overallRating: 5,
    upvotes: 38,
    downvotes: 1,
    isAnonymous: false,
    authorName: "Ankit P.",
    createdAt: "2026-03-03T13:00:00Z",
  },
  {
    id: "ie-007",
    companyName: "Zerodha",
    role: "Backend Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Go concurrency patterns", "Design a real-time stock price feed"] },
      { roundNumber: 2, type: "System Design", questions: ["Design an order matching engine"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["Open source contributions?", "Side projects?"] },
    ],
    outcome: "ghosted",
    processDescription: "Great technical rounds but then silence. No response after the final round for 3 weeks despite follow-ups. Eventually got a generic rejection email.",
    tips: "Know Go or be ready to learn. They love open-source contributors. The culture fit round is surprisingly important — they want self-starters.",
    overallRating: 2,
    upvotes: 73,
    downvotes: 5,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-28T10:30:00Z",
  },
  {
    id: "ie-008",
    companyName: "Freshworks",
    role: "Product Manager",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Product sense: improve WhatsApp Status", "Metrics for success?"] },
      { roundNumber: 2, type: "Technical", questions: ["SQL query writing", "Basic system design for a ticketing system"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["Stakeholder management", "How do you prioritize features?"] },
    ],
    outcome: "rejected",
    processDescription: "Standard PM interview process. The product sense round was good. They expect PMs to have technical depth — the SQL round surprised me.",
    tips: "Prepare CIRCLES framework for product questions. Know SQL basics. Have 2-3 strong stories about cross-functional collaboration.",
    overallRating: 3,
    upvotes: 29,
    downvotes: 2,
    isAnonymous: false,
    authorName: "Priya M.",
    createdAt: "2026-02-25T15:00:00Z",
  },
  {
    id: "ie-009",
    companyName: "Meesho",
    role: "Data Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Spark vs Flink for streaming", "Design an ETL pipeline"] },
      { roundNumber: 2, type: "Technical", questions: ["SQL window functions", "Data modeling for e-commerce"] },
      { roundNumber: 3, type: "HR", questions: ["Growth aspirations", "Salary discussion"] },
    ],
    outcome: "got_offer",
    processDescription: "Good process for data roles. They use a lot of Spark and Airflow. The interviewers were helpful and gave hints when I was stuck.",
    tips: "Know Spark internals well. Practice SQL window functions. Be prepared to discuss data pipeline design patterns and failure handling.",
    overallRating: 4,
    upvotes: 34,
    downvotes: 1,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-22T12:00:00Z",
  },
  {
    id: "ie-010",
    companyName: "CRED",
    role: "Frontend Developer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Build an animated carousel from scratch (no libraries)", "CSS Grid layout challenge"] },
      { roundNumber: 2, type: "Technical", questions: ["React performance optimization", "Implement a custom hook for infinite scroll"] },
      { roundNumber: 3, type: "System Design", questions: ["Design a design system component library architecture"] },
      { roundNumber: 4, type: "Culture Fit", questions: ["What apps do you admire for their UI?", "Design taste discussion"] },
    ],
    outcome: "rejected",
    processDescription: "Very UI-focused. They care deeply about animations, micro-interactions, and design sensibility. The bar for frontend craft is extremely high.",
    tips: "Master CSS animations and transitions. Know Framer Motion. Have opinions about good UI/UX. They want frontend engineers who think like designers.",
    overallRating: 4,
    upvotes: 95,
    downvotes: 6,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-20T09:00:00Z",
  },
  {
    id: "ie-011",
    companyName: "Google",
    role: "Backend Engineer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Binary tree zigzag traversal", "Explain TCP handshake"] },
      { roundNumber: 2, type: "Technical", questions: ["Design a URL shortener", "Graph algorithm: shortest path with constraints"] },
      { roundNumber: 3, type: "Technical", questions: ["Implement a thread-safe HashMap", "Memory management in Go"] },
      { roundNumber: 4, type: "System Design", questions: ["Design YouTube's video processing pipeline"] },
      { roundNumber: 5, type: "Culture Fit", questions: ["Googleyness questions", "Impact in previous role"] },
    ],
    outcome: "got_offer",
    processDescription: "Long process — 5 rounds over 4 weeks. Each round was 45 mins. The hiring committee review took another 2 weeks. Very thorough and fair.",
    tips: "LeetCode hard is the standard. Practice on paper/whiteboard. System design must consider scale (billions of users). Be specific about numbers.",
    overallRating: 4,
    upvotes: 118,
    downvotes: 4,
    isAnonymous: false,
    authorName: "Rahul D.",
    createdAt: "2026-02-18T14:00:00Z",
  },
  {
    id: "ie-012",
    companyName: "Flipkart",
    role: "Frontend Developer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Implement Promise.all from scratch", "CSS specificity explanation"] },
      { roundNumber: 2, type: "Technical", questions: ["Build a searchable dropdown component", "React reconciliation deep dive"] },
      { roundNumber: 3, type: "HR", questions: ["Team preferences", "Location flexibility"] },
    ],
    outcome: "got_offer",
    processDescription: "Clean 3-round process. They test JavaScript fundamentals deeply. The component building round was practical and fun.",
    tips: "Know JavaScript inside out — prototypes, closures, event loop. Be ready to build UI components from scratch without libraries.",
    overallRating: 4,
    upvotes: 51,
    downvotes: 2,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-15T11:00:00Z",
  },
  {
    id: "ie-013",
    companyName: "Razorpay",
    role: "DevOps Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Kubernetes architecture", "Design a CI/CD pipeline"] },
      { roundNumber: 2, type: "Technical", questions: ["Troubleshoot a production outage scenario", "Terraform state management"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["On-call philosophy", "Incident response experience"] },
    ],
    outcome: "ghosted",
    processDescription: "Went well technically but they went silent after the culture fit round. Heard from a recruiter 2 months later that the role was put on hold.",
    tips: "Know Kubernetes deeply. They use Terraform heavily. Have strong opinions on monitoring and observability.",
    overallRating: 3,
    upvotes: 22,
    downvotes: 1,
    isAnonymous: false,
    authorName: "Karthik R.",
    createdAt: "2026-02-12T16:30:00Z",
  },
  {
    id: "ie-014",
    companyName: "Swiggy",
    role: "Backend Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a notification system", "Java Spring Boot questions"] },
      { roundNumber: 2, type: "System Design", questions: ["Design Swiggy's real-time delivery tracking system"] },
      { roundNumber: 3, type: "HR", questions: ["Career goals", "Why Swiggy?"] },
    ],
    outcome: "rejected",
    processDescription: "Well-organized process. The system design question was specific to their domain which made it interesting. Feedback was constructive.",
    tips: "Understand real-time systems. Know message queues (Kafka/RabbitMQ). They value domain knowledge in food-tech/logistics.",
    overallRating: 4,
    upvotes: 33,
    downvotes: 0,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "ie-015",
    companyName: "PhonePe",
    role: "Frontend Developer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["React fiber architecture", "Build a payment form with validation"] },
      { roundNumber: 2, type: "Technical", questions: ["Performance optimization challenge", "Accessibility best practices"] },
      { roundNumber: 3, type: "HR", questions: ["Location preference", "Team size preference"] },
    ],
    outcome: "in_progress",
    processDescription: "Currently waiting for the final decision. The technical rounds were focused on React and web performance. Good interviewers who explained the evaluation criteria.",
    tips: "Know React deeply — fiber, concurrent mode, suspense. Performance optimization is key. They also care about accessibility.",
    overallRating: 4,
    upvotes: 18,
    downvotes: 0,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-20T14:00:00Z",
  },
  {
    id: "ie-016",
    companyName: "CRED",
    role: "Backend Engineer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a credit score calculation engine", "Java streams and functional programming"] },
      { roundNumber: 2, type: "System Design", questions: ["Design CRED's reward system at scale"] },
      { roundNumber: 3, type: "Technical", questions: ["Concurrency problems in Java", "Database indexing strategies"] },
      { roundNumber: 4, type: "Culture Fit", questions: ["Craftsmanship philosophy", "Code review practices"] },
    ],
    outcome: "rejected",
    processDescription: "High bar. They expect clean code and strong fundamentals. The culture fit round is about craftsmanship — they want people who obsess over quality.",
    tips: "Write clean, well-structured code. Know design patterns. Have examples of how you've improved code quality in your team.",
    overallRating: 3,
    upvotes: 41,
    downvotes: 3,
    isAnonymous: false,
    authorName: "Amit T.",
    createdAt: "2026-02-08T09:30:00Z",
  },
  {
    id: "ie-017",
    companyName: "Google",
    role: "ML Engineer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Explain transformer architecture", "Coding: implement KNN from scratch"] },
      { roundNumber: 2, type: "Technical", questions: ["Design a recommendation system", "ML system debugging scenario"] },
      { roundNumber: 3, type: "Technical", questions: ["Optimization problem", "Statistical hypothesis testing"] },
      { roundNumber: 4, type: "System Design", questions: ["Design Google Photos face recognition pipeline"] },
    ],
    outcome: "rejected",
    processDescription: "Very research-oriented. They expect both strong coding and ML fundamentals. The system design was ML-specific which was refreshing.",
    tips: "Know ML fundamentals deeply — not just how to use libraries but the math behind them. Practice ML system design separately from regular system design.",
    overallRating: 4,
    upvotes: 67,
    downvotes: 2,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-02-05T11:00:00Z",
  },
  {
    id: "ie-018",
    companyName: "Freshworks",
    role: "Frontend Developer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["HTML/CSS layout challenge", "JavaScript array methods"] },
      { roundNumber: 2, type: "Technical", questions: ["Build a simple React component", "State management discussion"] },
    ],
    outcome: "got_offer",
    processDescription: "Straightforward 2-round process. No surprises. They test basics well. Good company for those starting their career.",
    tips: "Know HTML/CSS fundamentals. Be comfortable with React basics. They don't ask tricky algorithmic questions.",
    overallRating: 4,
    upvotes: 27,
    downvotes: 0,
    isAnonymous: false,
    authorName: "Sneha L.",
    createdAt: "2026-02-02T15:00:00Z",
  },
  {
    id: "ie-019",
    companyName: "Meesho",
    role: "Product Manager",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Product case: design a feature for first-time sellers", "Metrics framework"] },
      { roundNumber: 2, type: "Technical", questions: ["SQL queries", "A/B testing methodology"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["Working with ambiguity", "Scaling teams"] },
    ],
    outcome: "in_progress",
    processDescription: "Good PM process. They test for product thinking with a focus on their target market (tier 2/3 cities). Technical bar for PMs is moderate but important.",
    tips: "Understand Meesho's market and users. Focus on simplicity in product design. Know basic SQL and experiment design.",
    overallRating: 4,
    upvotes: 15,
    downvotes: 0,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "ie-020",
    companyName: "Zerodha",
    role: "Frontend Developer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Take-home", questions: ["Build a stock watchlist app with real-time updates (React)"] },
      { roundNumber: 2, type: "Technical", questions: ["Code review + improvements discussion", "WebSocket implementation details"] },
    ],
    outcome: "got_offer",
    processDescription: "Minimalist process, very Zerodha-like. Just 2 rounds. The take-home was practical and fun. They care about clean code and performance.",
    tips: "Focus on performance and bundle size. They love vanilla/minimal approaches. Show you can build without heavy dependencies.",
    overallRating: 5,
    upvotes: 82,
    downvotes: 1,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-30T13:00:00Z",
  },
  {
    id: "ie-021",
    companyName: "TechStartup Inc",
    role: "Backend Engineer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["REST API design principles", "Python async programming"] },
      { roundNumber: 2, type: "Culture Fit", questions: ["Startup mindset", "Building from scratch experience"] },
    ],
    outcome: "got_offer",
    processDescription: "Quick 2-round process. Very startup culture — they care about shipping speed and adaptability more than deep expertise in any one area.",
    tips: "Show you can wear multiple hats. Have examples of building things from zero. Startup experience is a big plus.",
    overallRating: 4,
    upvotes: 19,
    downvotes: 0,
    isAnonymous: false,
    authorName: "Deepak V.",
    createdAt: "2026-01-28T10:30:00Z",
  },
  {
    id: "ie-022",
    companyName: "Flipkart",
    role: "Data Engineer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a data warehouse schema for e-commerce", "Spark optimization techniques"] },
      { roundNumber: 2, type: "Technical", questions: ["SQL: complex joins and aggregations", "Data pipeline reliability patterns"] },
      { roundNumber: 3, type: "System Design", questions: ["Design Flipkart's product recommendation data pipeline"] },
    ],
    outcome: "rejected",
    processDescription: "Heavy focus on data engineering fundamentals. They use Spark, Hive, and Airflow heavily. The system design was domain-specific.",
    tips: "Master Spark — know partitioning, shuffles, broadcast joins. Practice complex SQL. Understand data warehousing concepts.",
    overallRating: 3,
    upvotes: 28,
    downvotes: 1,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-25T14:00:00Z",
  },
  {
    id: "ie-023",
    companyName: "Razorpay",
    role: "Product Manager",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Product intuition: improve UPI payments experience"] },
      { roundNumber: 2, type: "Technical", questions: ["API design for a payment checkout flow", "Data analysis case"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["Working with engineers", "Handling competing priorities"] },
    ],
    outcome: "ghosted",
    processDescription: "Good rounds but slow follow-up. After the culture fit round, the recruiter became unresponsive. Not a great candidate experience.",
    tips: "Know payments domain. Have API design knowledge. Show you can balance business and technical tradeoffs.",
    overallRating: 2,
    upvotes: 36,
    downvotes: 7,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-22T11:00:00Z",
  },
  {
    id: "ie-024",
    companyName: "Swiggy",
    role: "Full Stack Developer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Build a restaurant menu component (React)", "Node.js API for order management"] },
      { roundNumber: 2, type: "HR", questions: ["Career trajectory", "Compensation discussion"] },
    ],
    outcome: "in_progress",
    processDescription: "Simple 2-round process for the delivery team. Very practical, no algorithmic questions. Waiting for HR to finalize the offer.",
    tips: "Build side projects with both frontend and backend. Show you can deliver end-to-end features independently.",
    overallRating: 4,
    upvotes: 12,
    downvotes: 0,
    isAnonymous: false,
    authorName: "Nisha R.",
    createdAt: "2026-03-22T09:00:00Z",
  },
  {
    id: "ie-025",
    companyName: "PhonePe",
    role: "DevOps Engineer",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["Design a multi-region deployment strategy", "Kubernetes networking deep dive"] },
      { roundNumber: 2, type: "Technical", questions: ["Incident response scenario: payment system down", "Monitoring and alerting design"] },
      { roundNumber: 3, type: "System Design", questions: ["Design PhonePe's infrastructure for 10x scale"] },
      { roundNumber: 4, type: "HR", questions: ["On-call commitment", "Team lead aspirations"] },
    ],
    outcome: "rejected",
    processDescription: "Very intense. They operate at massive scale so expect deep infrastructure knowledge. The incident response scenario was realistic and stressful.",
    tips: "Know AWS/GCP deeply. Understand multi-region architectures. Practice incident response scenarios. They expect leadership potential.",
    overallRating: 3,
    upvotes: 44,
    downvotes: 2,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-18T16:00:00Z",
  },
  {
    id: "ie-026",
    companyName: "CRED",
    role: "Product Designer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Portfolio walkthrough", "Design philosophy"] },
      { roundNumber: 2, type: "Take-home", questions: ["Redesign CRED's bill payment experience with a focus on delight"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["What makes great design?", "Inspiration sources"] },
    ],
    outcome: "ghosted",
    processDescription: "The design challenge was interesting but vague. They want polished, high-fidelity work. After submitting, no response for a month.",
    tips: "Focus on micro-interactions and delight. CRED values aesthetics highly. Use Figma with proper auto-layout and design tokens.",
    overallRating: 2,
    upvotes: 53,
    downvotes: 8,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "ie-027",
    companyName: "Freshworks",
    role: "Backend Engineer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["REST vs GraphQL", "Database normalization"] },
      { roundNumber: 2, type: "Technical", questions: ["Design a SaaS multi-tenant system", "Caching strategies"] },
      { roundNumber: 3, type: "HR", questions: ["Work-life balance expectations", "Career path"] },
    ],
    outcome: "rejected",
    processDescription: "Standard SaaS company interview. Nothing too surprising. Good interviewers, fair questions. Rejection reason was 'team fit' which felt vague.",
    tips: "Know SaaS patterns — multi-tenancy, subscription billing, RBAC. Database design is important. They use Ruby on Rails and Java.",
    overallRating: 3,
    upvotes: 16,
    downvotes: 1,
    isAnonymous: false,
    authorName: "Sanjay K.",
    createdAt: "2026-01-12T13:00:00Z",
  },
  {
    id: "ie-028",
    companyName: "Meesho",
    role: "Frontend Developer",
    difficulty: "easy",
    rounds: [
      { roundNumber: 1, type: "Technical", questions: ["React component lifecycle", "Build a product card with add-to-cart"] },
      { roundNumber: 2, type: "HR", questions: ["Why Meesho?", "Growth expectations"] },
    ],
    outcome: "in_progress",
    processDescription: "Fast 2-round process. They're growing quickly and hiring a lot. Questions were practical and focused on real-world scenarios.",
    tips: "Know React basics well. Show enthusiasm for building products for India's next billion users. Keep solutions simple.",
    overallRating: 4,
    upvotes: 10,
    downvotes: 0,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-03-24T11:00:00Z",
  },
  {
    id: "ie-029",
    companyName: "Zerodha",
    role: "Full Stack Developer",
    difficulty: "medium",
    rounds: [
      { roundNumber: 1, type: "Take-home", questions: ["Build a stock portfolio tracker with charting (any stack)"] },
      { roundNumber: 2, type: "Technical", questions: ["Deep dive into take-home code", "Performance benchmarking discussion"] },
      { roundNumber: 3, type: "Culture Fit", questions: ["Open source involvement", "Learning approach"] },
    ],
    outcome: "ghosted",
    processDescription: "The take-home was great but the process stalled after culture fit. Zerodha seems to have a pattern of going silent. Very frustrating.",
    tips: "Minimize dependencies in your take-home. They love Go and Elixir. Show you care about performance metrics. Check Zerodha's tech blog for context.",
    overallRating: 2,
    upvotes: 48,
    downvotes: 3,
    isAnonymous: false,
    authorName: "Arjun B.",
    createdAt: "2026-01-08T09:00:00Z",
  },
  {
    id: "ie-030",
    companyName: "Google",
    role: "Product Manager",
    difficulty: "hard",
    rounds: [
      { roundNumber: 1, type: "Phone Screen", questions: ["Product design: improve Google Maps for blind users"] },
      { roundNumber: 2, type: "Technical", questions: ["Estimation: how many queries does Google Search handle per second?", "SQL analysis"] },
      { roundNumber: 3, type: "Technical", questions: ["Product strategy: enter a new market", "Go-to-market plan"] },
      { roundNumber: 4, type: "Culture Fit", questions: ["Impact stories", "Collaboration across time zones"] },
    ],
    outcome: "rejected",
    processDescription: "Very structured APM-style interview. Each round tested a different PM competency. Feedback was detailed and actionable.",
    tips: "Master the CIRCLES and AARM frameworks. Practice estimation questions. Have 10+ STAR stories ready. Google values 'thinking big'.",
    overallRating: 5,
    upvotes: 91,
    downvotes: 2,
    isAnonymous: true,
    authorName: null,
    createdAt: "2026-01-05T14:00:00Z",
  },
];

// ─── Discussion Threads (20) ───────────────────────────────────────────────

export const MOCK_DISCUSSION_THREADS: DiscussionThread[] = [
  { id: "dt-001", title: "Is a DSA-heavy interview process fair for frontend roles?", category: "tech", authorName: null, isAnonymous: true, body: "I've been interviewing at FAANG companies for frontend positions and they keep asking me to implement graph algorithms. How is that relevant to building UIs? Should frontend interviews focus more on practical skills like component design, accessibility, and performance optimization?", upvotes: 85, repliesCount: 23, lastActivityAt: "2026-03-25T10:00:00Z", createdAt: "2026-03-20T09:00:00Z" },
  { id: "dt-002", title: "Salary negotiation tips for startup offers", category: "salary", authorName: "Priya M.", isAnonymous: false, body: "I have an offer from a Series B startup. The base salary is below market but they're offering 0.1% equity. How do I evaluate this? Should I negotiate for higher base or more equity? What's the right framework for thinking about startup compensation?", upvotes: 62, repliesCount: 18, lastActivityAt: "2026-03-24T16:00:00Z", createdAt: "2026-03-18T11:00:00Z" },
  { id: "dt-003", title: "Best Figma plugins for design systems in 2026", category: "design", authorName: "Meera K.", isAnonymous: false, body: "Our team is building a design system from scratch. Looking for Figma plugin recommendations for: auto-layout helpers, token management, documentation generation, and handoff to developers. What's working well for your teams?", upvotes: 41, repliesCount: 12, lastActivityAt: "2026-03-23T14:00:00Z", createdAt: "2026-03-15T10:00:00Z" },
  { id: "dt-004", title: "Remote work: how to set boundaries with your team", category: "career_advice", authorName: null, isAnonymous: true, body: "I've been working remotely for 2 years and I'm burning out. My manager expects me to be available from 9am to 9pm because 'we're remote and flexible'. How do others handle this? Any tips for setting healthy boundaries without looking uncommitted?", upvotes: 73, repliesCount: 25, lastActivityAt: "2026-03-25T08:00:00Z", createdAt: "2026-03-12T15:00:00Z" },
  { id: "dt-005", title: "Growth marketing channels that actually work for B2B SaaS", category: "marketing", authorName: "Rahul G.", isAnonymous: false, body: "We've tried LinkedIn ads, Google Ads, content marketing, and cold email. LinkedIn gives the best lead quality but CPL is insane (₹2000+). What channels are working for B2B SaaS companies in India? Any creative approaches?", upvotes: 38, repliesCount: 14, lastActivityAt: "2026-03-22T11:00:00Z", createdAt: "2026-03-10T09:00:00Z" },
  { id: "dt-006", title: "The state of TypeScript in 2026 — worth the investment?", category: "tech", authorName: "Vikram S.", isAnonymous: false, body: "Starting a new project and debating whether to use TypeScript from day one. The type system has gotten more powerful but also more complex. For a small team of 3, is the upfront investment worth it? Would love to hear real experiences, not just theoretical arguments.", upvotes: 56, repliesCount: 20, lastActivityAt: "2026-03-24T09:00:00Z", createdAt: "2026-03-08T14:00:00Z" },
  { id: "dt-007", title: "How to transition from developer to product manager", category: "career_advice", authorName: null, isAnonymous: true, body: "I'm a senior developer with 6 years of experience. I've been thinking about moving to product management. What's the best path? Should I do an MBA? Take a PM course? Try to move internally? Would love advice from people who've made this transition.", upvotes: 47, repliesCount: 16, lastActivityAt: "2026-03-21T17:00:00Z", createdAt: "2026-03-05T10:00:00Z" },
  { id: "dt-008", title: "Building a personal brand on LinkedIn — genuine tips", category: "business", authorName: "Ankit P.", isAnonymous: false, body: "I see so many 'LinkedIn influencers' posting generic motivation content. What actually works for building a genuine professional brand? I'm a developer who wants to share technical content without being cringe. Any frameworks or examples?", upvotes: 34, repliesCount: 11, lastActivityAt: "2026-03-20T13:00:00Z", createdAt: "2026-03-02T16:00:00Z" },
  { id: "dt-009", title: "Is ₹25L a fair salary for 5 years experience in Bangalore?", category: "salary", authorName: null, isAnonymous: true, body: "Full stack developer, 5 years experience, currently at ₹18L. Got an offer for ₹25L from a mid-stage startup in Bangalore. Is this competitive or should I negotiate higher? For reference: React + Node.js stack, some AWS experience.", upvotes: 68, repliesCount: 22, lastActivityAt: "2026-03-25T12:00:00Z", createdAt: "2026-02-28T10:00:00Z" },
  { id: "dt-010", title: "What design tools are replacing Figma for prototyping?", category: "design", authorName: null, isAnonymous: true, body: "Figma's prototyping has gotten better but still feels limited for complex interactions. What tools are people using for high-fidelity prototypes with real data? Considering Framer, ProtoPie, or just building in code.", upvotes: 29, repliesCount: 8, lastActivityAt: "2026-03-19T10:00:00Z", createdAt: "2026-02-25T14:00:00Z" },
  { id: "dt-011", title: "How to handle a lowball counter-offer from your current company", category: "career_advice", authorName: "Deepak V.", isAnonymous: false, body: "I resigned with a 60% hike offer from another company. My current employer offered only 15% counter. Should I even consider it? What's the etiquette here? Will they treat me differently if I stay?", upvotes: 54, repliesCount: 19, lastActivityAt: "2026-03-23T09:00:00Z", createdAt: "2026-02-22T11:00:00Z" },
  { id: "dt-012", title: "SEO vs paid ads for early-stage SaaS — where to start?", category: "marketing", authorName: null, isAnonymous: true, body: "Pre-revenue SaaS with a small marketing budget (₹50K/month). Should we invest in SEO (long-term play) or paid ads (quick validation)? What's the right split at this stage?", upvotes: 22, repliesCount: 9, lastActivityAt: "2026-03-18T15:00:00Z", createdAt: "2026-02-20T09:00:00Z" },
  { id: "dt-013", title: "AI is not going to replace developers — here's why", category: "general", authorName: "Sneha L.", isAnonymous: false, body: "Tired of the 'AI will replace developers' narrative. AI is a tool, not a replacement. It makes good developers faster but can't replace the ability to understand business context, make architectural decisions, or empathize with users. Change my mind.", upvotes: 71, repliesCount: 24, lastActivityAt: "2026-03-25T07:00:00Z", createdAt: "2026-02-18T13:00:00Z" },
  { id: "dt-014", title: "Building B2B sales funnels that convert in India", category: "business", authorName: null, isAnonymous: true, body: "Our B2B SaaS has a 2% demo-to-paid conversion rate. Industry benchmark seems to be 5-10%. What are we doing wrong? Looking for advice on the India B2B sales process — is it fundamentally different from the US?", upvotes: 26, repliesCount: 7, lastActivityAt: "2026-03-17T11:00:00Z", createdAt: "2026-02-15T16:00:00Z" },
  { id: "dt-015", title: "React Server Components in production — real experiences", category: "tech", authorName: null, isAnonymous: true, body: "Has anyone shipped React Server Components to production? What's the DX like? Performance improvements? Gotchas? We're considering migrating our Next.js app and want real-world feedback, not just blog posts.", upvotes: 48, repliesCount: 15, lastActivityAt: "2026-03-22T14:00:00Z", createdAt: "2026-02-12T10:00:00Z" },
  { id: "dt-016", title: "How to deal with imposter syndrome as a senior engineer", category: "career_advice", authorName: null, isAnonymous: true, body: "Just got promoted to Staff Engineer and I feel like a fraud. Everyone expects me to have all the answers. Some days I spend hours stuck on a problem that I feel I should solve in minutes. Does this ever go away?", upvotes: 82, repliesCount: 21, lastActivityAt: "2026-03-24T20:00:00Z", createdAt: "2026-02-10T09:00:00Z" },
  { id: "dt-017", title: "Design system components: build vs buy?", category: "design", authorName: "Karthik R.", isAnonymous: false, body: "Starting a design system for our product. Should we build components from scratch, use Radix/shadcn as a base, or buy a commercial library like MUI Pro? Our team is 2 designers + 4 frontend devs.", upvotes: 35, repliesCount: 13, lastActivityAt: "2026-03-21T10:00:00Z", createdAt: "2026-02-08T14:00:00Z" },
  { id: "dt-018", title: "Content marketing for developer tools — what works?", category: "marketing", authorName: "Sanjay K.", isAnonymous: false, body: "We're building a developer tool and need to drive adoption. Blog posts, YouTube tutorials, open-source contributions, or conference talks — what's given the best ROI for other devtool companies?", upvotes: 31, repliesCount: 10, lastActivityAt: "2026-03-19T16:00:00Z", createdAt: "2026-02-05T11:00:00Z" },
  { id: "dt-019", title: "Work-life balance at Big Tech vs startups — honest comparison", category: "general", authorName: null, isAnonymous: true, body: "I've worked at both and the grass isn't always greener. Big tech has better hours but soul-crushing bureaucracy. Startups are exciting but the 'we're a family' culture often means unpaid overtime. What's your experience?", upvotes: 59, repliesCount: 17, lastActivityAt: "2026-03-23T18:00:00Z", createdAt: "2026-02-02T10:00:00Z" },
  { id: "dt-020", title: "What's the real value of an MBA for tech professionals?", category: "business", authorName: "Nisha R.", isAnonymous: false, body: "I'm a developer considering an MBA from a top IIM. The opportunity cost is huge (2 years + ₹25L). For those who've done it — was it worth it? Did it actually help your career in tech, or is it just a signaling mechanism?", upvotes: 43, repliesCount: 14, lastActivityAt: "2026-03-20T09:00:00Z", createdAt: "2026-01-30T15:00:00Z" },
];

// ─── Discussion Replies (40) ───────────────────────────────────────────────

export const MOCK_DISCUSSION_REPLIES: DiscussionReply[] = [
  // Thread dt-001 (DSA for frontend)
  { id: "dr-001", threadId: "dt-001", parentReplyId: null, authorName: null, isAnonymous: true, body: "Completely agree. I had to implement Dijkstra's algorithm for a frontend role at Google. How is that relevant to building React components? Frontend interviews should test CSS mastery, component architecture, and web performance.", upvotes: 42, createdAt: "2026-03-20T10:00:00Z" },
  { id: "dr-002", threadId: "dt-001", parentReplyId: "dr-001", authorName: "Vikram S.", isAnonymous: false, body: "Counter-argument: DSA tests problem-solving ability, not just domain knowledge. A good frontend engineer needs to optimize rendering algorithms, manage complex state trees, and handle data structures efficiently.", upvotes: 28, createdAt: "2026-03-20T11:30:00Z" },
  { id: "dr-003", threadId: "dt-001", parentReplyId: null, authorName: "Ankit P.", isAnonymous: false, body: "The real problem is that companies are lazy about designing role-specific interviews. Frontend should test: building a design system component, debugging a performance issue, handling accessibility, and state management patterns. Not binary tree traversals.", upvotes: 56, createdAt: "2026-03-20T14:00:00Z" },
  { id: "dr-004", threadId: "dt-001", parentReplyId: "dr-003", authorName: null, isAnonymous: true, body: "This is exactly right. The companies that do this well (Stripe, Airbnb) have much better frontend interviews. They test what you'll actually do on the job.", upvotes: 19, createdAt: "2026-03-21T09:00:00Z" },

  // Thread dt-002 (Salary negotiation)
  { id: "dr-005", threadId: "dt-002", parentReplyId: null, authorName: null, isAnonymous: true, body: "General rule: equity is lottery tickets, base salary is real money. At Series B, the equity might be worth something, but I'd prioritize base. Try to get at least market rate base + equity as upside.", upvotes: 35, createdAt: "2026-03-18T14:00:00Z" },
  { id: "dr-006", threadId: "dt-002", parentReplyId: "dr-005", authorName: "Deepak V.", isAnonymous: false, body: "Agree but with a caveat — at Series B with good investors, the equity could be 5-10x in 3-4 years. Ask about their last valuation, revenue growth, and runway. If the fundamentals are strong, equity could be very valuable.", upvotes: 22, createdAt: "2026-03-19T10:00:00Z" },
  { id: "dr-007", threadId: "dt-002", parentReplyId: null, authorName: "Rahul G.", isAnonymous: false, body: "Always negotiate. The worst they can say is no. Ask for 15-20% above their initial offer on base, plus a signing bonus to cover the gap in your first year. Companies expect negotiation.", upvotes: 41, createdAt: "2026-03-20T09:00:00Z" },

  // Thread dt-004 (Remote boundaries)
  { id: "dr-008", threadId: "dt-004", parentReplyId: null, authorName: "Sneha L.", isAnonymous: false, body: "Set your Slack status to 'Away' at 6pm sharp every day. Block 'focus time' on your calendar. Turn off notifications after hours. It takes discipline but your manager will adjust. If they don't, that's a red flag about the company.", upvotes: 48, createdAt: "2026-03-13T09:00:00Z" },
  { id: "dr-009", threadId: "dt-004", parentReplyId: "dr-008", authorName: null, isAnonymous: true, body: "This works in theory but my manager schedules calls at 8pm because it's convenient for the US team. Anyone dealt with cross-timezone boundary issues?", upvotes: 15, createdAt: "2026-03-13T14:00:00Z" },
  { id: "dr-010", threadId: "dt-004", parentReplyId: "dr-009", authorName: "Priya M.", isAnonymous: false, body: "I handle this by being very explicit during onboarding about my available hours. For cross-TZ meetings, I alternate — sometimes I take the late call, sometimes they take the early one. Fairness goes both ways.", upvotes: 33, createdAt: "2026-03-14T10:00:00Z" },

  // Thread dt-006 (TypeScript)
  { id: "dr-011", threadId: "dt-006", parentReplyId: null, authorName: null, isAnonymous: true, body: "100% worth it, even for a team of 3. We adopted TS 2 years ago and the number of runtime bugs dropped dramatically. The key is to use it pragmatically — strict mode yes, but don't over-type everything.", upvotes: 38, createdAt: "2026-03-09T10:00:00Z" },
  { id: "dr-012", threadId: "dt-006", parentReplyId: null, authorName: "Karthik R.", isAnonymous: false, body: "Start with strict: false and gradually tighten. Use Zod for runtime validation at API boundaries. The investment pays off when you refactor — TS catches things that tests miss.", upvotes: 29, createdAt: "2026-03-10T11:00:00Z" },

  // Thread dt-009 (₹25L salary)
  { id: "dr-013", threadId: "dt-009", parentReplyId: null, authorName: null, isAnonymous: true, body: "₹25L for 5 years full stack in Bangalore is slightly below market in 2026. I'd push for ₹28-30L. If they have equity, factor that in. Check levels.fyi for comparable data.", upvotes: 44, createdAt: "2026-03-01T10:00:00Z" },
  { id: "dr-014", threadId: "dt-009", parentReplyId: "dr-013", authorName: null, isAnonymous: true, body: "Depends on the company stage. Mid-stage startup at ₹25L is below market. But if it's pre-Series A with significant equity, the total package might be competitive.", upvotes: 18, createdAt: "2026-03-01T15:00:00Z" },
  { id: "dr-015", threadId: "dt-009", parentReplyId: null, authorName: "Amit T.", isAnonymous: false, body: "I just switched at 5 YOE for ₹32L base + RSUs. React + Node.js with AWS is a hot combo right now. You can definitely get more. Don't settle.", upvotes: 31, createdAt: "2026-03-02T09:00:00Z" },

  // Thread dt-013 (AI not replacing devs)
  { id: "dr-016", threadId: "dt-013", parentReplyId: null, authorName: null, isAnonymous: true, body: "AI will replace developers who refuse to use AI. It won't replace developers who use AI effectively. The skill set is shifting from 'write code' to 'architect solutions and verify AI output'.", upvotes: 52, createdAt: "2026-02-19T10:00:00Z" },
  { id: "dr-017", threadId: "dt-013", parentReplyId: "dr-016", authorName: "Vikram S.", isAnonymous: false, body: "This is the best take. I've increased my output 3x with AI assistants but I still need to understand what I'm building and why. Junior devs who can't evaluate AI output are at risk though.", upvotes: 37, createdAt: "2026-02-20T11:00:00Z" },
  { id: "dr-018", threadId: "dt-013", parentReplyId: null, authorName: "Sanjay K.", isAnonymous: false, body: "The 'AI will replace X' narrative has been wrong for every profession so far. Doctors, lawyers, accountants — AI augments, it doesn't replace. Software development will be the same.", upvotes: 28, createdAt: "2026-02-21T14:00:00Z" },

  // Thread dt-016 (Imposter syndrome)
  { id: "dr-019", threadId: "dt-016", parentReplyId: null, authorName: null, isAnonymous: true, body: "10 years in and it hasn't gone away. But I've learned to reframe it: if you're the smartest person in the room, you're in the wrong room. Feeling like you don't know enough means you're growing.", upvotes: 61, createdAt: "2026-02-11T09:00:00Z" },
  { id: "dr-020", threadId: "dt-016", parentReplyId: null, authorName: "Meera K.", isAnonymous: false, body: "Something that helped me: keep a 'wins journal'. Write down one thing you did well each day. When imposter syndrome hits, read through it. Evidence beats feelings.", upvotes: 45, createdAt: "2026-02-12T10:00:00Z" },
  { id: "dr-021", threadId: "dt-016", parentReplyId: "dr-019", authorName: null, isAnonymous: true, body: "This is such a good reframe. Also: nobody has all the answers. Your job as a Staff Engineer isn't to know everything — it's to know how to find answers and guide others.", upvotes: 33, createdAt: "2026-02-12T14:00:00Z" },

  // Thread dt-015 (RSC)
  { id: "dr-022", threadId: "dt-015", parentReplyId: null, authorName: "Ankit P.", isAnonymous: false, body: "We've been using RSC in production for 6 months. Performance is noticeably better — our LCP dropped 40%. But the mental model is challenging for the team. Debugging is harder too.", upvotes: 32, createdAt: "2026-02-13T10:00:00Z" },
  { id: "dr-023", threadId: "dt-015", parentReplyId: "dr-022", authorName: null, isAnonymous: true, body: "40% LCP improvement is massive. Can you share your architecture? Are you using the app router with streaming SSR? How do you handle data fetching?", upvotes: 18, createdAt: "2026-02-14T09:00:00Z" },

  // More scattered replies across other threads
  { id: "dr-024", threadId: "dt-003", parentReplyId: null, authorName: null, isAnonymous: true, body: "Tokens Studio is the best Figma plugin for design tokens. It syncs with your code's design token format. For documentation, try Zeroheight — it generates component docs from Figma.", upvotes: 22, createdAt: "2026-03-16T10:00:00Z" },
  { id: "dr-025", threadId: "dt-005", parentReplyId: null, authorName: null, isAnonymous: true, body: "Community-led growth is working great for us. We started a Slack community for our users, run weekly webinars, and have a referral program. CPL is basically zero for community-sourced leads.", upvotes: 27, createdAt: "2026-03-11T14:00:00Z" },
  { id: "dr-026", threadId: "dt-007", parentReplyId: null, authorName: "Nisha R.", isAnonymous: false, body: "I made this transition 2 years ago. Skip the MBA — it's not needed for PM. Instead: ship a side project, read 'Inspired' by Marty Cagan, and try to move internally first. Companies value PM+engineering combo.", upvotes: 39, createdAt: "2026-03-06T11:00:00Z" },
  { id: "dr-027", threadId: "dt-008", parentReplyId: null, authorName: null, isAnonymous: true, body: "Write about what you're actually building. Not 'motivational Monday' posts. Share code snippets, architecture decisions, lessons from bugs. Developers respect substance over fluff.", upvotes: 31, createdAt: "2026-03-03T10:00:00Z" },
  { id: "dr-028", threadId: "dt-011", parentReplyId: null, authorName: null, isAnonymous: true, body: "Never accept a counter offer. Stats show 80% of people who accept counter offers leave within 6 months anyway. Your employer now knows you were looking to leave — that trust is broken.", upvotes: 46, createdAt: "2026-02-23T09:00:00Z" },
  { id: "dr-029", threadId: "dt-017", parentReplyId: null, authorName: null, isAnonymous: true, body: "We used shadcn/ui as a base and customized from there. It gave us 80% of what we needed out of the box with full control over the code. Much better than MUI for our needs.", upvotes: 24, createdAt: "2026-02-09T10:00:00Z" },
  { id: "dr-030", threadId: "dt-019", parentReplyId: null, authorName: "Arjun B.", isAnonymous: false, body: "Startup WLB depends entirely on the founders. I've worked at startups with great balance and Big Tech teams that expected 60-hour weeks. It's about the team and manager, not the company type.", upvotes: 38, createdAt: "2026-02-03T14:00:00Z" },
  { id: "dr-031", threadId: "dt-020", parentReplyId: null, authorName: null, isAnonymous: true, body: "Did my MBA from IIM-A after 4 years of dev. Honestly, the network is the main value. I pivoted to PM at a top company and the MBA helped get past the resume screen. But learning-wise, most of it was available online.", upvotes: 29, createdAt: "2026-01-31T10:00:00Z" },
  { id: "dr-032", threadId: "dt-010", parentReplyId: null, authorName: "Meera K.", isAnonymous: false, body: "Framer has gotten really good for prototyping. It generates real React code which makes developer handoff seamless. For complex animations, I still use ProtoPie though.", upvotes: 17, createdAt: "2026-02-26T11:00:00Z" },
  { id: "dr-033", threadId: "dt-012", parentReplyId: null, authorName: "Rahul G.", isAnonymous: false, body: "At ₹50K/month, do content marketing + SEO. Paid ads will burn through that in a week with little learning. Build 10 high-quality blog posts targeting long-tail keywords. You'll see results in 3-4 months.", upvotes: 20, createdAt: "2026-02-21T10:00:00Z" },
  { id: "dr-034", threadId: "dt-014", parentReplyId: null, authorName: null, isAnonymous: true, body: "India B2B sales cycle is relationship-driven. Cold email doesn't work as well as it does in the US. Invest in warm introductions, WhatsApp follow-ups, and in-person demos when possible.", upvotes: 23, createdAt: "2026-02-16T14:00:00Z" },
  { id: "dr-035", threadId: "dt-018", parentReplyId: null, authorName: null, isAnonymous: true, body: "YouTube tutorials have the best ROI for devtools. We got 10K users from a single well-produced tutorial video. Blog posts take months to rank. YouTube gets you visibility in days.", upvotes: 26, createdAt: "2026-02-06T10:00:00Z" },

  // A few more to reach ~40
  { id: "dr-036", threadId: "dt-001", parentReplyId: "dr-002", authorName: null, isAnonymous: true, body: "There's a difference between testing problem-solving and testing memorization of specific algorithms. You can test problem-solving with practical frontend challenges without resorting to LeetCode-style questions.", upvotes: 21, createdAt: "2026-03-21T11:00:00Z" },
  { id: "dr-037", threadId: "dt-004", parentReplyId: null, authorName: "Deepak V.", isAnonymous: false, body: "I created a 'working hours' document and shared it with my team on day one. It clearly states my availability, response time expectations, and emergency protocol. Having it written down removes ambiguity.", upvotes: 40, createdAt: "2026-03-15T09:00:00Z" },
  { id: "dr-038", threadId: "dt-013", parentReplyId: "dr-017", authorName: null, isAnonymous: true, body: "The ironic thing is AI tools make experienced developers MORE productive, not less needed. If anything, the value of good engineering judgment goes UP when you can generate code faster.", upvotes: 25, createdAt: "2026-02-22T10:00:00Z" },
  { id: "dr-039", threadId: "dt-016", parentReplyId: "dr-020", authorName: null, isAnonymous: true, body: "The wins journal is brilliant. I also recommend asking for specific feedback from your manager. Hearing 'you did X well' from someone else helps combat the internal narrative.", upvotes: 19, createdAt: "2026-02-13T15:00:00Z" },
  { id: "dr-040", threadId: "dt-009", parentReplyId: "dr-015", authorName: null, isAnonymous: true, body: "₹32L at 5 YOE is top quartile even for Bangalore. That's a great benchmark to share but not everyone will get that. ₹25-28L is more realistic for mid-tier companies.", upvotes: 14, createdAt: "2026-03-03T10:00:00Z" },
];

// ─── Salary Data (~120 entries across 15 roles × 3 locations) ──────────────

function salaryEntry(
  id: string,
  role: string,
  location: string,
  experienceYears: number,
  baseSalary: number,
  totalComp: number,
  companyName?: string,
): SalaryEntry {
  return {
    id,
    role,
    companyName: companyName || null,
    location,
    experienceYears,
    baseSalary,
    totalComp,
    currency: "INR",
    createdAt: "2026-03-01T00:00:00Z",
  };
}

export const MOCK_SALARY_DATA: SalaryEntry[] = [
  // Frontend Developer — Bangalore
  salaryEntry("s-001", "Frontend Developer", "Bangalore", 1, 600000, 650000),
  salaryEntry("s-002", "Frontend Developer", "Bangalore", 2, 900000, 1000000, "Flipkart"),
  salaryEntry("s-003", "Frontend Developer", "Bangalore", 3, 1400000, 1600000),
  salaryEntry("s-004", "Frontend Developer", "Bangalore", 4, 1800000, 2100000, "Swiggy"),
  salaryEntry("s-005", "Frontend Developer", "Bangalore", 5, 2200000, 2600000),
  salaryEntry("s-006", "Frontend Developer", "Bangalore", 7, 3000000, 3800000, "Google"),
  salaryEntry("s-007", "Frontend Developer", "Bangalore", 10, 4000000, 5500000),
  salaryEntry("s-008", "Frontend Developer", "Bangalore", 3, 1200000, 1400000),
  // Frontend Developer — Mumbai
  salaryEntry("s-009", "Frontend Developer", "Mumbai", 2, 800000, 900000),
  salaryEntry("s-010", "Frontend Developer", "Mumbai", 4, 1600000, 1900000),
  salaryEntry("s-011", "Frontend Developer", "Mumbai", 6, 2400000, 3000000),
  salaryEntry("s-012", "Frontend Developer", "Mumbai", 8, 3200000, 4200000),
  // Frontend Developer — Remote
  salaryEntry("s-013", "Frontend Developer", "Remote", 2, 1000000, 1100000),
  salaryEntry("s-014", "Frontend Developer", "Remote", 5, 2500000, 3000000),
  salaryEntry("s-015", "Frontend Developer", "Remote", 8, 3500000, 4500000),

  // Backend Engineer — Bangalore
  salaryEntry("s-016", "Backend Engineer", "Bangalore", 1, 700000, 750000),
  salaryEntry("s-017", "Backend Engineer", "Bangalore", 2, 1000000, 1100000, "Razorpay"),
  salaryEntry("s-018", "Backend Engineer", "Bangalore", 3, 1500000, 1800000),
  salaryEntry("s-019", "Backend Engineer", "Bangalore", 5, 2400000, 3000000, "PhonePe"),
  salaryEntry("s-020", "Backend Engineer", "Bangalore", 7, 3200000, 4200000),
  salaryEntry("s-021", "Backend Engineer", "Bangalore", 10, 4500000, 6000000, "Google"),
  salaryEntry("s-022", "Backend Engineer", "Bangalore", 4, 1900000, 2200000),
  // Backend Engineer — Mumbai
  salaryEntry("s-023", "Backend Engineer", "Mumbai", 2, 900000, 1000000),
  salaryEntry("s-024", "Backend Engineer", "Mumbai", 5, 2100000, 2600000),
  salaryEntry("s-025", "Backend Engineer", "Mumbai", 8, 3500000, 4500000),
  // Backend Engineer — Remote
  salaryEntry("s-026", "Backend Engineer", "Remote", 3, 1600000, 1900000),
  salaryEntry("s-027", "Backend Engineer", "Remote", 6, 2800000, 3500000),
  salaryEntry("s-028", "Backend Engineer", "Remote", 9, 4000000, 5200000),

  // Full Stack Developer — Bangalore
  salaryEntry("s-029", "Full Stack Developer", "Bangalore", 2, 1000000, 1100000),
  salaryEntry("s-030", "Full Stack Developer", "Bangalore", 4, 1800000, 2200000),
  salaryEntry("s-031", "Full Stack Developer", "Bangalore", 6, 2600000, 3200000),
  salaryEntry("s-032", "Full Stack Developer", "Bangalore", 8, 3400000, 4400000),
  // Full Stack Developer — Mumbai
  salaryEntry("s-033", "Full Stack Developer", "Mumbai", 3, 1300000, 1500000),
  salaryEntry("s-034", "Full Stack Developer", "Mumbai", 5, 2000000, 2500000),
  // Full Stack Developer — Remote
  salaryEntry("s-035", "Full Stack Developer", "Remote", 4, 2000000, 2400000),
  salaryEntry("s-036", "Full Stack Developer", "Remote", 7, 3000000, 3800000),

  // Product Designer — Bangalore
  salaryEntry("s-037", "Product Designer", "Bangalore", 1, 500000, 550000),
  salaryEntry("s-038", "Product Designer", "Bangalore", 3, 1200000, 1400000, "CRED"),
  salaryEntry("s-039", "Product Designer", "Bangalore", 5, 2000000, 2500000),
  salaryEntry("s-040", "Product Designer", "Bangalore", 7, 2800000, 3500000),
  // Product Designer — Mumbai
  salaryEntry("s-041", "Product Designer", "Mumbai", 2, 800000, 900000),
  salaryEntry("s-042", "Product Designer", "Mumbai", 5, 1800000, 2200000),
  // Product Designer — Remote
  salaryEntry("s-043", "Product Designer", "Remote", 3, 1400000, 1600000),
  salaryEntry("s-044", "Product Designer", "Remote", 6, 2400000, 3000000),

  // Product Manager — Bangalore
  salaryEntry("s-045", "Product Manager", "Bangalore", 2, 1200000, 1400000),
  salaryEntry("s-046", "Product Manager", "Bangalore", 4, 2000000, 2500000, "Flipkart"),
  salaryEntry("s-047", "Product Manager", "Bangalore", 6, 2800000, 3600000),
  salaryEntry("s-048", "Product Manager", "Bangalore", 9, 4000000, 5500000, "Google"),
  // Product Manager — Mumbai
  salaryEntry("s-049", "Product Manager", "Mumbai", 3, 1500000, 1800000),
  salaryEntry("s-050", "Product Manager", "Mumbai", 6, 2500000, 3200000),
  // Product Manager — Remote
  salaryEntry("s-051", "Product Manager", "Remote", 4, 2200000, 2700000),
  salaryEntry("s-052", "Product Manager", "Remote", 8, 3500000, 4800000),

  // Data Analyst — Bangalore
  salaryEntry("s-053", "Data Analyst", "Bangalore", 1, 500000, 550000),
  salaryEntry("s-054", "Data Analyst", "Bangalore", 3, 1000000, 1200000),
  salaryEntry("s-055", "Data Analyst", "Bangalore", 5, 1600000, 2000000),
  // Data Analyst — Mumbai
  salaryEntry("s-056", "Data Analyst", "Mumbai", 2, 700000, 800000),
  salaryEntry("s-057", "Data Analyst", "Mumbai", 4, 1200000, 1500000),
  // Data Analyst — Remote
  salaryEntry("s-058", "Data Analyst", "Remote", 3, 1100000, 1300000),

  // Data Engineer — Bangalore
  salaryEntry("s-059", "Data Engineer", "Bangalore", 2, 1100000, 1300000),
  salaryEntry("s-060", "Data Engineer", "Bangalore", 4, 1800000, 2200000, "Meesho"),
  salaryEntry("s-061", "Data Engineer", "Bangalore", 6, 2600000, 3200000),
  salaryEntry("s-062", "Data Engineer", "Bangalore", 9, 3800000, 5000000),
  // Data Engineer — Mumbai
  salaryEntry("s-063", "Data Engineer", "Mumbai", 3, 1300000, 1500000),
  salaryEntry("s-064", "Data Engineer", "Mumbai", 6, 2200000, 2800000),
  // Data Engineer — Remote
  salaryEntry("s-065", "Data Engineer", "Remote", 4, 2000000, 2400000),
  salaryEntry("s-066", "Data Engineer", "Remote", 7, 3000000, 3800000),

  // ML Engineer — Bangalore
  salaryEntry("s-067", "ML Engineer", "Bangalore", 2, 1200000, 1400000),
  salaryEntry("s-068", "ML Engineer", "Bangalore", 4, 2200000, 2800000),
  salaryEntry("s-069", "ML Engineer", "Bangalore", 6, 3200000, 4200000, "Google"),
  salaryEntry("s-070", "ML Engineer", "Bangalore", 9, 4500000, 6500000),
  // ML Engineer — Mumbai
  salaryEntry("s-071", "ML Engineer", "Mumbai", 3, 1500000, 1800000),
  salaryEntry("s-072", "ML Engineer", "Mumbai", 6, 2800000, 3600000),
  // ML Engineer — Remote
  salaryEntry("s-073", "ML Engineer", "Remote", 4, 2400000, 3000000),
  salaryEntry("s-074", "ML Engineer", "Remote", 8, 4000000, 5500000),

  // DevOps Engineer — Bangalore
  salaryEntry("s-075", "DevOps Engineer", "Bangalore", 2, 1000000, 1100000),
  salaryEntry("s-076", "DevOps Engineer", "Bangalore", 4, 1800000, 2200000),
  salaryEntry("s-077", "DevOps Engineer", "Bangalore", 6, 2600000, 3200000),
  salaryEntry("s-078", "DevOps Engineer", "Bangalore", 9, 3600000, 4800000),
  // DevOps Engineer — Mumbai
  salaryEntry("s-079", "DevOps Engineer", "Mumbai", 3, 1200000, 1400000),
  salaryEntry("s-080", "DevOps Engineer", "Mumbai", 5, 2000000, 2500000),
  // DevOps Engineer — Remote
  salaryEntry("s-081", "DevOps Engineer", "Remote", 4, 2000000, 2400000),
  salaryEntry("s-082", "DevOps Engineer", "Remote", 7, 3200000, 4200000),

  // QA Engineer — Bangalore
  salaryEntry("s-083", "QA Engineer", "Bangalore", 2, 700000, 800000),
  salaryEntry("s-084", "QA Engineer", "Bangalore", 4, 1200000, 1400000),
  salaryEntry("s-085", "QA Engineer", "Bangalore", 7, 2000000, 2400000),
  // QA Engineer — Mumbai
  salaryEntry("s-086", "QA Engineer", "Mumbai", 3, 900000, 1000000),
  // QA Engineer — Remote
  salaryEntry("s-087", "QA Engineer", "Remote", 5, 1600000, 1900000),

  // iOS Developer — Bangalore
  salaryEntry("s-088", "iOS Developer", "Bangalore", 2, 1000000, 1100000),
  salaryEntry("s-089", "iOS Developer", "Bangalore", 4, 1800000, 2200000),
  salaryEntry("s-090", "iOS Developer", "Bangalore", 7, 3000000, 3800000),
  // iOS Developer — Mumbai
  salaryEntry("s-091", "iOS Developer", "Mumbai", 3, 1200000, 1400000),
  // iOS Developer — Remote
  salaryEntry("s-092", "iOS Developer", "Remote", 5, 2400000, 3000000),

  // Android Developer — Bangalore
  salaryEntry("s-093", "Android Developer", "Bangalore", 2, 900000, 1000000),
  salaryEntry("s-094", "Android Developer", "Bangalore", 4, 1700000, 2000000),
  salaryEntry("s-095", "Android Developer", "Bangalore", 7, 2800000, 3600000),
  // Android Developer — Mumbai
  salaryEntry("s-096", "Android Developer", "Mumbai", 3, 1100000, 1300000),
  salaryEntry("s-097", "Android Developer", "Mumbai", 6, 2200000, 2800000),
  // Android Developer — Remote
  salaryEntry("s-098", "Android Developer", "Remote", 5, 2200000, 2800000),

  // Cloud Architect — Bangalore
  salaryEntry("s-099", "Cloud Architect", "Bangalore", 5, 2800000, 3500000),
  salaryEntry("s-100", "Cloud Architect", "Bangalore", 8, 4000000, 5500000),
  salaryEntry("s-101", "Cloud Architect", "Bangalore", 12, 5500000, 7500000),
  // Cloud Architect — Mumbai
  salaryEntry("s-102", "Cloud Architect", "Mumbai", 6, 2600000, 3200000),
  // Cloud Architect — Remote
  salaryEntry("s-103", "Cloud Architect", "Remote", 7, 3500000, 4500000),
  salaryEntry("s-104", "Cloud Architect", "Remote", 10, 5000000, 6800000),

  // Tech Lead — Bangalore
  salaryEntry("s-105", "Tech Lead", "Bangalore", 6, 3000000, 3800000),
  salaryEntry("s-106", "Tech Lead", "Bangalore", 8, 3800000, 5000000, "Flipkart"),
  salaryEntry("s-107", "Tech Lead", "Bangalore", 10, 4500000, 6200000),
  salaryEntry("s-108", "Tech Lead", "Bangalore", 12, 5500000, 7500000, "Google"),
  // Tech Lead — Mumbai
  salaryEntry("s-109", "Tech Lead", "Mumbai", 7, 3200000, 4200000),
  salaryEntry("s-110", "Tech Lead", "Mumbai", 10, 4200000, 5800000),
  // Tech Lead — Remote
  salaryEntry("s-111", "Tech Lead", "Remote", 8, 4000000, 5200000),
  salaryEntry("s-112", "Tech Lead", "Remote", 11, 5000000, 6800000),

  // Engineering Manager — Bangalore
  salaryEntry("s-113", "Engineering Manager", "Bangalore", 8, 4000000, 5500000),
  salaryEntry("s-114", "Engineering Manager", "Bangalore", 10, 5000000, 7000000, "Razorpay"),
  salaryEntry("s-115", "Engineering Manager", "Bangalore", 13, 6000000, 8500000),
  salaryEntry("s-116", "Engineering Manager", "Bangalore", 15, 7000000, 10000000),
  // Engineering Manager — Mumbai
  salaryEntry("s-117", "Engineering Manager", "Mumbai", 9, 4200000, 5800000),
  salaryEntry("s-118", "Engineering Manager", "Mumbai", 12, 5500000, 7500000),
  // Engineering Manager — Remote
  salaryEntry("s-119", "Engineering Manager", "Remote", 10, 5500000, 7500000),
  salaryEntry("s-120", "Engineering Manager", "Remote", 14, 6500000, 9000000),
];

// ─── Salary Aggregation Helper ─────────────────────────────────────────────

export function computeSalaryAggregation(
  role: string,
  location: string,
  expMin = 0,
  expMax = 99,
): SalaryAggregation | null {
  let filtered = MOCK_SALARY_DATA.filter(
    (s) => s.role === role && s.experienceYears >= expMin && s.experienceYears <= expMax,
  );

  if (location !== "All") {
    filtered = filtered.filter((s) => s.location === location);
  }

  if (filtered.length === 0) return null;

  const comps = filtered.map((s) => s.totalComp).sort((a, b) => a - b);
  const n = comps.length;

  const p25 = comps[Math.floor(n * 0.25)] || comps[0];
  const median = comps[Math.floor(n * 0.5)] || comps[0];
  const p75 = comps[Math.floor(n * 0.75)] || comps[n - 1];

  // Build distribution buckets (5L increments)
  const minVal = comps[0];
  const maxVal = comps[n - 1];
  const bucketSize = 500000;
  const bucketStart = Math.floor(minVal / bucketSize) * bucketSize;
  const bucketEnd = Math.ceil(maxVal / bucketSize) * bucketSize;

  const distribution: { bucket: string; count: number }[] = [];
  for (let b = bucketStart; b < bucketEnd; b += bucketSize) {
    const label = `₹${(b / 100000).toFixed(0)}L-${((b + bucketSize) / 100000).toFixed(0)}L`;
    const count = comps.filter((c) => c >= b && c < b + bucketSize).length;
    distribution.push({ bucket: label, count });
  }

  return {
    role,
    location,
    sampleSize: n,
    median,
    p25,
    p75,
    min: comps[0],
    max: comps[n - 1],
    distribution,
  };
}

// ─── Unique Lists ──────────────────────────────────────────────────────────

export const MOCK_COMPANIES_LIST: string[] = [
  ...new Set(MOCK_INTERVIEW_EXPERIENCES.map((e) => e.companyName)),
].sort();

export const MOCK_SALARY_ROLES: string[] = [
  ...new Set(MOCK_SALARY_DATA.map((s) => s.role)),
].sort();

export const MOCK_SALARY_LOCATIONS: string[] = ["All", "Bangalore", "Mumbai", "Remote"];
