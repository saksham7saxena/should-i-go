import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSavedRecommendations, setEventStatus } from '../lib/supabase';
import { RecommendationRecord, AppEventStatus } from '../types';
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

  const handleStatusChange = async (newStatus: AppEventStatus) => {
    if (!recommendation || !userId) return;
    setRecommendation({ ...recommendation, status: newStatus });
    await setEventStatus(recommendation.event_id, recommendation.id, newStatus, userId);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#0c0a09] animate-spin mx-auto" />
        <p className="text-xs text-[#777169]">Loading recommendation details...</p>
      </div>
    );
  }

  if (!recommendation || !recommendation.event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-serif text-[#0c0a09]">Event Not Found</h2>
        <p className="text-xs text-[#777169]">The recommendation record requested could not be located.</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c0a09] text-white text-xs font-semibold rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </Link>
      </div>
    );
  }

  const event = recommendation.event;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 text-xs text-[#777169] hover:text-[#0c0a09] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#777169] font-medium">Status:</span>
          <select
            value={recommendation.status || 'considering'}
            onChange={(e) => handleStatusChange(e.target.value as AppEventStatus)}
            className="bg-[#f5f5f5] border border-[#e7e5e4] text-[#0c0a09] text-xs rounded-full px-3 py-1 font-bold focus:outline-none focus:border-[#0c0a09] cursor-pointer"
          >
            {(['considering', 'going', 'attended', 'skipped', 'dismissed'] as AppEventStatus[]).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge decision={recommendation.decision} size="lg" />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#0c0a09] border border-[#e7e5e4]">
                Confidence: {recommendation.confidence}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#0c0a09] pt-2 leading-tight">
              {event.title}
            </h1>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-[#f5f5f5] px-5 py-3 rounded-xl border border-[#e7e5e4] shrink-0">
            <span className="text-xs text-[#777169] font-bold uppercase tracking-wider">Total Score</span>
            <span className="text-3xl font-black text-[#0c0a09] font-mono">
              {recommendation.score}<span className="text-sm font-semibold text-[#777169]">/100</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#f5f5f5] p-3.5 rounded-xl border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#777169] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#0c0a09]" />
              <span>Date & Time</span>
            </div>
            <div className="font-bold text-[#0c0a09]">{formatEventDate(event.start_date)}</div>
          </div>

          <div className="bg-[#f5f5f5] p-3.5 rounded-xl border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#777169] font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#0c0a09]" />
              <span>Location</span>
            </div>
            <div className="font-bold text-[#0c0a09]">{event.location || 'Location Unspecified'}</div>
          </div>

          <div className="bg-[#f5f5f5] p-3.5 rounded-xl border border-[#e7e5e4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#777169] font-semibold">
              <Tag className="w-3.5 h-3.5 text-[#0c0a09]" />
              <span>Price / Category</span>
            </div>
            <div className="font-bold text-[#0c0a09]">
              {formatEventPrice(event.price)} • {event.event_type || 'Event'}
            </div>
          </div>
        </div>

        {((event.topics && event.topics.length > 0) || (event.speakers_or_performers && event.speakers_or_performers.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {event.topics?.map((t) => (
              <span key={t} className="px-2.5 py-1 bg-[#f5f5f5] border border-[#e7e5e4] rounded-full text-[#0c0a09] text-xs font-semibold">
                #{t}
              </span>
            ))}
            {event.speakers_or_performers?.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-[#f5f5f5] border border-[#e7e5e4] rounded-full text-[#0c0a09] text-xs flex items-center gap-1">
                <Users className="w-3 h-3 text-[#777169]" />
                <span>{s}</span>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-[#f5f5f5] p-5 rounded-xl border border-[#e7e5e4]">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Why this recommendation</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#4e4e4e] font-medium">
              {recommendation.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 bg-[#f5f5f5] p-5 rounded-xl border border-[#e7e5e4]">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Watch out</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#4e4e4e] font-medium">
              {recommendation.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e7e5e4]">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09] font-semibold text-xs rounded-full border border-[#e7e5e4] transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-[#0c0a09]" />
            <span>Provide Attendance & Accuracy Feedback</span>
          </button>

          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#0c0a09] hover:underline font-semibold"
          >
            <span>Visit Event Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <ScoreCard score={recommendation.score} breakdown={recommendation.scoring_breakdown} />

      <div className="bg-[#f5f5f5] border border-[#e7e5e4] rounded-xl p-4">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center justify-between w-full text-xs font-semibold text-[#777169] hover:text-[#0c0a09]"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#0c0a09]" />
            <span>Inspect Extracted Event JSON Payload</span>
          </div>
          <span>{showRawJson ? 'Hide Payload' : 'Show Payload'}</span>
        </button>

        {showRawJson && (
          <pre className="mt-3 p-4 bg-white rounded-lg text-[11px] font-mono text-[#0c0a09] overflow-x-auto border border-[#e7e5e4]">
            {JSON.stringify(event.extracted_data || event, null, 2)}
          </pre>
        )}
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userId={userId || ''}
        recommendationId={recommendation.id}
        eventTitle={event.title}
      />
    </div>
  );
};
