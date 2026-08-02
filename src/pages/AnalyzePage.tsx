import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractEventFromUrl, ExtractionError } from '../lib/gemini';
import { calculateRecommendation } from '../lib/scoring';
import { upsertAnalysis, setEventStatus, recordFeedback } from '../lib/supabase';
import { isValidUrl, formatEventDate, formatEventPrice, normalizeUrl } from '../lib/urlParser';
import { ExtractedEventData, ScoringResult, PrimaryGoalType, AnalysisStage, ExtractionErrorCode, AppEventStatus } from '../types';
import { Badge } from '../components/Badge';
import { ScoreCard } from '../components/ScoreCard';
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  BookmarkPlus,
  Loader2,
  ArrowRight,
  Edit3,
  Check,
  ChevronDown,
} from 'lucide-react';

export const AnalyzePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, preferences, hasCompletedOnboarding } = useAuth();

  const [inputUrl, setInputUrl] = useState<string>(searchParams.get('url') || '');
  const [stage, setStage] = useState<AnalysisStage>({ type: 'idle' });

  // Goal & Draft Form State
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoalType>('Learn something');
  const [draftData, setDraftData] = useState<ExtractedEventData | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  // URL Preservation & Restoration Trigger
  useEffect(() => {
    const urlFromParam = searchParams.get('url');
    const urlFromSession = sessionStorage.getItem('pendingEventUrl');
    const targetUrl = urlFromParam || urlFromSession;

    if (targetUrl && isValidUrl(targetUrl) && stage.type === 'idle') {
      if (!hasCompletedOnboarding) {
        sessionStorage.setItem('pendingEventUrl', normalizeUrl(targetUrl));
        navigate('/onboarding', { replace: true });
        return;
      }
      startExtraction(targetUrl);
    }
  }, [searchParams, hasCompletedOnboarding]);

  const startExtraction = async (urlToExtract: string) => {
    const normUrl = normalizeUrl(urlToExtract);
    setInputUrl(normUrl);

    if (!preferences || !hasCompletedOnboarding) {
      sessionStorage.setItem('pendingEventUrl', normUrl);
      navigate('/onboarding', { replace: true });
      return;
    }

    setStage({ type: 'extracting', url: normUrl });
    setActionDone(null);

    try {
      const { data } = await extractEventFromUrl(normUrl);
      // Clear pending URL on successful extraction
      sessionStorage.removeItem('pendingEventUrl');
      setDraftData(data);
      setStage({ type: 'reviewing', draft: data });
    } catch (err: any) {
      const extErr = err as ExtractionError;
      setDraftData({
        title: '',
        description: null,
        startDate: null,
        location: null,
        price: null,
        currency: 'USD',
        eventType: null,
        topics: [],
        likelyAudience: [],
        speakersOrPerformers: [],
        sourceUrl: normUrl,
        normalizedSourceUrl: normUrl,
        missingInformation: [],
        isOnline: null,
        isManuallyEdited: true,
      });
      setStage({
        type: 'manual-entry',
        url: normUrl,
        reason: extErr.code || 'FETCH_FAILED',
      });
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftData || !draftData.title.trim()) return;

    const manualEvent: ExtractedEventData = {
      ...draftData,
      isManuallyEdited: true,
      normalizedSourceUrl: normalizeUrl(draftData.sourceUrl || inputUrl),
    };
    setDraftData(manualEvent);
    setStage({ type: 'choosing-goal', event: manualEvent });
  };

  const handleCalculateRecommendation = async () => {
    if (!draftData || !preferences || !userId) return;

    const recResult: ScoringResult = calculateRecommendation(draftData, preferences, selectedGoal);

    try {
      // Phase 1 Persistence: Upsert analysis record without setting active saved status
      const { eventId, recommendationId } = await upsertAnalysis(draftData, recResult, userId);
      setStage({
        type: 'result',
        event: draftData,
        recommendation: recResult,
        eventId,
        recommendationId,
      });
    } catch (err: any) {
      console.warn('Upsert analysis warning:', err);
      setStage({
        type: 'result',
        event: draftData,
        recommendation: recResult,
      });
    }
  };

  const handleExplicitSave = async (status: AppEventStatus) => {
    if (stage.type !== 'result' || !userId) return;

    try {
      let eventId = stage.eventId;
      let recommendationId = stage.recommendationId;

      if (!eventId || !recommendationId) {
        const ids = await upsertAnalysis(stage.event, stage.recommendation, userId);
        eventId = ids.eventId;
        recommendationId = ids.recommendationId;
      }

      await setEventStatus(eventId, recommendationId, status, userId);

      if (status === 'considering') {
        setActionDone('Saved to your library for later!');
      } else if (status === 'going') {
        setActionDone('Marked as Going on your Saved page!');
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleNotForMe = async () => {
    if (stage.type !== 'result' || !userId) return;

    try {
      let eventId = stage.eventId;
      let recommendationId = stage.recommendationId;

      if (!eventId || !recommendationId) {
        const ids = await upsertAnalysis(stage.event, stage.recommendation, userId);
        eventId = ids.eventId;
        recommendationId = ids.recommendationId;
      }

      await setEventStatus(eventId, recommendationId, 'dismissed', userId);
      await recordFeedback(userId, recommendationId, { dismissed: true, dismissal_reason: 'Not for me' });
      setActionDone('Feedback recorded. Event dismissed.');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      alert(`Error recording dismissal: ${err.message}`);
    }
  };

  const goalsList: { label: PrimaryGoalType; description: string }[] = [
    { label: 'Learn something', description: 'Focus on technical keynotes, workshops, and panels.' },
    { label: 'Meet people', description: 'Prioritize networking mixers, meetups, and founder chats.' },
    { label: 'Have fun', description: 'Look for concerts, festivals, games, and entertainment.' },
    { label: 'Try something new', description: 'Explore fresh topics and unique local experiences.' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      {/* STAGE: IDLE or ERROR */}
      {(stage.type === 'idle' || stage.type === 'error') && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif text-[#0c0a09]">Paste an event</h1>
            <p className="text-xs text-[#777169]">Enter any public event URL to check if you should go.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputUrl.trim()) startExtraction(inputUrl.trim());
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2 bg-[#f5f5f5] p-2 rounded-2xl border border-[#e7e5e4] focus-within:border-[#0c0a09]">
              <div className="relative flex-1 flex items-center">
                <Link2 className="w-4 h-4 text-[#777169] absolute left-3" />
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste event link (e.g. https://eventbrite.com/e/123456)"
                  required
                  aria-label="Event URL"
                  className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold rounded-full shadow-xs transition-all flex items-center justify-center gap-2 text-xs shrink-0"
              >
                <span>Should I go?</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {stage.type === 'error' && (
              <p role="alert" className="text-xs text-rose-700 font-medium">
                {stage.message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* STAGE: EXTRACTING */}
      {stage.type === 'extracting' && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#0c0a09] animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-serif text-[#0c0a09]">Reading event page details...</h2>
            <p className="text-xs text-[#777169]">Extracting verified facts from <span className="font-mono">{stage.url}</span></p>
          </div>
        </div>
      )}

      {/* STAGE: MANUAL ENTRY (Fail Closed) */}
      {stage.type === 'manual-entry' && draftData && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-[#e7e5e4] pb-4">
            <h2 className="text-xl font-serif text-[#0c0a09]">We couldn’t read this event page</h2>
            <p className="text-xs text-[#777169]">Enter the details you know and we’ll still help you decide.</p>
          </div>

          <form onSubmit={handleManualFormSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="manual-title" className="font-semibold text-[#0c0a09] block mb-1">
                Event title *
              </label>
              <input
                id="manual-title"
                type="text"
                required
                value={draftData.title}
                onChange={(e) => setDraftData({ ...draftData, title: e.target.value })}
                placeholder="e.g. AI Founder Conference"
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-price" className="font-semibold text-[#0c0a09] block mb-1">
                  Ticket price ($)
                </label>
                <input
                  id="manual-price"
                  type="number"
                  placeholder="0 for free, leave blank if unlisted"
                  value={draftData.price ?? ''}
                  onChange={(e) =>
                    setDraftData({
                      ...draftData,
                      price: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                />
              </div>

              <div>
                <label htmlFor="manual-type" className="font-semibold text-[#0c0a09] block mb-1">
                  Event type
                </label>
                <input
                  id="manual-type"
                  type="text"
                  placeholder="Conference, Workshop, Meetup, etc."
                  value={draftData.eventType || ''}
                  onChange={(e) => setDraftData({ ...draftData, eventType: e.target.value || null })}
                  className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="manual-location" className="font-semibold text-[#0c0a09] block mb-1">
                Location / Venue
              </label>
              <input
                id="manual-location"
                type="text"
                placeholder="San Francisco, CA or Online"
                value={draftData.location || ''}
                onChange={(e) => setDraftData({ ...draftData, location: e.target.value || null })}
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
              <button
                type="button"
                onClick={() => setStage({ type: 'idle' })}
                className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-2"
              >
                <span>Continue to Goal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAGE: REVIEWING ("Does this look right?") */}
      {stage.type === 'reviewing' && draftData && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
            <div>
              <h2 className="text-2xl font-serif text-[#0c0a09]">Does this look right?</h2>
              <p className="text-xs text-[#777169]">Review extracted details before receiving your recommendation.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="review-title" className="font-semibold text-[#777169] uppercase tracking-wider text-[10px] block mb-1">
                Event title
              </label>
              <input
                id="review-title"
                type="text"
                value={draftData.title}
                onChange={(e) => setDraftData({ ...draftData, title: e.target.value, isManuallyEdited: true })}
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg p-2 font-bold text-[#0c0a09] text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className={`p-3 rounded-xl border ${!draftData.startDate ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <label htmlFor="review-date" className="font-semibold text-[#777169] block mb-1">
                  Date & Time {!draftData.startDate && '(Unlisted)'}
                </label>
                <input
                  id="review-date"
                  type="text"
                  placeholder="YYYY-MM-DD (e.g. 2026-10-15T18:00:00Z)"
                  value={draftData.startDate || ''}
                  onChange={(e) => setDraftData({ ...draftData, startDate: e.target.value || null, isManuallyEdited: true })}
                  className="w-full bg-white border border-[#e7e5e4] rounded p-1.5 text-xs text-[#0c0a09]"
                />
              </div>

              <div className={`p-3 rounded-xl border ${draftData.price === null ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <label htmlFor="review-price" className="font-semibold text-[#777169] block mb-1">
                  Ticket price ($) {draftData.price === null && '(Unlisted)'}
                </label>
                <input
                  id="review-price"
                  type="number"
                  placeholder="Leave blank if unlisted"
                  value={draftData.price ?? ''}
                  onChange={(e) =>
                    setDraftData({
                      ...draftData,
                      price: e.target.value === '' ? null : Number(e.target.value),
                      isManuallyEdited: true,
                    })
                  }
                  className="w-full bg-white border border-[#e7e5e4] rounded p-1.5 text-xs text-[#0c0a09]"
                />
              </div>

              <div className={`p-3 rounded-xl border ${!draftData.location ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <label htmlFor="review-location" className="font-semibold text-[#777169] block mb-1">
                  Location {!draftData.location && '(Unlisted)'}
                </label>
                <input
                  id="review-location"
                  type="text"
                  placeholder="Venue address or Online"
                  value={draftData.location || ''}
                  onChange={(e) => setDraftData({ ...draftData, location: e.target.value || null, isManuallyEdited: true })}
                  className="w-full bg-white border border-[#e7e5e4] rounded p-1.5 text-xs text-[#0c0a09]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e7e5e4]">
                <label htmlFor="review-type" className="font-semibold text-[#777169] block mb-1">
                  Event type
                </label>
                <input
                  id="review-type"
                  type="text"
                  placeholder="Conference, Workshop, Meetup"
                  value={draftData.eventType || ''}
                  onChange={(e) => setDraftData({ ...draftData, eventType: e.target.value || null, isManuallyEdited: true })}
                  className="w-full bg-white border border-[#e7e5e4] rounded p-1.5 text-xs text-[#0c0a09]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
            <button
              type="button"
              onClick={() => setStage({ type: 'idle' })}
              className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setStage({ type: 'choosing-goal', event: draftData })}
              className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-2"
            >
              <span>Continue to Goal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE: CHOOSING GOAL */}
      {stage.type === 'choosing-goal' && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-[#e7e5e4] pb-4">
            <h2 className="text-2xl font-serif text-[#0c0a09]">What are you hoping to get from this event?</h2>
            <p className="text-xs text-[#777169]">Select your goal for <span className="font-bold text-[#0c0a09]">{stage.event.title}</span>.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalsList.map((g) => (
              <button
                key={g.label}
                type="button"
                aria-pressed={selectedGoal === g.label}
                onClick={() => setSelectedGoal(g.label)}
                className={`p-4 rounded-xl border text-left transition-all space-y-1 ${
                  selectedGoal === g.label
                    ? 'bg-[#0c0a09] border-[#0c0a09] text-white shadow-xs'
                    : 'bg-[#f5f5f5] border-[#e7e5e4] text-[#4e4e4e] hover:bg-[#f0efed]'
                }`}
              >
                <div className={`font-bold text-xs ${selectedGoal === g.label ? 'text-white' : 'text-[#0c0a09]'}`}>{g.label}</div>
                <div className={`text-[11px] ${selectedGoal === g.label ? 'text-[#a8a29e]' : 'text-[#777169]'}`}>{g.description}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
            <button
              type="button"
              onClick={() => setStage({ type: 'reviewing', draft: stage.event })}
              className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
            >
              Back to details
            </button>

            <button
              type="button"
              onClick={handleCalculateRecommendation}
              className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-2"
            >
              <span>Should I go?</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE: RESULT (Explicit Save Actions) */}
      {stage.type === 'result' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Badge decision={stage.recommendation.decision} size="lg" />
                  <span className="text-2xl font-black font-mono text-[#0c0a09]">
                    {stage.recommendation.score}<span className="text-sm font-semibold text-[#777169]">/100</span>
                  </span>
                </div>
                <h2 className="text-xl font-serif text-[#0c0a09] pt-2">{stage.event.title}</h2>
              </div>

              <div className="text-xs text-[#777169] bg-[#f5f5f5] px-3 py-1.5 rounded-full border border-[#e7e5e4] self-start sm:self-center">
                Confidence: <span className="font-bold text-[#0c0a09]">{stage.recommendation.confidence}</span>
              </div>
            </div>

            {/* Bottom Line */}
            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#777169]">Bottom line</span>
              <p className="text-sm font-medium text-[#0c0a09] leading-snug">{stage.recommendation.bottomLine}</p>
            </div>

            {/* Reasons & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0c0a09] uppercase tracking-wider">Why this recommendation</h3>
                <ul className="space-y-1.5 text-xs text-[#4e4e4e]">
                  {stage.recommendation.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {stage.recommendation.concerns.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Watch out</h3>
                  <ul className="space-y-1.5 text-xs text-[#4e4e4e]">
                    {stage.recommendation.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Explicit Actions (Save for later, I'm going, Not for me) */}
            <div className="pt-4 border-t border-[#e7e5e4] space-y-3">
              {actionDone ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{actionDone}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={stage.event.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09] text-xs font-semibold rounded-full border border-[#e7e5e4] transition-colors flex items-center gap-1.5"
                  >
                    <span>View event</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleExplicitSave('considering')}
                    className="px-4 py-2.5 bg-white hover:bg-[#fafafa] text-[#0c0a09] text-xs font-semibold rounded-full border border-[#d6d3d1] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save for later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExplicitSave('going')}
                    className="px-5 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>I’m going</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNotForMe}
                    className="px-4 py-2.5 text-xs text-[#777169] hover:text-[#0c0a09] font-medium transition-colors ml-auto"
                  >
                    Not for me
                  </button>
                </div>
              )}
            </div>

            {/* Collapsed Scoring Breakdown (<details>) */}
            <details className="pt-2 group">
              <summary className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c0a09] cursor-pointer hover:underline list-none">
                <span>Why this score</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4 animate-fade-in">
                <ScoreCard score={stage.recommendation.score} breakdown={stage.recommendation.scoringBreakdown} />
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};
