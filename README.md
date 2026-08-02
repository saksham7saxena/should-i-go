# Should I Go? — Event Decision Assistant

[![CI](https://github.com/saksham7saxena/should-i-go/actions/workflows/ci.yml/badge.svg)](https://github.com/saksham7saxena/should-i-go/actions/workflows/ci.yml)
[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?style=flat&logo=vercel)](https://should-i-go-for-that.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Should I Go?** is a personal event decision tool that evaluates public event links against your budget, schedule preferences, and goals to provide a clear recommendation: **GO**, **MAYBE**, or **SKIP**.

---

## ✨ Features

- **Structured Recommendations**: Receive a 0–100 suitability score, a one-sentence bottom line, key supporting factors, and watch-out concerns.
- **Fact-Based Extraction**: AI extracts verified event details (title, dates, venue, pricing) without fabricating unlisted facts.
- **Deterministic Logic**: Transparent scoring rules across interest alignment, ticket budget limits, timing, and per-event goals.
- **Fast Onboarding**: Set up your interests and budget ceiling in under 20 seconds.
- **Privacy & Security**: Anonymous authentication backed by PostgreSQL Row Level Security (RLS).
- **Saved Library & Feedback**: Save upcoming events and record lightweight post-event feedback.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (ElevenLabs Design System)
- **Backend & Database**: Supabase (PostgreSQL, Anonymous Auth, Row Level Security, Edge Functions)
- **AI Integration**: Google Gemini API via server-side Edge Functions
- **Testing**: Vitest unit test suite

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/saksham7saxena/should-i-go.git
cd should-i-go
```

### 2. Install dependencies
```bash
npm ci
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your public Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🧪 Testing & Verification

```bash
# TypeScript compiler check
npm run typecheck

# Run Vitest unit tests
npm test -- --run

# Production build
npm run build
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
