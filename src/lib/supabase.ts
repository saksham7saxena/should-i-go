// Supabase Client & Persistence API V3

import { createClient } from '@supabase/supabase-js';
import { UserPreferences, ExtractedEventData, ScoringResult, EventRecord, RecommendationRecord, FeedbackRecord } from '../types';
import { normalizeUrl } from './urlParser';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type AppEventStatus = 'considering' | 'going' | 'attended' | 'skipped' | 'dismissed';

// 1. Get or Create Anonymous Session
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
      if (error) console.warn('Supabase anonymous sign in error:', error);
    } catch (err) {
      console.warn('Anonymous auth failed:', err);
    }
  }
  let localId = localStorage.getItem('should_i_go_anon_user_id');
  if (!localId) {
    localId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem('should_i_go_anon_user_id', localId);
  }
  return localId;
}

// 2. Fetch User Preferences
export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching preferences:', error);
    } else if (data) {
      return {
        id: data.id,
        user_id: data.user_id,
        interests: data.interests || [],
        max_price: Number(data.max_price),
        preferred_days: data.preferred_days || [],
        preferred_times: data.preferred_times || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  }
  const local = localStorage.getItem('should_i_go_prefs');
  return local ? JSON.parse(local) : null;
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
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('preferences')
      .upsert(
        {
          user_id: userId,
          interests: record.interests,
          max_price: record.max_price,
          preferred_days: record.preferred_days,
          preferred_times: record.preferred_times,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save preferences: ${error.message}`);
    }
    return data as UserPreferences;
  }

  localStorage.setItem('should_i_go_prefs', JSON.stringify(record));
  return record;
}

// 4. Phase 1 Persistence API: Upsert Analysis History
export async function upsertAnalysis(
  eventData: ExtractedEventData,
  recommendationData: ScoringResult,
  userId: string
): Promise<{ eventId: string; recommendationId: string }> {
  const normUrl = normalizeUrl(eventData.sourceUrl);

  if (isSupabaseConfigured) {
    // Upsert Event by (user_id, normalized_source_url)
    const { data: dbEvent, error: eventError } = await supabase
      .from('events')
      .upsert(
        {
          user_id: userId,
          source_url: eventData.sourceUrl,
          normalized_source_url: normUrl,
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
          is_manually_edited: Boolean(eventData.isManuallyEdited),
          extraction_confidence: recommendationData.extractionConfidence,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,normalized_source_url' }
      )
      .select()
      .single();

    if (eventError || !dbEvent) {
      throw new Error(`Failed to upsert event: ${eventError?.message || 'Unknown database error'}`);
    }

    // Insert Recommendation
    const { data: dbRec, error: recError } = await supabase
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
        extraction_confidence: recommendationData.extractionConfidence,
        decision_confidence: recommendationData.decisionConfidence,
        scoring_breakdown: recommendationData.scoringBreakdown,
        event_goal: recommendationData.eventGoal,
        prompt_version: 'v3.0.0',
        status: null, // Analysis alone has NULL status (does not appear in Saved)
      })
      .select()
      .single();

    if (recError || !dbRec) {
      throw new Error(`Failed to save recommendation: ${recError?.message || 'Unknown database error'}`);
    }

    return { eventId: dbEvent.id, recommendationId: dbRec.id };
  }

  // Local storage fallback for local offline testing
  const eventId = crypto.randomUUID();
  const recommendationId = crypto.randomUUID();
  return { eventId, recommendationId };
}

// 5. Phase 1 Persistence API: Set Event & Recommendation Status
export async function setEventStatus(
  eventId: string,
  recommendationId: string | undefined,
  status: AppEventStatus,
  userId: string
): Promise<void> {
  if (isSupabaseConfigured) {
    // Update Event status
    const { error: eventError } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('user_id', userId);

    if (eventError) {
      throw new Error(`Failed to set event status: ${eventError.message}`);
    }

    if (recommendationId) {
      const { error: recError } = await supabase
        .from('recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', recommendationId)
        .eq('user_id', userId);

      if (recError) {
        throw new Error(`Failed to set recommendation status: ${recError.message}`);
      }
    }
  }
}

// 6. Fetch Saved Recommendations (Excludes null or dismissed)
export async function fetchSavedRecommendations(userId: string): Promise<RecommendationRecord[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*, event:events(*)')
      .eq('user_id', userId)
      .in('status', ['considering', 'going', 'attended', 'skipped'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved recommendations: ${error.message}`);
    }
    return (data || []) as RecommendationRecord[];
  }
  return [];
}

// 7. Phase 2 & 18: Record Post-Event / Dismissal Feedback
export async function recordFeedback(
  userId: string,
  recommendationId: string,
  feedback: {
    attended?: boolean;
    worth_it?: boolean;
    accuracy_rating?: number;
    notes?: string;
    dismissed?: boolean;
    dismissal_reason?: string;
  }
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        recommendation_id: recommendationId,
        attended: feedback.attended ?? null,
        worth_it: feedback.worth_it ?? null,
        accuracy_rating: feedback.accuracy_rating ?? null,
        notes: feedback.notes || null,
        feedback_type: feedback.dismissed ? 'dismissal' : 'post_event',
        dismissed: Boolean(feedback.dismissed),
        dismissal_reason: feedback.dismissal_reason || null,
      });

    if (error) {
      throw new Error(`Failed to record feedback: ${error.message}`);
    }
  }
}
