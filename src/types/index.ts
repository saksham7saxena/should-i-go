// Complete Type Definitions for Should I Go? V3

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
export type AppEventStatus = 'considering' | 'going' | 'attended' | 'skipped' | 'dismissed';

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
  description: string | null;
  startDate: string | null;
  location: string | null;
  price: number | null;
  currency?: string | null;
  eventType: string | null;
  topics: string[];
  likelyAudience: string[];
  speakersOrPerformers: string[];
  sourceUrl: string;
  normalizedSourceUrl?: string;
  missingInformation: string[];
  isOnline?: boolean | null;
  extractionConfidence?: number;
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
  extractionConfidence: number;
  decisionConfidence: number;
  scoringBreakdown: ScoreBreakdown;
  strongestReason: string;
  eventGoal: PrimaryGoalType;
}

export interface EventRecord {
  id: string;
  user_id: string;
  source_url: string;
  normalized_source_url: string;
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
  is_manually_edited: boolean;
  status: AppEventStatus | null;
  extraction_status: string;
  extraction_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface RecommendationRecord {
  id: string;
  user_id: string;
  event_id: string;
  score: number;
  decision: DecisionType;
  bottom_line: string;
  reasons: string[];
  concerns: string[];
  confidence: 'High' | 'Medium' | 'Low';
  extraction_confidence: number;
  decision_confidence: number;
  scoring_breakdown: ScoreBreakdown;
  event_goal: PrimaryGoalType;
  prompt_version: string;
  status: AppEventStatus | null;
  created_at: string;
  updated_at: string;
  event?: EventRecord;
}

export interface FeedbackRecord {
  id?: string;
  user_id?: string;
  recommendation_id: string;
  attended?: boolean | null;
  worth_it?: boolean | null;
  accuracy_rating?: number | null;
  notes?: string | null;
  feedback_type?: 'post_event' | 'dismissal' | 'rating';
  dismissed?: boolean;
  dismissal_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ExtractionErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'PRIVATE_NETWORK_URL'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'TOO_MANY_REDIRECTS'
  | 'RESPONSE_TOO_LARGE'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'MODEL_TIMEOUT'
  | 'INVALID_MODEL_OUTPUT'
  | 'RATE_LIMITED'
  | 'UNAUTHENTICATED';

export type AnalysisStage =
  | { type: 'idle' }
  | { type: 'extracting'; url: string }
  | { type: 'manual-entry'; url: string; reason: ExtractionErrorCode }
  | { type: 'reviewing'; draft: ExtractedEventData }
  | { type: 'choosing-goal'; event: ExtractedEventData }
  | {
      type: 'result';
      event: ExtractedEventData;
      recommendation: ScoringResult;
      eventId?: string;
      recommendationId?: string;
    }
  | {
      type: 'error';
      message: string;
      requestId?: string;
    };

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
  missingFieldRate: number;
  errorMessage?: string;
}
