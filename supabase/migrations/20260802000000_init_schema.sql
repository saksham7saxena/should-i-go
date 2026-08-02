-- Should I Go? Supabase Migration File

-- 1. Preferences Table
CREATE TABLE IF NOT EXISTS public.preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    interests TEXT[] NOT NULL DEFAULT '{}',
    max_price NUMERIC NOT NULL DEFAULT 100,
    preferred_days TEXT[] NOT NULL DEFAULT '{}',
    preferred_times TEXT[] NOT NULL DEFAULT '{}',
    primary_goal TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one preference profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_preferences_user_id ON public.preferences (user_id);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    location TEXT,
    price NUMERIC,
    event_type TEXT,
    topics TEXT[] DEFAULT '{}',
    likely_audience TEXT[] DEFAULT '{}',
    speakers_or_performers TEXT[] DEFAULT '{}',
    extracted_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent same user from saving same source URL twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_user_url ON public.events (user_id, source_url);

-- 3. Recommendations Table
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    decision TEXT NOT NULL CHECK (decision IN ('Go', 'Maybe', 'Skip')),
    reasons TEXT[] DEFAULT '{}',
    concerns TEXT[] DEFAULT '{}',
    confidence TEXT NOT NULL DEFAULT 'High',
    scoring_breakdown JSONB NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1.0.0',
    status TEXT NOT NULL DEFAULT 'Considering' CHECK (status IN ('Considering', 'Attending', 'Skipped', 'Attended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
    attended BOOLEAN,
    worth_it BOOLEAN,
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. API Logs Table
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_id UUID,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    error_message TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: auth.uid() = user_id

-- Preferences
CREATE POLICY "Users can view own preferences" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON public.preferences FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- Recommendations
CREATE POLICY "Users can view own recommendations" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recommendations" ON public.recommendations FOR DELETE USING (auth.uid() = user_id);

-- Feedback
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.feedback FOR DELETE USING (auth.uid() = user_id);

-- API Logs
CREATE POLICY "Users can view own api_logs" ON public.api_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_logs" ON public.api_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
