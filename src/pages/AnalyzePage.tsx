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
  ShieldCheck,
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
  const [isSaved, setIsSaved] = useState<boolean>(false);
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
    setIsSaved(false);

    const startTime = Date.now();

    try {
      setStepStatus('Fetching & analyzing event with Gemini API...');
      const { data, latencyMs, requestId } = await extractEventFromUrl({ url: targetUrl });

      setStepStatus('Evaluating rules against your personal preferences...');
      const scoringResult = calculateRecommendation(data, preferences);

      setExtractedEvent(data);
      setRecommendation(scoringResult);

      // Auto log telemetry
      await logApiCall({
        userId: userId || undefined,
        operation: 'ANALYZE_EVENT',
        status: 'SUCCESS',
        latencyMs: Date.now() - startTime,
        requestId,
      });

      // Auto save event to user's saved list safely
      if (userId) {
        setStepStatus('Saving recommendation to your database...');
        const { recommendation: recRecord } = await saveEventAndRecommendation(
          userId,
          data,
          scoringResult
        );
        setIsSaved(true);
        setSavedRecId(recRecord.id);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Failed to extract event facts. Please check the URL and try again.');
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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Input Header Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Analyze Public Event</h1>
          </div>
          <Link
            to="/settings"
            className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Edit Preferences</span>
          </Link>
        </div>

        <form onSubmit={onFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste public event URL (e.g. https://eventbrite.com/e/123456)"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm shrink-0"
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
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton & Progress */}
      {isAnalyzing && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4 animate-pulse">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Analyzing Event & Calculating Scores</h3>
          <p className="text-xs text-slate-400 font-mono">{stepStatus}</p>
        </div>
      )}

      {/* Result Display Card */}
      {extractedEvent && recommendation && !isAnalyzing && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Recommendation Hero Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge decision={recommendation.decision} size="lg" />
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    Confidence: {recommendation.confidence}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white pt-2 leading-tight">
                  {extractedEvent.title}
                </h2>
              </div>

              {/* Score Display */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shrink-0">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Score</span>
                <span className="text-3xl font-black text-indigo-400 font-mono">
                  {recommendation.score}<span className="text-sm font-semibold text-slate-400">/100</span>
                </span>
              </div>
            </div>

            {/* Event Key Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Date & Time</span>
                </div>
                <div className="font-bold text-slate-200">{formatEventDate(extractedEvent.startDate)}</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Location</span>
                </div>
                <div className="font-bold text-slate-200">{extractedEvent.location || 'Location Unspecified'}</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Price / Type</span>
                </div>
                <div className="font-bold text-emerald-400">
                  {formatEventPrice(extractedEvent.price)} • {extractedEvent.eventType}
                </div>
              </div>
            </div>

            {/* Strongest Reason Highlight */}
            <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-400">
                Key Recommendation Takeaway
              </span>
              <p className="text-sm font-semibold text-slate-100">{recommendation.strongestReason}</p>
            </div>

            {/* Positive Reasons & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Reasons */}
              <div className="space-y-3 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3 Key Reasons to Attend</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              <div className="space-y-3 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Potential Concerns</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {recommendation.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Info Warning Callout if present */}
            {extractedEvent.missingInformation.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Missing unlisted event details:{' '}
                  <span className="text-slate-300 font-mono">{extractedEvent.missingInformation.join(', ')}</span>
                </span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <a
                href={extractedEvent.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <span>View Original Event Webpage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {savedRecId && (
                <Link
                  to={`/events/${savedRecId}`}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Saved in Your Library (View Details)</span>
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
