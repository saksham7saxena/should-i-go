import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractEventFromUrl } from '../lib/gemini';
import { calculateRecommendation } from '../lib/scoring';
import { saveEventAndRecommendation } from '../lib/supabase';
import { logApiCall } from '../lib/logger';
import { isValidUrl, formatEventDate, formatEventPrice } from '../lib/urlParser';
import { ExtractedEventData, ScoringResult } from '../types';
import { Badge } from '../components/Badge';
import { ScoreCard } from '../components/ScoreCard';
import {
  Sparkles,
  Link2,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BookmarkPlus,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const AnalyzePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, preferences, hasCompletedOnboarding } = useAuth();

  const [url, setUrl] = useState<string>(searchParams.get('url') || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [extractedEvent, setExtractedEvent] = useState<ExtractedEventData | null>(null);
  const [recommendation, setRecommendation] = useState<ScoringResult | null>(null);
  const [savedRecId, setSavedRecId] = useState<string | null>(null);

  useEffect(() => {
    const initialUrl = searchParams.get('url');
    if (initialUrl && isValidUrl(initialUrl) && !extractedEvent && !isAnalyzing) {
      handleAnalyze(initialUrl);
    }
  }, [searchParams]);

  const handleAnalyze = async (targetUrl: string) => {
    if (!isValidUrl(targetUrl)) {
      setError('Please provide a valid public HTTP or HTTPS event URL.');
      return;
    }

    if (!preferences || !hasCompletedOnboarding) {
      navigate('/onboarding');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setExtractedEvent(null);
    setRecommendation(null);

    const startTime = Date.now();

    try {
      setStepStatus('Fetching & analyzing event with Gemini API...');
      const { data, latencyMs, requestId } = await extractEventFromUrl({ url: targetUrl });

      setStepStatus('Evaluating rules against your personal preferences...');
      const scoringResult = calculateRecommendation(data, preferences);

      setExtractedEvent(data);
      setRecommendation(scoringResult);

      await logApiCall({
        userId: userId || undefined,
        operation: 'ANALYZE_EVENT',
        status: 'SUCCESS',
        latencyMs: Date.now() - startTime,
        requestId,
      });

      if (userId) {
        setStepStatus('Saving recommendation to your database...');
        const { recommendation: recRecord } = await saveEventAndRecommendation(
          userId,
          data,
          scoringResult
        );
        setSavedRecId(recRecord.id);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Failed to extract event facts. Please check the URL.');
      await logApiCall({
        userId: userId || undefined,
        operation: 'ANALYZE_EVENT',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        errorMessage: err.message,
      });
    } finally {
      setIsAnalyzing(false);
      setStepStatus('');
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      handleAnalyze(url.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-gray-900">
      {/* Search Bar Container */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <h1 className="text-xl font-bold text-gray-900">Analyze Public Event</h1>
          </div>
          <Link
            to="/settings"
            className="text-xs font-semibold text-gray-600 hover:text-black underline"
          >
            <span>Edit Preferences</span>
          </Link>
        </div>

        <form onSubmit={onFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste event URL (e.g. https://eventbrite.com/e/123456)"
              required
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="py-2 px-5 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Run Decision</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isAnalyzing && (
        <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Extracting Facts & Scoring</h3>
          <p className="text-xs text-gray-500 font-mono">{stepStatus}</p>
        </div>
      )}

      {/* Result Display Card */}
      {extractedEvent && recommendation && !isAnalyzing && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Hero Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge decision={recommendation.decision} size="lg" />
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    Confidence: {recommendation.confidence}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 pt-2 leading-tight">
                  {extractedEvent.title}
                </h2>
              </div>

              {/* Score Display */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-[#f5f5f5] px-5 py-3 rounded-xl border border-gray-200 shrink-0">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Overall Score</span>
                <span className="text-3xl font-black text-black font-mono">
                  {recommendation.score}<span className="text-sm font-semibold text-gray-500">/100</span>
                </span>
              </div>
            </div>

            {/* Event Key Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-gray-700" />
                  <span>Date & Time</span>
                </div>
                <div className="font-bold text-gray-900">{formatEventDate(extractedEvent.startDate)}</div>
              </div>

              <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-gray-700" />
                  <span>Location</span>
                </div>
                <div className="font-bold text-gray-900">{extractedEvent.location || 'Location Unspecified'}</div>
              </div>

              <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-gray-700" />
                  <span>Price / Type</span>
                </div>
                <div className="font-bold text-gray-900">
                  {formatEventPrice(extractedEvent.price)} • {extractedEvent.eventType}
                </div>
              </div>
            </div>

            {/* Key Recommendation Takeaway Callout */}
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-600">
                Key Recommendation Takeaway
              </span>
              <p className="text-sm font-bold text-gray-900">{recommendation.strongestReason}</p>
            </div>

            {/* Positive Reasons & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Reasons */}
              <div className="space-y-3 bg-[#f5f5f5] p-5 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3 Key Reasons to Attend</span>
                </h4>
                <ul className="space-y-2 text-xs text-gray-700 font-medium">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              <div className="space-y-3 bg-[#f5f5f5] p-5 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Potential Concerns</span>
                </h4>
                <ul className="space-y-2 text-xs text-gray-700 font-medium">
                  {recommendation.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Information Callout */}
            {extractedEvent.missingInformation.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500 shrink-0" />
                <span>
                  Unlisted event facts:{' '}
                  <span className="text-gray-900 font-mono font-semibold">{extractedEvent.missingInformation.join(', ')}</span>
                </span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <a
                href={extractedEvent.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-900 hover:text-black font-semibold underline"
              >
                <span>View Original Event Webpage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {savedRecId && (
                <Link
                  to={`/events/${savedRecId}`}
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Saved in Library (View Details)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Scoring Breakdown Card */}
          <ScoreCard score={recommendation.score} breakdown={recommendation.scoringBreakdown} />
        </div>
      )}
    </div>
  );
};
