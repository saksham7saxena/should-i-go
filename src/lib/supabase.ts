// Supabase Client and Anonymous Auth Helper V2

import { createClient } from '@supabase/supabase-js';
import { UserPreferences, EventRecord, RecommendationRecord, FeedbackRecord } from '../types';
import { normalizeUrl } from './gemini';

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

  const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  return null;
}

// 3. Save User Preferences
export async function saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const existing = await fetchUserPreferences(userId);
  const record: UserPreferences = {
    user_id: userId,
    interests: prefs.interests || existing?.interests || ['AI', 'Technology'],
    max_price: prefs.max_price ?? existing?.max_price ?? 100,
    preferred_days: prefs.preferred_days || existing?.preferred_days || [],
    preferred_times: prefs.preferred_times || existing?.preferred_times || [],
    primary_goal: prefs.primary_goal || existing?.primary_goal,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('preferences')
        .upsert({
          user_id: userId,
          interests: record.interests,
          max_price: record.max_price,
          preferred_days: record.preferred_days,
          preferred_times: record.preferred_times,
          primary_goal: record.primary_goal,
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

  localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(record));
  return record;
}

// 4. Save Event & Recommendation ONLY when user explicitly chooses 'Save for later' or 'I’m going'
export async function saveEventRecommendationExplicit(
  userId: string,
  eventData: any,
  recommendationData: any,
  status: 'Considering' | 'Attending' = 'Considering'
): Promise<{ event: EventRecord; recommendation: RecommendationRecord }> {
  const normUrl = normalizeUrl(eventData.sourceUrl || eventData.source_url || '');

  const savedEvents: EventRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY) || '[]');
  const existingEventIdx = savedEvents.findIndex(
    (e) => e.user_id === userId && normalizeUrl(e.source_url) === normUrl
  );

  let eventId = existingEventIdx !== -1 ? savedEvents[existingEventIdx].id : crypto.randomUUID();
  let recId = crypto.randomUUID();

  const eventRecord: EventRecord = {
    id: eventId,
    user_id: userId,
    source_url: eventData.sourceUrl || eventData.source_url,
    normalized_source_url: normUrl,
    title: eventData.title,
    description: eventData.description,
    start_date: eventData.startDate || eventData.start_date,
    location: eventData.location,
    price: eventData.price,
    event_type: eventData.eventType || eventData.event_type,
    topics: eventData.topics || [],
    likely_audience: eventData.likelyAudience || eventData.likely_audience || [],
    speakers_or_performers: eventData.speakersOrPerformers || eventData.speakers_or_performers || [],
    extracted_data: eventData,
    is_manually_edited: Boolean(eventData.isManuallyEdited),
    created_at: new Date().toISOString(),
  };

  const recommendationRecord: RecommendationRecord = {
    id: recId,
    user_id: userId,
    event_id: eventId,
    score: recommendationData.score,
    decision: recommendationData.decision,
    bottom_line: recommendationData.bottomLine,
    reasons: recommendationData.reasons,
    concerns: recommendationData.concerns,
    confidence: recommendationData.confidence,
    scoring_breakdown: recommendationData.scoringBreakdown || recommendationData.scoring_breakdown,
    event_goal: recommendationData.eventGoal,
    prompt_version: 'v2.0.0',
    status,
    created_at: new Date().toISOString(),
    event: eventRecord,
  };

  if (isSupabaseConfigured) {
    try {
      const { data: dbEvent } = await supabase
        .from('events')
        .upsert({
          user_id: userId,
          source_url: eventRecord.source_url,
          normalized_source_url: normUrl,
          title: eventRecord.title,
          description: eventRecord.description,
          start_date: eventRecord.start_date,
          location: eventRecord.location,
          price: eventRecord.price,
          event_type: eventRecord.event_type,
          topics: eventRecord.topics,
          likely_audience: eventRecord.likely_audience,
          speakers_or_performers: eventRecord.speakers_or_performers,
          extracted_data: eventData,
          is_manually_edited: eventRecord.is_manually_edited,
        }, { onConflict: 'user_id,normalized_source_url' })
        .select()
        .single();

      if (dbEvent) {
        const { data: dbRec } = await supabase
          .from('recommendations')
          .insert({
            user_id: userId,
            event_id: dbEvent.id,
            score: recommendationData.score,
            decision: recommendationData.decision,
            bottom_line: recommendationData.bottomLine,
            reasons: recommendationData.reasons,
            concerns: recommendationData.concerns,
            confidence: recommendationData.confidence,
            scoring_breakdown: recommendationData.scoringBreakdown || recommendationData.scoring_breakdown,
            event_goal: recommendationData.eventGoal,
            prompt_version: 'v2.0.0',
            status,
          })
          .select()
          .single();

        if (dbRec) {
          const resEvent = dbEvent as EventRecord;
          const resRec = { ...dbRec, event: resEvent } as RecommendationRecord;
          return { event: resEvent, recommendation: resRec };
        }
      }
    } catch (err) {
      console.warn('Error saving explicitly to Supabase:', err);
    }
  }

  // Local storage fallback
  if (existingEventIdx !== -1) {
    savedEvents[existingEventIdx] = eventRecord;
  } else {
    savedEvents.push(eventRecord);
  }
  localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(savedEvents));

  const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
  savedRecs.push(recommendationRecord);
  localStorage.setItem(LOCAL_STORAGE_RECS_KEY, JSON.stringify(savedRecs));

  return { event: eventRecord, recommendation: recommendationRecord };
}

// 5. Dismiss / "Not for me" Feedback logger
export async function logNotForMeFeedback(userId: string, eventData: any, recommendationData: any): Promise<void> {
  const normUrl = normalizeUrl(eventData.sourceUrl || '');
  if (isSupabaseConfigured) {
    try {
      await supabase.from('feedback').insert({
        user_id: userId,
        recommendation_id: crypto.randomUUID(),
        dismissed: true,
        dismissal_reason: 'Not for me',
        notes: `Dismissed recommendation for ${eventData.title} (${normUrl})`,
      });
      return;
    } catch (_) {}
  }

  const savedFeedback: FeedbackRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY) || '[]');
  savedFeedback.push({
    id: crypto.randomUUID(),
    user_id: userId,
    recommendation_id: crypto.randomUUID(),
    dismissed: true,
    dismissal_reason: 'Not for me',
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(savedFeedback));
}

// 6. Fetch All Saved Recommendations for User
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

  const savedRecs: RecommendationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECS_KEY) || '[]');
  return savedRecs.filter((r) => r.user_id === userId);
}

// 7. Update Recommendation Status
export async function updateRecommendationStatus(recId: string, status: RecommendationRecord['status']): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ status, updated_at: new Date().toISOString() })
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

// 8. Submit Feedback
export async function submitFeedback(userId: string, recId: string, feedback: Partial<FeedbackRecord>): Promise<boolean> {
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
          feedback_type: feedback.feedback_type || 'post_event',
          dismissed: feedback.dismissed || false,
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
