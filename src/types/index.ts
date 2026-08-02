// Core Type Definitions for Should I Go? V2

export type InterestType =
  | 'AI'
  | 'Startups'
  | 'Design'
  | 'Technology'
  | 'Film'
  | 'Music'
  | 'Outdoors'
  | 'Networking'
  | 'Food'
  | 'Sports';

export type PrimaryGoalType =
  | 'Learn something'
  | 'Meet people'
  | 'Have fun'
  | 'Try something new';

export type PreferredDayType = 'Weekday' | 'Weekend';
export type PreferredTimeType = 'Morning' | 'Afternoon' | 'Evening';

export type DecisionType = 'Go' | 'Maybe' | 'Skip';
export type EventStatusType = 'Considering' | 'Attending' | 'Skipped' | 'Attended';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  interests: InterestType[];
  max_price: number;
  preferred_days?: PreferredDayType[];
  preferred_times?: PreferredTimeType[];
  primary_goal?: PrimaryGoalType;
  created_at?: string;
  updated_at?: string;
}

export interface ExtractedEventData {
  title: string;
  description: string;
  startDate: string | null;
  location: string | null;
  price: number | null;
  eventType: string;
  topics: string[];
  likelyAudience: string[];
  speakersOrPerformers: string[];
  sourceUrl: string;
  normalizedSourceUrl?: string;
  missingInformation: string[];
  isOnline?: boolean;
  extractionConfidence?: number; // 0.0 to 1.0
  isManuallyEdited?: boolean;
}

export interface ScoreBreakdown {
  interestMatchScore: number; // Max 35
  goalMatchScore: number;     // Max 25
  priceFitScore: number;      // Max 20
  timingFitScore: number;     // Max 10
  noveltyScore: number;       // Max 10
  totalScore: number;         // Max 100
}

export interface ScoringResult {
  score: number;
  decision: DecisionType;
  bottomLine: string;
  reasons: string[];
  concerns: string[];
  confidence: 'High' | 'Medium' | 'Low';
  scoringBreakdown: ScoreBreakdown;
  strongestReason: string;
  eventGoal: PrimaryGoalType;
}

export interface EventRecord {
  id: string;
  user_id: string;
  source_url: string;
  normalized_source_url?: string;
  title: string;
  description: string | null;
  start_date: string | null;
  location: string | null;
  price: number | null;
  event_type: string | null;
  topics: string[];
  likely_audience: string[];
  speakers_or_performers: string[];
  extracted_data: ExtractedEventData;
  is_manually_edited?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RecommendationRecord {
  id: string;
  user_id: string;
  event_id: string;
  score: number;
  decision: DecisionType;
  bottom_line?: string;
  reasons: string[];
  concerns: string[];
  confidence: 'High' | 'Medium' | 'Low';
  scoring_breakdown: ScoreBreakdown;
  event_goal?: PrimaryGoalType;
  prompt_version: string;
  status: EventStatusType;
  source_type?: 'url' | 'manual';
  created_at: string;
  updated_at?: string;
  event?: EventRecord;
}

export interface FeedbackRecord {
  id?: string;
  user_id?: string;
  recommendation_id: string;
  attended?: boolean;
  worth_it?: boolean;
  accuracy_rating?: number; // 1-5
  notes?: string;
  feedback_type?: 'post_event' | 'dismissal' | 'rating';
  dismissed?: boolean;
  dismissal_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvalTestItem {
  id: string;
  name: string;
  url: string;
  expected: {
    title: string;
    startDate: string | null;
    price: number | null;
    location: string | null;
    eventType: string;
    topics: string[];
  };
  mockHtml?: string;
}

export interface EvalRunResult {
  itemId: string;
  name: string;
  status: 'SUCCESS' | 'FAILURE';
  latencyMs: number;
  estimatedTokens?: number;
  extracted: ExtractedEventData | null;
  fieldMatches: {
    title: boolean;
    startDate: boolean;
    price: boolean;
    location: boolean;
    eventType: boolean;
  };
  missingFieldRate: number; // percentage
  errorMessage?: string;
}
