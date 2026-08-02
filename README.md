# Should I Go? — Product Requirements & Technical System Design

[![CI](https://github.com/saksham7saxena/should-i-go/actions/workflows/ci.yml/badge.svg)](https://github.com/saksham7saxena/should-i-go/actions/workflows/ci.yml)
[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?style=flat&logo=vercel)](https://should-i-go-for-that.vercel.app/)

**Should I Go?** is a structured, deterministic decision assistant for evaluating public event links against personal interests, ticket budget ceilings, schedule preferences, and event-specific goals.

Unlike generic conversational chatbots, **Should I Go?** uses a **two-tier architecture**: an AI-powered factual metadata extractor (running securely on serverless Edge Functions) coupled with a transparent, fully deterministic TypeScript recommendation engine.

---

## 📄 Product Requirements Document (PRD)

### 1. Product Vision & Value Proposition
- **Objective**: Eliminate event FOMO and ticket regret by providing a transparent, unbiased recommendation: **GO**, **MAYBE**, or **SKIP**.
- **Target Experience**: Fast (~20-second onboarding), trustworthy, zero-jargon consumer experience that respects user privacy and never hallucinates fake event details.

### 2. User Personas & Real-World Use Cases

#### 👨‍💻 Persona A: Alex (Tech Founder & Builder)
- **Goal**: Evaluate technical conferences and founder mixers for networking ROI.
- **Scenario**: Receives a link for a $299 AI Summit. Uses **Should I Go?** to check if the speaker line-up, startup focus, and price fit his profile.
- **Result**: Sees a **GO — 84/100** recommendation with a bottom line: *"Matches your AI & Startup interests and your goal of meeting people."*

#### 🎨 Persona B: Maya (Product Designer)
- **Goal**: Upskill through weekend workshops without exceeding her $100 monthly event budget.
- **Scenario**: Pastes a link for a $150 UX Design intensive. 
- **Result**: Sees a **MAYBE — 49/100** recommendation with a hard budget warning: *"Ticket price ($150) exceeds your max budget ceiling of $100."*

#### 🎵 Persona C: Jordan (Social & Music Enthusiast)
- **Goal**: Discover local concerts and outdoor festivals.
- **Scenario**: Pastes a local festival link, selects "Have fun" as his event goal.
- **Result**: Receives an instant score breakdown and chooses `[Save for later]` to track it in his library.

---

### 3. Core Product Flow

```text
Paste Event URL (or Manual Details)
  │
  ├──► Check Onboarding Status?
  │      └── If incomplete: Preserve URL in Session Storage ➔ 2-Step Onboarding ➔ Auto-Resume Analysis
  │
  ├──► Step 1: Fact Extraction (Supabase Edge Function + Gemini 3.6 Flash)
  │      └── SSRF protection, fail-closed HTML fetching, Zod output validation
  │
  ├──► Step 2: "Does this look right?" Review Screen
  │      └── Highlight unlisted/missing fields ➔ User confirms or edits details
  │
  ├──► Step 3: Event-Specific Goal Selection
  │      └── "What are you hoping to get from this event?" (Learn, Meet people, Have fun, Try something new)
  │
  ├──► Step 4: Deterministic Recommendation Display
  │      └── Large GO / MAYBE / SKIP badge + Score & Decision Confidence
  │      └── 1-Sentence Bottom Line + 3 Supporting Factors + Watch-Out Concern
  │      └── Collapsed "Why this score ▾" breakdown
  │
  └──► Step 5: User Actions & Post-Event Feedback
         └── [Save for later] | [I'm going] | [Not for me]
         └── Inline post-event feedback ("Was this event worth going to?")
```

---

## 🏗️ Technical System Architecture & System Design

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REACT FRONTEND (VITE)                            │
│    Landing Page ──► Onboarding ──► Review ──► Goal Choice ──► Result        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Session JWT + Request ID
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTION                              │
│                      (supabase/functions/analyze-event)                     │
│  • JWT Session Authentication (`supabase.auth.getUser()`)                   │
│  • SSRF Protection (Blocks localhost, loopback, private IPv4/IPv6)          │
│  • Manual Redirect Validation (Max 3) & HTML Content Sanitization            │
│  • Per-User Rate Limiting (10 req/hr, min 5s interval ➔ 429)                │
│  • Gemini 3.6 Flash JSON Fact Extraction                                    │
│  • Zod Output Validation                                                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Extracted Fact Payload
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DETERMINISTIC TYPESCRIPT ENGINE                          │
│                     (src/lib/scoring.ts + Vitest)                           │
│  Interest Match (35pts) + Goal (25pts) + Price (20pts) + Timing (10pts)      │
│  + Novelty (10pts) ➔ Hard Budget Cap (Max 49 if price > budget)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Persists Explicitly
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRESQL DATABASE                           │
│  • preferences (user_id, interests, max_price)                              │
│  • events (user_id, normalized_source_url, title, status)                  │
│  • recommendations (user_id, event_id, score, decision, bottom_line)        │
│  • feedback (user_id, recommendation_id, worth_it, accuracy_rating)         │
│  • RLS Policies: USING ((select auth.uid()) = user_id) WITH CHECK (...)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Technical Decisions & Architecture Tradeoffs

| Component / Feature | Decision Made | Rationale & Advantage | Alternative Considered |
|---|---|---|---|
| **Scoring Algorithm** | **Pure Deterministic TypeScript Engine** | Transparent, predictable, 100% testable via Vitest. Eliminates AI scoring bias and hallucinations. | LLM-generated score (Unpredictable, un-testable, hallucination-prone). |
| **API Key Security** | **Supabase Edge Function Proxy** | Kept `GEMINI_API_KEY` hidden on serverless backend. Enforces user authentication and SSRF protection. | Client-side SDK (Exposes private API keys in browser JavaScript bundle). |
| **Data Privacy** | **Row Level Security (RLS)** | Database-level policy (`(select auth.uid()) = user_id`) guarantees multi-tenant data isolation. | Custom middleware checks (Prone to logic bugs and authorization bypasses). |
| **Extraction Strategy** | **Fail-Closed Architecture** | If web page fetch fails or is blocked, Gemini is NOT called. Presents an interactive manual entry form instead. | Fabricating synthetic mock details (Misleads users with fake prices or dates). |
| **Design Language** | **ElevenLabs Design Tokens** | Off-white light canvas (`#f5f5f5`), warm near-black ink (`#0c0a09`), serif display typography, pill geometry. | Default Tailwind templates or generic dark mode themes. |

---

## 🗄️ Database Schema & RLS Policies

Defined in [`supabase/migrations/20260802000002_production_hardening.sql`](supabase/migrations/20260802000002_production_hardening.sql):

```sql
-- Composite Unique & Foreign Key Constraints:
ALTER TABLE public.events ADD CONSTRAINT events_id_user_unique UNIQUE(id, user_id);
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_event_owner_fkey 
  FOREIGN KEY(event_id, user_id) REFERENCES public.events(id, user_id) ON DELETE CASCADE;

-- Strict Composite RLS Policies:
CREATE POLICY "events_owner_all" ON public.events
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

---

## 🛠️ Verification & Test Suite

### 1. Vitest Unit Test Suite (`src/lib/scoring.test.ts`)
```bash
$ npm test -- --run

 ✓ src/lib/scoring.test.ts (10 tests) 18ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
```
- ✅ Unknown price ➔ 0 price points (Never claims "within budget").
- ✅ Unknown date ➔ 0 timing points.
- ✅ Hard budget violation ➔ Score capped at max 49 (Cannot receive `GO`).
- ✅ Event-specific goal evaluation.
- ✅ Zero filler claims or unfounded statements.

### 2. Verification Commands
```bash
npm ci              # Clean reproducible installation
npm run typecheck   # TypeScript compiler check (0 errors)
npm test -- --run   # Vitest unit test execution
npm run build       # Vite production bundle build
```

---

## ⚙️ Environment Variables & Secrets Setup

### Client Environment Variables (`.env`)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Server-Side Edge Function Secrets (Supabase Dashboard)
- `GEMINI_API_KEY`: Your Google Gemini API Key
- `GEMINI_MODEL`: `gemini-3.6-flash`
- `ALLOWED_ORIGINS`: `https://should-i-go-for-that.vercel.app,http://localhost:5173`

---

## 📜 License & Copyright
© {new Date().getFullYear()} **Should I Go?** • Open source under the MIT License.
