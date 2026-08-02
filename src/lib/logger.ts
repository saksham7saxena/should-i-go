// API Latency and Request Telemetry Logger

import { supabase, isSupabaseConfigured } from './supabase';

interface LogApiParams {
  userId?: string;
  eventId?: string;
  operation: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  latencyMs: number;
  errorMessage?: string;
  requestId?: string;
}

export async function logApiCall(params: LogApiParams): Promise<void> {
  const payload = {
    user_id: params.userId || null,
    event_id: params.eventId || null,
    operation: params.operation,
    status: params.status,
    latency_ms: params.latencyMs,
    error_message: params.errorMessage || null,
    request_id: params.requestId || `req_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('api_logs').insert(payload);
      return;
    } catch (err) {
      console.warn('Could not log to Supabase api_logs:', err);
    }
  }

  // Local console log telemetry
  console.log(`[API LOG] [${params.status}] ${params.operation} - ${params.latencyMs}ms (${params.requestId})`, params.errorMessage || '');
}
