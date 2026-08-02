import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSavedRecommendations, updateRecommendationStatus } from '../lib/supabase';
import { RecommendationRecord, EventStatusType } from '../types';
import { EventCard } from '../components/EventCard';
import { Calendar, Sparkles, Filter, Loader2, BookmarkPlus } from 'lucide-react';

export const EventsListPage: React.FC = () => {
  const { userId } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const handleStatusChange = async (recId: string, newStatus: EventStatusType) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
    );
    await updateRecommendationStatus(recId, newStatus);
  };

  const filteredItems = recommendations.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const filterTabs = [
    { key: 'ALL', label: 'All Saved' },
    { key: 'Considering', label: 'Considering' },
    { key: 'Attending', label: 'Attending' },
    { key: 'Skipped', label: 'Skipped' },
    { key: 'Attended', label: 'Attended' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Top Title & Quick Analyze Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-white">Your Saved Events</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track decisions, update attendance status, and log post-event feedback.
          </p>
        </div>

        <Link
          to="/analyze"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze New Event</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === tab.key
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid / Loading / Empty */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your saved recommendations...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <BookmarkPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No saved events found</h3>
            <p className="text-xs text-slate-400">
              {filterStatus === 'ALL'
                ? "You haven't saved any event recommendations yet."
                : `No events currently marked as ${filterStatus}.`}
            </p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Your First Event</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((rec) => (
            <EventCard key={rec.id} recommendation={rec} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};
