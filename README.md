# Should I Go? — Production Event Decision Tool V3

A structured decision assistant for evaluating public event links against your personal budget, schedule, and goals.

---

## 🚀 Architecture & Security

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (ElevenLabs Design System).
- **Backend & Auth**: Supabase PostgreSQL Database with Row Level Security (RLS) policies using `(select auth.uid()) = user_id` for authenticated anonymous user sessions.
- **Fact Extraction**: Supabase Edge Function (`analyze-event`) with server-side SSRF protection, rate limiting, and Zod output validation.
- **Scoring Engine**: Pure deterministic TypeScript logic with Vitest unit tests. Zero client-side AI key exposure.

---

## 🔒 Server-Side Edge Function Secrets

Configure the following secrets in Supabase Dashboard (`Edge Functions -> Secrets`):

- `GEMINI_API_KEY`: Google Gemini API Key.
- `GEMINI_MODEL`: `gemini-1.5-flash`.
- `ALLOWED_ORIGINS`: Production Vercel domain and localhost development URLs.

---

## 🛠️ Verification & Scripts

```bash
# Install dependencies
npm ci

# Typecheck
npm run typecheck

# Unit tests
npm test -- --run

# Production Build
npm run build
```
