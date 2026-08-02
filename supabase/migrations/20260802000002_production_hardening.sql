-- Production Hardening Migration V3 for Should I Go?

BEGIN;

-- 1. Preferences Table Updates
ALTER TABLE public.preferences
  ALTER COLUMN primary_goal DROP NOT NULL;

-- 2. Events Table Updates
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS normalized_source_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS is_manually_edited BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.events
SET normalized_source_url = lower(regexp_replace(split_part(source_url, '?', 1), '/$', ''))
WHERE normalized_source_url IS NULL;

ALTER TABLE public.events
  ALTER COLUMN normalized_source_url SET NOT NULL;

DROP INDEX IF EXISTS public.idx_events_user_url;
DROP INDEX IF EXISTS public.idx_events_user_norm_url;

CREATE UNIQUE INDEX IF NOT EXISTS events_user_normalized_url_uidx
  ON public.events(user_id, normalized_source_url);

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (
    status IS NULL OR status IN (
      'considering',
      'going',
      'attended',
      'skipped',
      'dismissed'
    )
  );

ALTER TABLE public.events
  ADD CONSTRAINT events_id_user_unique UNIQUE(id, user_id);

-- 3. Recommendations Table Updates
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS bottom_line TEXT,
  ADD COLUMN IF NOT EXISTS event_goal TEXT,
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS decision_confidence NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_event_id_fkey;

ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_event_owner_fkey;

ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_event_owner_fkey
  FOREIGN KEY(event_id, user_id)
  REFERENCES public.events(id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_id_user_unique UNIQUE(id, user_id);

-- 4. Feedback Table Updates
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS feedback_type TEXT,
  ADD COLUMN IF NOT EXISTS dismissed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dismissal_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS feedback_recommendation_id_fkey;

ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS feedback_recommendation_owner_fkey;

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_recommendation_owner_fkey
  FOREIGN KEY(recommendation_id, user_id)
  REFERENCES public.recommendations(id, user_id)
  ON DELETE CASCADE;

-- 5. Enable RLS and Strict Composite Policies
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferences_owner_all" ON public.preferences;
CREATE POLICY "preferences_owner_all" ON public.preferences
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "events_owner_all" ON public.events;
CREATE POLICY "events_owner_all" ON public.events
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "recommendations_owner_all" ON public.recommendations;
CREATE POLICY "recommendations_owner_all" ON public.recommendations
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "feedback_owner_all" ON public.feedback;
CREATE POLICY "feedback_owner_all" ON public.feedback
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "api_logs_owner_all" ON public.api_logs;
CREATE POLICY "api_logs_owner_all" ON public.api_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
