// Supabase Edge Function: analyze-event (Secured SSRF-protected Event Fact Extractor)

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
  isOnline: boolean;
  extractionConfidence: number;
}

// Security Helper: Validate URL against SSRF and private ranges
function isUrlSafe(targetUrl: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(targetUrl);
    
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, error: "Only HTTP and HTTPS protocols are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and private IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return { safe: false, error: "Access to private or local network resources is forbidden." };
    }

    return { safe: true };
  } catch (_) {
    return { safe: false, error: "Invalid event URL format." };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid URL parameter", requestId }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // SSRF URL Validation Check
    const urlCheck = isUrlSafe(url);
    if (!urlCheck.safe) {
      return new Response(
        JSON.stringify({ error: urlCheck.error, requestId }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured on Edge Function environment.", requestId }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch Target HTML with 8-second Timeout & Max Size Limit
    let htmlText = "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const pageRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeoutId);

      if (pageRes.ok) {
        const contentType = pageRes.headers.get("content-type") || "";
        if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
          const fullHtml = await pageRes.text();
          htmlText = fullHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .slice(0, 20000); // 20KB text snippet limit
        }
      }
    } catch (_fetchErr) {
      console.warn(`[Edge Function ${requestId}] Fetch timeout or blocked for URL: ${url}`);
    }

    const prompt = `You are a strict, factual event metadata extractor.
Analyze the following public event URL (${url}) and content:

--- START PAGE CONTENT ---
${htmlText || "URL: " + url}
--- END PAGE CONTENT ---

Extract ONLY verified facts directly present in the text into this exact JSON structure:
{
  "title": "Main event title",
  "description": "2-3 sentence description",
  "startDate": "ISO timestamp string or null if unknown",
  "location": "Venue address, city, or 'Online' if virtual (null if unknown)",
  "price": number or null if unknown (0 if free)",
  "eventType": "Workshop, Conference, Meetup, Concert, Hackathon, Festival, Networking, etc.",
  "topics": ["array", "of", "relevant", "topics"],
  "likelyAudience": ["target audience groups"],
  "speakersOrPerformers": ["speakers or performers"],
  "isOnline": boolean (true if virtual/streamed),
  "missingInformation": ["array of unconfirmed or missing fields"]
}

STRICT CONSTRAINTS:
1. NEVER invent, fabricate, or guess dates, prices, titles, or locations.
2. If price is unlisted or unclear, set price to null and add "price" to missingInformation.
3. If date is unlisted, set startDate to null and add "startDate" to missingInformation.
4. Return ONLY valid raw JSON with no markdown tags.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    let geminiRes;
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
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
      } catch (_) {
        if (attempts >= 2) break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!geminiRes || !geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: "We couldn’t read this event page. Paste the event details instead.", requestId }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let extracted: EventExtractionResponse;
    try {
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      extracted = JSON.parse(cleanJson);
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Failed to parse structured event metadata. Try manual input.", requestId }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Standardize extraction object
    extracted.sourceUrl = url;
    extracted.missingInformation = extracted.missingInformation || [];

    const missingCount = extracted.missingInformation.length;
    extracted.extractionConfidence = Math.max(0.2, Number((1 - missingCount * 0.15).toFixed(2)));

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
