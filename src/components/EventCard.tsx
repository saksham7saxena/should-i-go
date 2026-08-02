import React from 'react';
import { Link } from 'react-router-dom';
import { RecommendationRecord, EventStatusType } from '../types';
import { Badge } from './Badge';
import { formatEventDate, formatEventPrice } from '../lib/urlParser';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface EventCardProps {
  recommendation: RecommendationRecord;
  onStatusChange?: (recId: string, newStatus: EventStatusType) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ recommendation, onStatusChange }) => {
  const event = recommendation.event;
  if (!event) return null;

  const statuses: EventStatusType[] = ['Considering', 'Attending', 'Skipped', 'Attended'];

  return (
    <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group">
      <div>
        {/* Header: Badge & Score */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge decision={recommendation.decision} size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Score</span>
            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
              {recommendation.score}/100
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-gray-900 group-hover:text-black transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>

        {/* Event Details */}
        <div className="space-y-1.5 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="truncate">{formatEventDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="truncate">{event.location || 'Location TBA'}</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-emerald-700">{formatEventPrice(event.price)}</span>
          </div>
        </div>

        {/* Reason snippet */}
        <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 line-clamp-2">
          "{recommendation.reasons[0] || 'Good alignment with your goals.'}"
        </p>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <select
          value={recommendation.status}
          onChange={(e) => onStatusChange?.(recommendation.id, e.target.value as EventStatusType)}
          className="bg-gray-50 text-gray-800 text-xs rounded-md border border-gray-200 px-2.5 py-1 font-medium focus:outline-none focus:border-black cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Link
          to={`/events/${recommendation.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-black transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
