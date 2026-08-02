// Supabase Edge Function: analyze-event
// Uses Gemini API to read public event URLs and extract structured event JSON safely.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventExtractionResponse {
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
  missingInformation: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid URL parameter" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured on Edge Function." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Fetch event page HTML safely
    let htmlText = "";
    try {
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (pageRes.ok) {
        const fullHtml = await pageRes.text();
        // Strip heavy scripts, styles, and limit text length
        htmlText = fullHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 15000);
      }
    } catch (_err) {
      console.warn("Could not fetch direct HTML from URL, fallback to prompt-only analysis.");
    }

    const prompt = `You are a strict, objective event information extractor.
Analyze the following event page content (or target URL: ${url}):

--- START PAGE CONTENT ---
${htmlText || "URL: " + url}
--- END PAGE CONTENT ---

Extract ONLY verified facts present in the text into this exact JSON schema:
{
  "title": "string (Main event title)",
  "description": "string (2-3 sentence summary of the event)",
  "startDate": "ISO timestamp string or null if unknown",
  "location": "string city/address/online or null if unknown",
  "price": number or null if unknown (0 if free)",
  "eventType": "string (e.g. Workshop, Conference, Meetup, Concert, Hackathon, Festival, Networking)",
  "topics": ["array", "of", "relevant", "topics"],
  "likelyAudience": ["array", "of", "target", "audience", "groups"],
  "speakersOrPerformers": ["array", "of", "named", "speakers", "or", "performers"],
  "sourceUrl": "${url}",
  "missingInformation": ["array", "of", "fields", "that", "were", "missing", "or", "uncertain"]
}

CRITICAL RULES:
1. NEVER fabricate or guess dates, prices, or locations.
2. If any field cannot be confirmed, set it to null and list the field name in "missingInformation".
3. Return ONLY valid JSON, with no markdown codeblocks or extra text.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // Automatic retry logic (1 retry for temporary errors)
    let geminiRes;
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (geminiRes.ok) break;
      if (attempts < 2) await new Promise((r) => setTimeout(r, 1000));
    }

    if (!geminiRes || !geminiRes.ok) {
      const errorBody = await geminiRes?.text();
      return new Response(
        JSON.stringify({ error: `Gemini API request failed: ${errorBody}` }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let extracted: EventExtractionResponse;
    try {
      extracted = JSON.parse(rawText);
    } catch (_parseErr) {
      // Fallback clean extraction
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      extracted = JSON.parse(cleanJson);
    }

    // Standardize schema integrity
    extracted.sourceUrl = url;
    extracted.missingInformation = extracted.missingInformation || [];

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        data: extracted,
        requestId,
        latencyMs,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || "An unexpected error occurred",
        requestId,
        latencyMs: Date.now() - startTime,
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
