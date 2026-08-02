// Gemini Event Fact Extraction Client V3 (Fail-Closed, Zod Validated)

import { z } from 'zod';
import { ExtractedEventData } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { normalizeUrl } from './urlParser';

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

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  requestId?: string;
}

const extractedEventSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  startDate: z.string().nullable(),
  location: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable().optional(),
  eventType: z.string().nullable(),
  topics: z.array(z.string()),
  likelyAudience: z.array(z.string()),
  speakersOrPerformers: z.array(z.string()),
  isOnline: z.boolean().nullable(),
  sourceUrl: z.string(),
  missingInformation: z.array(z.string()),
  extractionConfidence: z.number().optional(),
});

export async function extractEventFromUrl(url: string): Promise<{
  data: ExtractedEventData;
  requestId: string;
  latencyMs: number;
}> {
  const startTime = Date.now();
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;

  if (!isSupabaseConfigured) {
    throw {
      code: 'FETCH_FAILED',
      message: 'Supabase client is not configured.',
      requestId,
    } as ExtractionError;
  }

  // Phase 3: Invoke Edge Function using active session JWT
  const { data, error } = await supabase.functions.invoke('analyze-event', {
    body: { url },
    headers: {
      'x-request-id': requestId,
    },
  });

  if (error) {
    let errorCode: ExtractionErrorCode = 'FETCH_FAILED';
    if (error.status === 401) errorCode = 'UNAUTHENTICATED';
    else if (error.status === 429) errorCode = 'RATE_LIMITED';

    throw {
      code: errorCode,
      message: error.message || 'We could not read this event page.',
      requestId,
    } as ExtractionError;
  }

  if (data?.error) {
    throw {
      code: data.error.code || 'FETCH_FAILED',
      message: data.error.message || 'We could not read this event page.',
      requestId: data.requestId || requestId,
    } as ExtractionError;
  }

  // Phase 6: Validate output with Zod
  const parseResult = extractedEventSchema.safeParse(data?.data);
  if (!parseResult.success) {
    throw {
      code: 'INVALID_MODEL_OUTPUT',
      message: 'Failed to validate structured event facts. Try manual entry.',
      requestId,
    } as ExtractionError;
  }

  const raw = parseResult.data;
  const normalizedUrlStr = normalizeUrl(raw.sourceUrl || url);

  const criticalFields = [
    Boolean(raw.title),
    Boolean(raw.startDate),
    raw.price !== null,
    Boolean(raw.location || raw.isOnline),
    raw.topics.length > 0,
  ];
  const calculatedConfidence = Number((criticalFields.filter(Boolean).length / criticalFields.length).toFixed(2));

  const validatedData: ExtractedEventData = {
    title: raw.title || 'Event Details',
    description: raw.description || null,
    startDate: raw.startDate || null,
    location: raw.location || null,
    price: raw.price !== null && !isNaN(Number(raw.price)) ? Number(raw.price) : null,
    currency: raw.currency || 'USD',
    eventType: raw.eventType || null,
    topics: raw.topics || [],
    likelyAudience: raw.likelyAudience || [],
    speakersOrPerformers: raw.speakersOrPerformers || [],
    sourceUrl: raw.sourceUrl || url,
    normalizedSourceUrl: normalizedUrlStr,
    missingInformation: raw.missingInformation || [],
    isOnline: raw.isOnline ?? (raw.location ? raw.location.toLowerCase().includes('online') : null),
    extractionConfidence: raw.extractionConfidence ?? calculatedConfidence,
    isManuallyEdited: false,
  };

  return {
    data: validatedData,
    requestId: data?.requestId || requestId,
    latencyMs: Date.now() - startTime,
  };
}
