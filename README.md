# Should I Go? — Personalized Event Decision Tool

**Should I Go?** is a structured decision assistant web application that evaluates public event URLs against personal user preferences (interests, budget, preferred days/times, primary goals) and provides deterministic recommendations: **Go**, **Maybe**, or **Skip**.

---

## Technical Features

- **Supabase Anonymous Authentication**: Instant user sessions without sign-up friction.
- **Row Level Security (RLS)**: Enforced via PostgreSQL policies `auth.uid() = user_id`.
- **Gemini API Integration**: Structured JSON extraction for event dates, prices, topics, audience, and missing facts via Supabase Edge Function.
- **Deterministic TypeScript Engine**: 100-point transparent scoring across 5 distinct categories (Interest Match 35pts, Goal Match 25pts, Price Fit 20pts, Timing 10pts, Novelty 10pts).
- **Saved Events Library**: Prevents duplicate URL saves per user and tracks attendance status (`Considering`, `Attending`, `Skipped`, `Attended`).
- **Post-Event Feedback**: User ratings (1-5 stars), worth-it evaluation, and accuracy telemetry logged to database.
- **Developer `/evals` Suite**: Benchmark harness evaluating 10 sample event datasets to measure field extraction accuracy, latency, and prompt versions (`v1.0.0`).

---

## Project Structure

```
should-i-go/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Badge.tsx               # Go / Maybe / Skip decision badges
│   │   ├── EventCard.tsx           # Saved event grid card component
│   │   ├── FeedbackModal.tsx       # 1-5 rating & feedback modal
│   │   ├── Footer.tsx              # App footer
│   │   ├── InterestChip.tsx        # Multi-select preference chip
│   │   ├── Navbar.tsx              # Sticky navigation header
│   │   └── ScoreCard.tsx           # 100-point score breakdown bars
│   ├── context/
│   │   └── AuthContext.tsx         # Anonymous auth & preference state
│   ├── lib/
│   │   ├── gemini.ts               # Extraction caller & client proxy fallback
│   │   ├── logger.ts               # Telemetry logging to api_logs
│   │   ├── scoring.ts              # Deterministic TypeScript scoring module
│   │   ├── supabase.ts             # Supabase client & anonymous auth helpers
│   │   └── urlParser.ts            # URL validation & date/price formatters
│   ├── pages/
│   │   ├── AnalyzePage.tsx         # '/analyze' URL extraction & score view
│   │   ├── EvalsPage.tsx           # '/evals' Developer evaluation harness
│   │   ├── EventDetailPage.tsx     # '/events/:id' Detail view & raw JSON inspector
│   │   ├── EventsListPage.tsx      # '/events' Saved events dashboard
│   │   ├── LandingPage.tsx         # '/' Hero section & quick analyze input
│   │   ├── OnboardingPage.tsx      # '/onboarding' First-time preference setup
│   │   └── SettingsPage.tsx        # '/settings' View and update preference profile
│   ├── types/
│   │   └── index.ts                # TypeScript interface declarations
│   ├── utils/
│   │   └── evalDataset.ts          # 10 test event datasets for accuracy evaluation
│   ├── App.tsx                     # Router & App layout entry
│   ├── index.css                   # Tailwind CSS & design tokens
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   └── 20260802000000_init_schema.sql  # Postgres schema & RLS policies
│   └── functions/
│       └── analyze-event/
│           └── index.ts            # Supabase Edge Function with Gemini API call
├── .env.example
├── README.md
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Local Development & Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials and optional Gemini API key.

### 3. Run Database Migrations
Execute the SQL script in `supabase/migrations/20260802000000_init_schema.sql` inside your Supabase SQL Editor.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Assumptions & Known Limitations

1. **Public Event Extraction**: The Gemini extraction engine relies on public HTTP/HTTPS event URLs. If a URL requires private login or paywalls, the heuristic parser extracts available URL metadata and marks missing details in `missingInformation`.
2. **Deterministic Thresholds**:
   - `75 - 100`: **Go**
   - `50 - 74`: **Maybe**
   - `0 - 49`: **Skip**
3. **Deployable to Vercel**: Vite configuration builds directly to `/dist` and works out of the box with Vercel single-page application routing rules.
