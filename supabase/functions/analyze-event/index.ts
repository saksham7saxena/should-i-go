// Supabase Edge Function: analyze-event (Production Hardened V3)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type ExtractionErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "PRIVATE_NETWORK_URL"
  | "FETCH_TIMEOUT"
  | "FETCH_FAILED"
  | "TOO_MANY_REDIRECTS"
  | "RESPONSE_TOO_LARGE"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "MODEL_TIMEOUT"
  | "INVALID_MODEL_OUTPUT"
  | "RATE_LIMITED";

interface ExtractedEventOutput {
  title: string | null;
  description: string | null;
  startDate: string | null;
  location: string | null;
  price: number | null;
  currency: string | null;
  eventType: string | null;
  topics: string[];
  likelyAudience: string[];
  speakersOrPerformers: string[];
  isOnline: boolean | null;
  sourceUrl: string;
  missingInformation: string[];
  extractionConfidence: number;
}

// Memory cache for simple per-user rate limiting
const userRateLimits = new Map<string, { lastRequestTime: number; hourlyCount: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  let userRecord = userRateLimits.get(userId);

  if (!userRecord || now > userRecord.resetTime) {
    userRecord = { lastRequestTime: now, hourlyCount: 1, resetTime: now + 3600000 };
    userRateLimits.set(userId, userRecord);
    return { allowed: true };
  }

  // 1 request per 5 seconds limit
  if (now - userRecord.lastRequestTime < 5000) {
    return { allowed: false, retryAfterSeconds: 5 };
  }

  // Max 10 requests per hour limit
  if (userRecord.hourlyCount >= 10) {
    const retryAfter = Math.ceil((userRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  userRecord.lastRequestTime = now;
  userRecord.hourlyCount += 1;
  return { allowed: true };
}

function getCorsHeaders(req: Request): HeadersInit {
  const allowedOriginsStr = Deno.env.get("ALLOWED_ORIGINS") || "https://should-i-go-for-that.vercel.app,http://localhost:5173,http://localhost:3000";
  const allowedOrigins = allowedOriginsStr.split(",").map((o) => o.trim());
  const origin = req.headers.get("Origin") || "";

  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(data: any, status: number, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isPrivateIp(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.startsWith("10.") ||
    lower.startsWith("192.168.") ||
    lower.startsWith("169.254.")
  ) {
    return true;
  }
  // Check 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) {
    return true;
  }
  return false;
}

function validateAndCleanUrl(rawUrl: string): { safeUrl?: string; errorCode?: ExtractionErrorCode } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { errorCode: "UNSUPPORTED_PROTOCOL" };
    }
    if (isPrivateIp(parsed.hostname)) {
      return { errorCode: "PRIVATE_NETWORK_URL" };
    }
    parsed.hash = ""; // Strip URL fragment
    return { safeUrl: parsed.toString() };
  } catch (_) {
    return { errorCode: "INVALID_URL" };
  }
}

async function fetchPublicHtml(
  inputUrl: string,
  requestId: string
): Promise<
  | { success: true; finalUrl: string; htmlText: string; responseBytes: number; fetchLatencyMs: number }
  | { success: false; errorCode: ExtractionErrorCode; errorMessage: string }
> {
  const startTime = Date.now();
  let currentUrl = inputUrl;
  let redirects = 0;
  const maxRedirects = 3;

  while (redirects <= maxRedirects) {
    const urlCheck = validateAndCleanUrl(currentUrl);
    if (!urlCheck.safeUrl) {
      return {
        success: false,
        errorCode: urlCheck.errorCode || "INVALID_URL",
        errorMessage: "Target URL failed security verification.",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const res = await fetch(currentUrl, {
        method: "GET",
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeoutId);

      // Handle Redirects
      if ([301, 302, 307, 308].includes(res.status)) {
        redirects++;
        if (redirects > maxRedirects) {
          return { success: false, errorCode: "TOO_MANY_REDIRECTS", errorMessage: "Too many URL redirects." };
        }
        const location = res.headers.get("location");
        if (!location) {
          return { success: false, errorCode: "FETCH_FAILED", errorMessage: "Redirect location header missing." };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!res.ok) {
        return { success: false, errorCode: "FETCH_FAILED", errorMessage: `Page fetch failed with HTTP status ${res.status}.` };
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml") && !contentType.includes("text/plain")) {
        return { success: false, errorCode: "UNSUPPORTED_CONTENT_TYPE", errorMessage: "Target URL did not return HTML content." };
      }

      const blob = await res.blob();
      if (blob.size > 1024 * 1024) { // 1 MB limit
        return { success: false, errorCode: "RESPONSE_TOO_LARGE", errorMessage: "Event page content exceeds size limit (1 MB)." };
      }

      const fullHtml = await blob.text();
      const cleanText = fullHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 20000); // 20KB snippet limit

      return {
        success: true,
        finalUrl: currentUrl,
        htmlText: cleanText,
        responseBytes: blob.size,
        fetchLatencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return { success: false, errorCode: "FETCH_TIMEOUT", errorMessage: "Event page fetch timed out." };
      }
      return { success: false, errorCode: "FETCH_FAILED", errorMessage: "Could not fetch event page." };
    }
  }

  return { success: false, errorCode: "TOO_MANY_REDIRECTS", errorMessage: "Exceeded maximum redirects." };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  // Phase 3: Explicit Session Authentication Check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: { code: "UNAUTHENTICATED", message: "Authentication required" }, requestId }, 401, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: { code: "SERVER_MISCONFIGURED", message: "Supabase environment missing" }, requestId }, 500, corsHeaders);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: { code: "INVALID_SESSION", message: "Invalid session or token expired" }, requestId }, 401, corsHeaders);
  }

  // Phase 8: Per-User Rate Limiting Check
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return jsonResponse(
      {
        error: { code: "RATE_LIMITED", message: "You have checked several events recently. Try again shortly." },
        retryAfterSeconds: rateCheck.retryAfterSeconds || 60,
        requestId,
      },
      429,
      corsHeaders
    );
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return jsonResponse({ error: { code: "INVALID_URL", message: "Missing or invalid URL parameter." }, requestId }, 400, corsHeaders);
    }

    // Phase 4: Server-side Gemini Configuration Verification
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
    if (!geminiApiKey) {
      return jsonResponse({ error: { code: "SERVER_MISCONFIGURED", message: "GEMINI_API_KEY is not configured." }, requestId }, 500, corsHeaders);
    }

    // Phase 5 & 7: SSRF-Protected HTML Fetching (Fail Closed)
    const fetchResult = await fetchPublicHtml(url, requestId);
    if (!fetchResult.success) {
      return jsonResponse(
        {
          error: { code: fetchResult.errorCode, message: fetchResult.errorMessage },
          requestId,
        },
        400,
        corsHeaders
      );
    }

    // Call Gemini API with Structured Extraction Prompt
    const prompt = `You are a strict, factual event metadata extractor.
Analyze the public event content below:

URL: ${fetchResult.finalUrl}
--- START CONTENT ---
${fetchResult.htmlText}
--- END CONTENT ---

Extract ONLY verified facts directly present in the text into this exact JSON structure:
{
  "title": string or null if unlisted,
  "description": string or null if unlisted,
  "startDate": ISO timestamp string (e.g. "2026-10-15T09:00:00Z") or null if unlisted,
  "location": venue name/address or "Online" (null if unlisted),
  "price": number (0 for free) or null if unlisted,
  "currency": "USD" or null if unlisted,
  "eventType": string or null if unlisted,
  "topics": ["array", "of", "topics"],
  "likelyAudience": ["target audience groups"],
  "speakersOrPerformers": ["speakers or performers"],
  "isOnline": boolean or null if unlisted,
  "missingInformation": ["array of missing field names"]
}

STRICT RULES:
1. NEVER invent or fabricate dates, prices, titles, or locations.
2. If price is unlisted, set price to null.
3. If date is unlisted, set startDate to null.
4. If topics are unlisted, return empty array [].
5. Return ONLY valid JSON with no markdown tags.`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
    const modelStart = Date.now();

    const geminiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    const modelLatencyMs = Date.now() - modelStart;

    if (!geminiRes.ok) {
      return jsonResponse(
        { error: { code: "INVALID_MODEL_OUTPUT", message: "Gemini service temporarily unavailable." }, requestId },
        502,
        corsHeaders
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed: any;
    try {
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (_) {
      return jsonResponse(
        { error: { code: "INVALID_MODEL_OUTPUT", message: "Failed to parse structured event metadata." }, requestId },
        422,
        corsHeaders
      );
    }

    // Phase 6: Output Validation & Extraction Confidence Calculation
    const criticalFields = [
      Boolean(parsed.title),
      Boolean(parsed.startDate),
      parsed.price !== null && parsed.price !== undefined,
      Boolean(parsed.location || parsed.isOnline),
      Array.isArray(parsed.topics) && parsed.topics.length > 0,
    ];
    const extractionConfidence = Number((criticalFields.filter(Boolean).length / criticalFields.length).toFixed(2));

    const finalOutput: ExtractedEventOutput = {
      title: parsed.title || null,
      description: parsed.description || null,
      startDate: parsed.startDate || null,
      location: parsed.location || null,
      price: parsed.price !== null && parsed.price !== undefined && !isNaN(Number(parsed.price)) ? Number(parsed.price) : null,
      currency: parsed.currency || "USD",
      eventType: parsed.eventType || null,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      likelyAudience: Array.isArray(parsed.likelyAudience) ? parsed.likelyAudience : [],
      speakersOrPerformers: Array.isArray(parsed.speakersOrPerformers) ? parsed.speakersOrPerformers : [],
      isOnline: parsed.isOnline ?? (parsed.location ? parsed.location.toLowerCase().includes("online") : null),
      sourceUrl: fetchResult.finalUrl,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      extractionConfidence,
    };

    return jsonResponse(
      {
        data: finalOutput,
        requestId,
        metrics: {
          fetchLatencyMs: fetchResult.fetchLatencyMs,
          modelLatencyMs,
          responseBytes: fetchResult.responseBytes,
        },
      },
      200,
      corsHeaders
    );
  } catch (err: any) {
    return jsonResponse(
      { error: { code: "FETCH_FAILED", message: err.message || "An unexpected error occurred." }, requestId },
      500,
      corsHeaders
    );
  }
});
