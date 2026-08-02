import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSavedRecommendations, setEventStatus, recordFeedback } from '../lib/supabase';
import { RecommendationRecord, AppEventStatus } from '../types';
import { Badge } from '../components/Badge';
import { formatEventDate, formatEventPrice } from '../lib/urlParser';
import { Calendar, MapPin, Loader2, BookmarkPlus, Check, Star, ArrowRight } from 'lucide-react';

export const EventsListPage: React.FC = () => {
  const { userId } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // In-line feedback state per recommendation ID
  const [feedbackAnswered, setFeedbackAnswered] = useState<Record<string, { worthIt?: boolean; rating?: number; done?: boolean }>>({});

  useEffect(() => {
    async function loadSaved() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await fetchSavedRecommendations(userId);
        setRecommendations(data);
      } catch (err) {
        console.error('Error loading saved events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSaved();
  }, [userId]);

  const handleStatusChange = async (rec: RecommendationRecord, newStatus: AppEventStatus) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, status: newStatus } : r))
    );
    if (userId && rec.event_id) {
      await setEventStatus(rec.event_id, rec.id, newStatus, userId);
    }
  };

  const handleInlineWorthIt = async (rec: RecommendationRecord, worthIt: boolean | null) => {
    if (!userId) return;
    if (worthIt === null) {
      // "I didn't attend"
      await recordFeedback(userId, rec.id, { attended: false, worth_it: false });
      await handleStatusChange(rec, 'skipped');
      setFeedbackAnswered((prev) => ({ ...prev, [rec.id]: { done: true } }));
    } else {
      await recordFeedback(userId, rec.id, { attended: true, worth_it: worthIt });
      await handleStatusChange(rec, 'attended');
      setFeedbackAnswered((prev) => ({ ...prev, [rec.id]: { worthIt, done: false } }));
    }
  };

  const handleRatingSubmit = async (recId: string, rating: number) => {
    if (!userId) return;
    const prevWorthIt = feedbackAnswered[recId]?.worthIt ?? true;
    await recordFeedback(userId, recId, { attended: true, worth_it: prevWorthIt, accuracy_rating: rating });
    setFeedbackAnswered((prev) => ({ ...prev, [recId]: { ...prev[recId], rating, done: true } }));
  };

  const now = Date.now();

  const upcomingEvents = recommendations.filter((r) => {
    if (!r.event?.start_date) return true;
    const d = new Date(r.event.start_date).getTime();
    return isNaN(d) || d >= now;
  });

  const pastEvents = recommendations.filter((r) => {
    if (!r.event?.start_date) return false;
    const d = new Date(r.event.start_date).getTime();
    return !isNaN(d) && d < now;
  });

  const currentList = activeTab === 'UPCOMING' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
        <div>
          <h1 className="text-3xl font-serif text-[#0c0a09]">Saved Events</h1>
          <p className="text-xs text-[#777169] mt-1">Manage your saved recommendations and log post-event feedback.</p>
        </div>

        <Link
          to="/"
          className="px-5 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-[#ffffff] font-semibold text-xs rounded-full shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <span>Check an event</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e7e5e4] pb-2">
        <button
          type="button"
          aria-pressed={activeTab === 'UPCOMING'}
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-[#0c0a09] text-white shadow-xs'
              : 'text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]/50'
          }`}
        >
          Upcoming ({upcomingEvents.length})
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'PAST'}
          onClick={() => setActiveTab('PAST')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'PAST'
              ? 'bg-[#0c0a09] text-white shadow-xs'
              : 'text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#e7e5e4]/50'
          }`}
        >
          Past Events ({pastEvents.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#0c0a09] animate-spin mx-auto" />
          <p className="text-xs text-[#777169]">Loading your saved events...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center mx-auto">
            <BookmarkPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-serif text-[#0c0a09]">No {activeTab.toLowerCase()} saved events</h2>
            <p className="text-xs text-[#777169]">
              {activeTab === 'UPCOMING'
                ? "You haven't saved any upcoming event recommendations yet."
                : "No past saved events recorded yet."}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full transition-all"
          >
            <span>Paste an event</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((rec) => {
            const event = rec.event;
            if (!event) return null;

            const fbState = feedbackAnswered[rec.id];

            return (
              <div
                key={rec.id}
                className="bg-white border border-[#e7e5e4] hover:border-[#d6d3d1] rounded-2xl p-6 transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge decision={rec.decision} size="sm" />

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0c0a09] bg-[#f5f5f5] px-2 py-0.5 rounded-full border border-[#e7e5e4]">
                        {rec.score}/100
                      </span>

                      <select
                        aria-label="Event Status"
                        value={rec.status || 'considering'}
                        onChange={(e) => handleStatusChange(rec, e.target.value as AppEventStatus)}
                        className="bg-[#f5f5f5] text-[#0c0a09] text-xs rounded-full border border-[#e7e5e4] px-3 py-1 font-semibold focus:outline-none focus:border-[#0c0a09] cursor-pointer"
                      >
                        <option value="considering">Considering</option>
                        <option value="going">Going</option>
                        <option value="attended">Attended</option>
                        <option value="skipped">Skipped</option>
                      </select>
                    </div>
                  </div>

                  <Link to={`/events/${rec.id}`} className="block group">
                    <h3 className="font-serif text-lg text-[#0c0a09] group-hover:underline leading-snug">
                      {event.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#777169]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0c0a09]" />
                      <span>{formatEventDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0c0a09]" />
                      <span>{event.location || 'Location unlisted'}</span>
                    </div>
                    <span className="font-bold text-[#0c0a09] ml-auto">{formatEventPrice(event.price)}</span>
                  </div>

                  <p className="text-xs text-[#4e4e4e] bg-[#f5f5f5] p-3 rounded-xl border border-[#e7e5e4] line-clamp-2">
                    "{rec.bottom_line || rec.reasons[0] || 'Good alignment with your goals.'}"
                  </p>
                </div>

                {/* Inline Post-Event Feedback */}
                {activeTab === 'PAST' && (
                  <div className="pt-3 border-t border-[#e7e5e4] space-y-3">
                    {!fbState ? (
                      <div className="bg-[#f5f5f5] p-3 rounded-xl border border-[#e7e5e4] space-y-2">
                        <span className="text-xs font-bold text-[#0c0a09] block">
                          Was this event worth going to?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInlineWorthIt(rec, true)}
                            className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full hover:bg-stone-800"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInlineWorthIt(rec, false)}
                            className="px-3 py-1 bg-white border border-[#e7e5e4] text-[#0c0a09] text-xs font-semibold rounded-full hover:bg-gray-50"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInlineWorthIt(rec, null)}
                            className="px-3 py-1 text-xs text-[#777169] hover:text-[#0c0a09] ml-auto"
                          >
                            I didn’t attend
                          </button>
                        </div>
                      </div>
                    ) : !fbState.done ? (
                      <div className="bg-[#f5f5f5] p-3 rounded-xl border border-[#e7e5e4] space-y-2">
                        <span className="text-xs font-bold text-[#0c0a09] block">
                          Recommendation accuracy rating (1–5):
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              aria-label={`${star} out of 5 stars`}
                              onClick={() => handleRatingSubmit(rec.id, star)}
                              className="p-1 hover:scale-125 transition-transform"
                            >
                              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Feedback logged. Thank you!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
