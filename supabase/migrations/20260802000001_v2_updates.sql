-- Should I Go? Schema Migration V2 Updates

-- 1. Update Events Table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS normalized_source_url TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS is_manually_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Unique constraint: one normalized event per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_user_norm_url ON public.events (user_id, normalized_source_url);

-- 2. Update Recommendations Table
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS event_goal TEXT,
  ADD COLUMN IF NOT EXISTS bottom_line TEXT,
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Update Feedback Table
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS feedback_type TEXT,
  ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dismissal_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
