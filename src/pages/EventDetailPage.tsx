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
        <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
        <p className="text-xs text-gray-500">Loading recommendation details...</p>
      </div>
    );
  }

  if (!recommendation || !recommendation.event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
        <p className="text-xs text-gray-500">The recommendation record requested could not be located.</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </Link>
      </div>
    );
  }

  const event = recommendation.event;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-gray-900">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-black font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Saved Events</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={recommendation.status}
            onChange={(e) => handleStatusChange(e.target.value as EventStatusType)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-md px-3 py-1 font-bold focus:outline-none focus:border-black cursor-pointer"
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge decision={recommendation.decision} size="lg" />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                Confidence: {recommendation.confidence}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 pt-2 leading-tight">
              {event.title}
            </h1>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-[#f5f5f5] px-5 py-3 rounded-xl border border-gray-200 shrink-0">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Score</span>
            <span className="text-3xl font-black text-black font-mono">
              {recommendation.score}<span className="text-sm font-semibold text-gray-500">/100</span>
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-gray-700" />
              <span>Date & Time</span>
            </div>
            <div className="font-bold text-gray-900">{formatEventDate(event.start_date)}</div>
          </div>

          <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-gray-700" />
              <span>Location</span>
            </div>
            <div className="font-bold text-gray-900">{event.location || 'Location Unspecified'}</div>
          </div>

          <div className="bg-[#f5f5f5] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
              <Tag className="w-3.5 h-3.5 text-gray-700" />
              <span>Price / Category</span>
            </div>
            <div className="font-bold text-gray-900">
              {formatEventPrice(event.price)} • {event.event_type || 'Event'}
            </div>
          </div>
        </div>

        {/* Topics & Speakers */}
        {((event.topics && event.topics.length > 0) || (event.speakers_or_performers && event.speakers_or_performers.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {event.topics?.map((t) => (
              <span key={t} className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-gray-800 text-xs font-semibold">
                #{t}
              </span>
            ))}
            {event.speakers_or_performers?.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-gray-800 text-xs flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-500" />
                <span>{s}</span>
              </span>
            ))}
          </div>
        )}

        {/* Reasons & Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-[#f5f5f5] p-5 rounded-xl border border-gray-200">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Positive Attendance Reasons</span>
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

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-xs rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-black" />
            <span>Provide Attendance & Accuracy Feedback</span>
          </button>

          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-900 hover:text-black font-semibold underline"
          >
            <span>Visit Event Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Score Breakdown Card */}
      <ScoreCard score={recommendation.score} breakdown={recommendation.scoring_breakdown} />

      {/* Raw Extracted JSON Inspector */}
      <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-4">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-black"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-gray-800" />
            <span>Inspect Extracted Event JSON Payload</span>
          </div>
          <span>{showRawJson ? 'Hide Payload' : 'Show Payload'}</span>
        </button>

        {showRawJson && (
          <pre className="mt-3 p-4 bg-white rounded-lg text-[11px] font-mono text-gray-800 overflow-x-auto border border-gray-200">
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
