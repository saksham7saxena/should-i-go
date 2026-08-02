import React from 'react';
import { Link } from 'react-router-dom';
import { RecommendationRecord, EventStatusType } from '../types';
import { Badge } from './Badge';
import { formatEventDate, formatEventPrice } from '../lib/urlParser';
import { Calendar, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

interface EventCardProps {
  recommendation: RecommendationRecord;
  onStatusChange?: (recId: string, newStatus: EventStatusType) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ recommendation, onStatusChange }) => {
  const event = recommendation.event;
  if (!event) return null;

  const statuses: EventStatusType[] = ['Considering', 'Attending', 'Skipped', 'Attended'];

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between group">
      <div>
        {/* Header: Badge & Score */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge decision={recommendation.decision} size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Score</span>
            <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              {recommendation.score}/100
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>

        {/* Event Details */}
        <div className="space-y-1.5 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{formatEventDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{event.location || 'Location TBA'}</span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-emerald-400">{formatEventPrice(event.price)}</span>
          </div>
        </div>

        {/* Strongest Reason */}
        <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 line-clamp-2">
          "{recommendation.reasons[0] || 'Good alignment with your attendance goals.'}"
        </p>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <select
          value={recommendation.status}
          onChange={(e) => onStatusChange?.(recommendation.id, e.target.value as EventStatusType)}
          className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Detail Link */}
        <Link
          to={`/events/${recommendation.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
