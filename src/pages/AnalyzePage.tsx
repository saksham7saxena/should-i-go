import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractEventFromUrl, cleanExtractedEvent } from '../lib/gemini';
import { calculateRecommendation } from '../lib/scoring';
import { saveEventRecommendationExplicit, logNotForMeFeedback } from '../lib/supabase';
import { logApiCall } from '../lib/logger';
import { isValidUrl, formatEventDate, formatEventPrice } from '../lib/urlParser';
import { ExtractedEventData, ScoringResult, PrimaryGoalType } from '../types';
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
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  XCircle,
  DollarSign,
  Target,
} from 'lucide-react';

export const AnalyzePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, preferences, hasCompletedOnboarding } = useAuth();

  const [url, setUrl] = useState<string>(searchParams.get('url') || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  // Workflow steps: 'INPUT' | 'REVIEW' | 'GOAL' | 'RESULT'
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'GOAL' | 'RESULT'>('INPUT');

  // Extracted and Editable Data
  const [extractedEvent, setExtractedEvent] = useState<ExtractedEventData | null>(null);
  const [editedEvent, setEditedEvent] = useState<ExtractedEventData | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Per-Event Goal & Scoring
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoalType>('Learn something');
  const [recommendation, setRecommendation] = useState<ScoringResult | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);

  // Action status
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    const initialUrl = searchParams.get('url');
    if (initialUrl && isValidUrl(initialUrl) && !extractedEvent && !isAnalyzing) {
      handleAnalyze(initialUrl);
    }
  }, [searchParams]);

  const handleAnalyze = async (targetUrl: string) => {
    if (!isValidUrl(targetUrl)) {
      setError('Please enter a valid HTTP or HTTPS event URL.');
      return;
    }

    if (!preferences || !hasCompletedOnboarding) {
      sessionStorage.setItem('pending_event_url', targetUrl);
      navigate('/onboarding');
      return;
    }

    setError('');
    setShowManualForm(false);
    setIsAnalyzing(true);
    setExtractedEvent(null);
    setEditedEvent(null);
    setRecommendation(null);

    const startTime = Date.now();

    try {
      setProgressMessage('Reading the event page...');
      await new Promise((r) => setTimeout(r, 400));
      setProgressMessage('Extracting details...');
      
      const { data, latencyMs, requestId } = await extractEventFromUrl({ url: targetUrl });
      
      setProgressMessage('Comparing with your preferences...');
      await new Promise((r) => setTimeout(r, 300));
      setProgressMessage('Preparing your recommendation...');

      setExtractedEvent(data);
      setEditedEvent({ ...data });
      setStep('REVIEW');

      await logApiCall({
        userId: userId || undefined,
        operation: 'ANALYZE_EVENT',
        status: 'SUCCESS',
        latencyMs: Date.now() - startTime,
        requestId,
      });
    } catch (err: any) {
      console.warn('Extraction failed:', err);
      setError(err.message || 'We couldn’t read this event page. Paste the event details instead.');
      setShowManualForm(true);
      await logApiCall({
        userId: userId || undefined,
        operation: 'ANALYZE_EVENT',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        errorMessage: err.message,
      });
    } finally {
      setIsAnalyzing(false);
      setProgressMessage('');
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedEvent || !editedEvent.title.trim()) return;

    const manualData = cleanExtractedEvent(
      {
        ...editedEvent,
        isManuallyEdited: true,
      },
      url || editedEvent.sourceUrl || 'https://manual-entry.local'
    );

    setExtractedEvent(manualData);
    setEditedEvent(manualData);
    setShowManualForm(false);
    setError('');
    setStep('GOAL');
  };

  const handleCalculateRecommendation = () => {
    if (!editedEvent || !preferences) return;
    const finalEvent = { ...editedEvent };
    const recResult = calculateRecommendation(finalEvent, preferences, selectedGoal);
    setRecommendation(recResult);
    setStep('RESULT');
  };

  const handleExplicitSave = async (status: 'Considering' | 'Attending') => {
    if (!userId || !editedEvent || !recommendation) return;
    await saveEventRecommendationExplicit(userId, editedEvent, recommendation, status);
    setActionDone(status === 'Considering' ? 'Saved for later!' : 'Marked as Going!');
  };

  const handleNotForMe = async () => {
    if (userId && editedEvent && recommendation) {
      await logNotForMeFeedback(userId, editedEvent, recommendation);
    }
    setActionDone('Feedback recorded. Event dismissed.');
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  const goalsList: { label: PrimaryGoalType; description: string }[] = [
    { label: 'Learn something', description: 'Focus on workshops, technical talks, and keynotes.' },
    { label: 'Meet people', description: 'Prioritize networking, founder mixers, and meetups.' },
    { label: 'Have fun', description: 'Look for festivals, concerts, games, and entertainment.' },
    { label: 'Try something new', description: 'Discover fresh topics and unique local experiences.' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      {/* 1. INPUT STEP (Primary Search Bar) */}
      {step === 'INPUT' && !showManualForm && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif text-[#0c0a09]">Paste an event</h1>
            <p className="text-xs text-[#777169]">Enter any public event link to check if you should go.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) handleAnalyze(url.trim());
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2 bg-[#f5f5f5] p-2 rounded-2xl border border-[#e7e5e4] focus-within:border-[#0c0a09]">
              <div className="relative flex-1 flex items-center">
                <Link2 className="w-4 h-4 text-[#777169] absolute left-3" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste event link (e.g. https://eventbrite.com/e/123456)"
                  required
                  className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing}
                className="py-2.5 px-6 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold rounded-full shadow-xs transition-all flex items-center justify-center gap-2 text-xs shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Should I go?</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-xs text-rose-700 font-medium">{error}</p>}
          </form>

          {isAnalyzing && (
            <div className="py-6 text-center space-y-2 animate-pulse">
              <Loader2 className="w-6 h-6 text-[#0c0a09] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#0c0a09]">{progressMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* MANUAL FALLBACK FORM (When URL page extraction fails) */}
      {showManualForm && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-serif text-[#0c0a09]">We couldn’t read this event page</h2>
            <p className="text-xs text-[#777169]">Paste or enter the event details manually to calculate your recommendation.</p>
          </div>

          <form onSubmit={handleManualFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0c0a09] block mb-1">Event Name *</label>
              <input
                type="text"
                required
                value={editedEvent?.title || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent!, title: e.target.value })}
                placeholder="e.g. AI Founder Summit"
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#0c0a09] block mb-1">Ticket Price ($)</label>
                <input
                  type="number"
                  placeholder="0 for free, leave blank if unknown"
                  value={editedEvent?.price ?? ''}
                  onChange={(e) =>
                    setEditedEvent({
                      ...editedEvent!,
                      price: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0c0a09] block mb-1">Event Category</label>
                <input
                  type="text"
                  placeholder="Conference, Workshop, Meetup, etc."
                  value={editedEvent?.eventType || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent!, eventType: e.target.value })}
                  className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#0c0a09] block mb-1">Location / Venue</label>
              <input
                type="text"
                placeholder="San Francisco, CA or Online"
                value={editedEvent?.location || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent!, location: e.target.value })}
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0c0a09] block mb-1">Short Description</label>
              <textarea
                rows={2}
                value={editedEvent?.description || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent!, description: e.target.value })}
                placeholder="Brief summary of topics or speakers..."
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setStep('INPUT');
                }}
                className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
              >
                Check another event
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

      {/* 2. EXTRACTION CONFIRMATION STEP ("Does this look right?") */}
      {step === 'REVIEW' && editedEvent && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4">
            <div>
              <h2 className="text-2xl font-serif text-[#0c0a09]">Does this look right?</h2>
              <p className="text-xs text-[#777169]">Review extracted details before receiving your recommendation score.</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-full border border-[#e7e5e4] text-xs font-medium text-[#0c0a09] hover:bg-[#fafafa] flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit details'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <span className="font-semibold text-[#777169] uppercase tracking-wider text-[11px]">Event Title</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedEvent.title}
                  onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                  className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg p-2 font-bold text-[#0c0a09]"
                />
              ) : (
                <div className="font-bold text-[#0c0a09] text-base">{editedEvent.title}</div>
              )}
            </div>

            {/* Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Date & Time */}
              <div className={`p-3 rounded-xl border ${!editedEvent.startDate ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <span className="font-semibold text-[#777169] block mb-1">Date & Time</span>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={editedEvent.startDate || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, startDate: e.target.value || null })}
                    className="w-full bg-white border border-[#e7e5e4] rounded p-1 text-xs"
                  />
                ) : (
                  <div className="font-bold text-[#0c0a09]">
                    {editedEvent.startDate ? formatEventDate(editedEvent.startDate) : <span className="text-amber-800 font-semibold">Unlisted / Missing</span>}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className={`p-3 rounded-xl border ${editedEvent.price === null ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <span className="font-semibold text-[#777169] block mb-1">Ticket Price</span>
                {isEditing ? (
                  <input
                    type="number"
                    placeholder="Price in $"
                    value={editedEvent.price ?? ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, price: e.target.value === '' ? null : Number(e.target.value) })}
                    className="w-full bg-white border border-[#e7e5e4] rounded p-1 text-xs"
                  />
                ) : (
                  <div className="font-bold text-[#0c0a09]">
                    {editedEvent.price !== null ? formatEventPrice(editedEvent.price) : <span className="text-amber-800 font-semibold">Unlisted / Missing</span>}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className={`p-3 rounded-xl border ${!editedEvent.location ? 'bg-amber-50/60 border-amber-200' : 'bg-[#f5f5f5] border-[#e7e5e4]'}`}>
                <span className="font-semibold text-[#777169] block mb-1">Location</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedEvent.location || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value || null })}
                    className="w-full bg-white border border-[#e7e5e4] rounded p-1 text-xs"
                  />
                ) : (
                  <div className="font-bold text-[#0c0a09]">
                    {editedEvent.location || <span className="text-amber-800 font-semibold">Unlisted / Missing</span>}
                  </div>
                )}
              </div>

              {/* Event Type */}
              <div className="p-3 rounded-xl bg-[#f5f5f5] border border-[#e7e5e4]">
                <span className="font-semibold text-[#777169] block mb-1">Category / Format</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedEvent.eventType || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, eventType: e.target.value })}
                    className="w-full bg-white border border-[#e7e5e4] rounded p-1 text-xs"
                  />
                ) : (
                  <div className="font-bold text-[#0c0a09]">{editedEvent.eventType || 'Event'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
            <button
              onClick={() => setStep('INPUT')}
              className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
            >
              Cancel
            </button>

            <button
              onClick={() => setStep('GOAL')}
              className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-2"
            >
              <span>Continue to Goal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. PER-EVENT GOAL SELECTION STEP */}
      {step === 'GOAL' && editedEvent && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div className="space-y-1 border-b border-[#e7e5e4] pb-4">
            <h2 className="text-2xl font-serif text-[#0c0a09]">What are you hoping to get from this event?</h2>
            <p className="text-xs text-[#777169]">Select your primary goal for attending <span className="font-bold text-[#0c0a09]">{editedEvent.title}</span>.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalsList.map((g) => (
              <button
                key={g.label}
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
              onClick={() => setStep('REVIEW')}
              className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
            >
              Back to details
            </button>

            <button
              onClick={handleCalculateRecommendation}
              className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-2"
            >
              <span>Get Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. SIMPLIFIED RECOMMENDATION RESULT SCREEN */}
      {step === 'RESULT' && editedEvent && recommendation && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header: Large GO/MAYBE/SKIP & Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Badge decision={recommendation.decision} size="lg" />
                  <span className="text-2xl font-black font-mono text-[#0c0a09]">
                    {recommendation.score}<span className="text-sm font-semibold text-[#777169]">/100</span>
                  </span>
                </div>
                <h2 className="text-xl font-serif text-[#0c0a09] pt-2">{editedEvent.title}</h2>
              </div>

              <div className="text-xs text-[#777169] bg-[#f5f5f5] px-3 py-1.5 rounded-full border border-[#e7e5e4] self-start sm:self-center">
                Confidence: <span className="font-bold text-[#0c0a09]">{recommendation.confidence}</span>
              </div>
            </div>

            {/* Bottom Line Summary */}
            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#777169]">Bottom line</span>
              <p className="text-sm font-medium text-[#0c0a09] leading-snug">{recommendation.bottomLine}</p>
            </div>

            {/* Supporting Factors & Concern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supporting Factors */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0c0a09] uppercase tracking-wider">Why this recommendation</h4>
                <ul className="space-y-1.5 text-xs text-[#4e4e4e]">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Watch out concern */}
              {recommendation.concerns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Watch out</h4>
                  <ul className="space-y-1.5 text-xs text-[#4e4e4e]">
                    {recommendation.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Primary Action Buttons (Requirement 7: Explicit Save) */}
            <div className="pt-4 border-t border-[#e7e5e4] space-y-3">
              {actionDone ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{actionDone}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={editedEvent.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09] text-xs font-semibold rounded-full border border-[#e7e5e4] transition-colors flex items-center gap-1.5"
                  >
                    <span>View event</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleExplicitSave('Considering')}
                    className="px-4 py-2.5 bg-white hover:bg-[#fafafa] text-[#0c0a09] text-xs font-semibold rounded-full border border-[#d6d3d1] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save for later</span>
                  </button>

                  <button
                    onClick={() => handleExplicitSave('Attending')}
                    className="px-5 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>I’m going</span>
                  </button>

                  <button
                    onClick={handleNotForMe}
                    className="px-4 py-2.5 text-xs text-[#777169] hover:text-[#0c0a09] font-medium transition-colors ml-auto"
                  >
                    Not for me
                  </button>
                </div>
              )}
            </div>

            {/* Collapsed Detailed Scoring ("Why this score ▾") */}
            <div className="pt-2">
              <button
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c0a09] hover:underline"
              >
                <span>Why this score</span>
                {showScoreBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showScoreBreakdown && (
                <div className="mt-4 animate-fade-in">
                  <ScoreCard score={recommendation.score} breakdown={recommendation.scoringBreakdown} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
