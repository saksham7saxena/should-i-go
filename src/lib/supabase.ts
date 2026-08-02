// Supabase Client and Anonymous Authentication Helper

import { createClient } from '@supabase/supabase-js';
import { UserPreferences, EventRecord, RecommendationRecord, FeedbackRecord } from '../types';

// Fallback environment variable keys
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_USER_KEY = 'should_i_go_anon_user_id';
const LOCAL_STORAGE_PREFS_KEY = 'should_i_go_user_prefs';
const LOCAL_STORAGE_EVENTS_KEY = 'should_i_go_saved_events';
const LOCAL_STORAGE_RECS_KEY = 'should_i_go_recommendations';
const LOCAL_STORAGE_FEEDBACK_KEY = 'should_i_go_feedback';

// 1. Get or Create Anonymous Auth Session
export async function getOrCreateAnonymousUser(): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return session.user.id;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data?.user) {
        return data.user.id;
      }
    } catch (err) {
      console.warn('Supabase anonymous auth failed, falling back to persistent client storage:', err);
    }
  }

  // Local Storage Fallback
  let localUserId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!localUserId) {
    localUserId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, localUserId);
  }
  return localUserId;
}

// 2. Fetch User Preferences
export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          user_id: data.user_id,
          interests: data.interests || [],
          max_price: Number(data.max_price),
          preferred_days: data.preferred_days || [],
          preferred_times: data.preferred_times || [],
          primary_goal: data.primary_goal,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Error fetching preferences from Supabase:', err);
    }
  }

  // Fallback
  const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  return null;
}

// 3. Save User Preferences
export async function saveUserPreferences(userId: string, prefs: Omit<UserPreferences, 'id' | 'user_id'>): Promise<UserPreferences> {
  const record: UserPreferences = {
    ...prefs,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('preferences')
        .upsert({
          user_id: userId,
          interests: prefs.interests,
          max_price: prefs.max_price,
          preferred_days: prefs.preferred_days,
          preferred_times: prefs.preferred_times,
          primary_goal: prefs.primary_goal,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(data));
        return data as UserPreferences;
      }
    } catch (err) {
      console.warn('Error saving preferences to Supabase:', err);
    }
  }

  // Fallback
  localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(record));
  return record;
}

// 4. Save Event & Recommendation (Prevents duplicate source_url)
export async function saveEventAndRecommendation(
  userId: string,
  eventData: any,
  recommendationData: any
): Promise<{ event: EventRecord; recommendation: RecommendationRecord }> {
  // Check local duplicate check
  const savedEvents: EventRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY) || '[]');
  const existing = savedEvents.find((e) => e.user_id === userId && e.source_url === eventData.sourceUrl);
  if (existing) {
    const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
    const existingRec = savedRecs.find((r) => r.event_id === existing.id);
    if (existingRec) {
      return { event: existing, recommendation: existingRec };
    }
  }

  const eventId = crypto.randomUUID();
  const recId = crypto.randomUUID();

  const eventRecord: EventRecord = {
    id: eventId,
    user_id: userId,
    source_url: eventData.sourceUrl,
    title: eventData.title,
    description: eventData.description,
    start_date: eventData.startDate,
    location: eventData.location,
    price: eventData.price,
    event_type: eventData.eventType,
    topics: eventData.topics || [],
    likely_audience: eventData.likelyAudience || [],
    speakers_or_performers: eventData.speakersOrPerformers || [],
    extracted_data: eventData,
    created_at: new Date().toISOString(),
  };

  const recommendationRecord: RecommendationRecord = {
    id: recId,
    user_id: userId,
    event_id: eventId,
    score: recommendationData.score,
    decision: recommendationData.decision,
    reasons: recommendationData.reasons,
    concerns: recommendationData.concerns,
    confidence: recommendationData.confidence,
    scoring_breakdown: recommendationData.scoringBreakdown,
    prompt_version: 'v1.0.0',
    status: 'Considering',
    created_at: new Date().toISOString(),
    event: eventRecord,
  };

  if (isSupabaseConfigured) {
    try {
      // Upsert event
      const { data: dbEvent, error: eventErr } = await supabase
        .from('events')
        .upsert({
          user_id: userId,
          source_url: eventData.sourceUrl,
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.startDate,
          location: eventData.location,
          price: eventData.price,
          event_type: eventData.eventType,
          topics: eventData.topics,
          likely_audience: eventData.likelyAudience,
          speakers_or_performers: eventData.speakersOrPerformers,
          extracted_data: eventData,
        }, { onConflict: 'user_id,source_url' })
        .select()
        .single();

      if (!eventErr && dbEvent) {
        const { data: dbRec, error: recErr } = await supabase
          .from('recommendations')
          .insert({
            user_id: userId,
            event_id: dbEvent.id,
            score: recommendationData.score,
            decision: recommendationData.decision,
            reasons: recommendationData.reasons,
            concerns: recommendationData.concerns,
            confidence: recommendationData.confidence,
            scoring_breakdown: recommendationData.scoringBreakdown,
            prompt_version: 'v1.0.0',
            status: 'Considering',
          })
          .select()
          .single();

        if (!recErr && dbRec) {
          const resEvent = dbEvent as EventRecord;
          const resRec = { ...dbRec, event: resEvent } as RecommendationRecord;
          return { event: resEvent, recommendation: resRec };
        }
      }
    } catch (err) {
      console.warn('Error saving to Supabase:', err);
    }
  }

  // Local storage fallback
  savedEvents.push(eventRecord);
  localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(savedEvents));

  const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
  savedRecs.push(recommendationRecord);
  localStorage.setItem(LOCAL_STORAGE_RECS_KEY, JSON.stringify(savedRecs));

  return { event: eventRecord, recommendation: recommendationRecord };
}

// 5. Fetch All Saved Recommendations for User
export async function fetchSavedRecommendations(userId: string): Promise<RecommendationRecord[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*, event:events(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as RecommendationRecord[];
      }
    } catch (err) {
      console.warn('Error fetching recommendations from Supabase:', err);
    }
  }

  // Fallback
  const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
  return savedRecs.filter((r) => r.user_id === userId);
}

// 6. Update Recommendation Status
export async function updateRecommendationStatus(recId: string, status: RecommendationRecord['status']): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ status })
        .eq('id', recId);
      if (!error) return true;
    } catch (err) {
      console.warn('Error updating status in Supabase:', err);
    }
  }

  const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
  const idx = savedRecs.findIndex((r) => r.id === recId);
  if (idx !== -1) {
    savedRecs[idx].status = status;
    localStorage.setItem(LOCAL_STORAGE_RECS_KEY, JSON.stringify(savedRecs));
    return true;
  }
  return false;
}

// 7. Submit Feedback
export async function submitFeedback(userId: string, recId: string, feedback: Omit<FeedbackRecord, 'id' | 'user_id' | 'recommendation_id'>): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: userId,
          recommendation_id: recId,
          attended: feedback.attended,
          worth_it: feedback.worth_it,
          accuracy_rating: feedback.accuracy_rating,
          notes: feedback.notes,
        });
      if (!error) return true;
    } catch (err) {
      console.warn('Error saving feedback to Supabase:', err);
    }
  }

  const savedFeedback: FeedbackRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY) || '[]');
  savedFeedback.push({
    id: crypto.randomUUID(),
    user_id: userId,
    recommendation_id: recId,
    ...feedback,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(savedFeedback));
  return true;
}
