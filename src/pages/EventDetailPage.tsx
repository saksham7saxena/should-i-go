import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSavedRecommendations, updateRecommendationStatus } from '../lib/supabase';
import { RecommendationRecord, EventStatusType } from '../types';
import { Badge } from '../components/Badge';
import { ScoreCard } from '../components/ScoreCard';
import { FeedbackModal } from '../components/FeedbackModal';
import { formatEventDate, formatEventPrice } from '../lib/urlParser';
import {
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Code2,
  Tag,
  Users,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [recommendation, setRecommendation] = useState<RecommendationRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  useEffect(() => {
    async function loadDetail() {
      if (!userId || !id) return;
      setIsLoading(true);
      try {
        const saved = await fetchSavedRecommendations(userId);
        const match = saved.find((r) => r.id === id);
        if (match) {
          setRecommendation(match);
        }
      } catch (err) {
        console.error('Error loading event detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [userId, id]);

  const handleStatusChange = async (newStatus: EventStatusType) => {
    if (!recommendation) return;
    setRecommendation({ ...recommendation, status: newStatus });
    await updateRecommendationStatus(recommendation.id, newStatus);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading recommendation details...</p>
      </div>
    );
  }

  if (!recommendation || !recommendation.event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <p className="text-xs text-slate-400">The recommendation record you requested could not be located.</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </Link>
      </div>
    );
  }

  const event = recommendation.event;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </button>

        {/* Status Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={recommendation.status}
            onChange={(e) => handleStatusChange(e.target.value as EventStatusType)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none cursor-pointer"
          >
            {(['Considering', 'Attending', 'Skipped', 'Attended'] as EventStatusType[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge decision={recommendation.decision} size="lg" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Confidence: {recommendation.confidence}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white pt-2 leading-tight">
              {event.title}
            </h1>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shrink-0">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Score</span>
            <span className="text-3xl font-black text-indigo-400 font-mono">
              {recommendation.score}<span className="text-sm font-semibold text-slate-400">/100</span>
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Date & Time</span>
            </div>
            <div className="font-bold text-slate-200">{formatEventDate(event.start_date)}</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Location</span>
            </div>
            <div className="font-bold text-slate-200">{event.location || 'Location Unspecified'}</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Price / Category</span>
            </div>
            <div className="font-bold text-emerald-400">
              {formatEventPrice(event.price)} • {event.event_type || 'Event'}
            </div>
          </div>
        </div>

        {/* Topics & Speakers */}
        {((event.topics && event.topics.length > 0) || (event.speakers_or_performers && event.speakers_or_performers.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {event.topics?.map((t) => (
              <span key={t} className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-semibold">
                #{t}
              </span>
            ))}
            {event.speakers_or_performers?.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>{s}</span>
              </span>
            ))}
          </div>
        )}

        {/* Reasons & Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Positive Attendance Reasons</span>
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

        {/* Bottom Actions: Feedback Modal Trigger & Original Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Provide Attendance & Accuracy Feedback</span>
          </button>

          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Visit Event Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Score Breakdown Card */}
      <ScoreCard score={recommendation.score} breakdown={recommendation.scoring_breakdown} />

      {/* Raw Extracted JSON Inspector Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-400" />
            <span>Inspect Extracted Event JSON Payload</span>
          </div>
          <span>{showRawJson ? 'Hide Payload' : 'Show Payload'}</span>
        </button>

        {showRawJson && (
          <pre className="mt-3 p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(event.extracted_data || event, null, 2)}
          </pre>
        )}
      </div>

      {/* Feedback Modal Dialog */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        recommendationId={recommendation.id}
      />
    </div>
  );
};
