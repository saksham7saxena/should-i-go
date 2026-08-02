import React from 'react';
import { Link } from 'react-router-dom';
import { RecommendationRecord, AppEventStatus } from '../types';
import { Badge } from './Badge';
import { formatEventDate, formatEventPrice } from '../lib/urlParser';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface EventCardProps {
  recommendation: RecommendationRecord;
  onStatusChange?: (recId: string, newStatus: AppEventStatus) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ recommendation, onStatusChange }) => {
  const event = recommendation.event;
  if (!event) return null;

  const statuses: AppEventStatus[] = ['considering', 'going', 'attended', 'skipped', 'dismissed'];

  return (
    <div className="bg-white border border-[#e7e5e4] hover:border-[#d6d3d1] rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge decision={recommendation.decision} size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#777169] font-medium">Score</span>
            <span className="font-mono text-xs font-bold text-[#0c0a09] bg-[#f5f5f5] px-2 py-0.5 rounded-full border border-[#e7e5e4]">
              {recommendation.score}/100
            </span>
          </div>
        </div>

        <h3 className="font-serif font-bold text-base text-[#0c0a09] group-hover:underline leading-snug mb-2">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-xs text-[#777169] mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0c0a09] shrink-0" />
            <span className="truncate">{formatEventDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0c0a09] shrink-0" />
            <span className="truncate">{event.location || 'Location unlisted'}</span>
            <span>•</span>
            <span className="font-semibold text-emerald-800">{formatEventPrice(event.price)}</span>
          </div>
        </div>

        <p className="text-xs text-[#4e4e4e] bg-[#f5f5f5] p-3 rounded-xl border border-[#e7e5e4] mb-4 line-clamp-2">
          "{recommendation.bottom_line || recommendation.reasons[0] || 'Good alignment with your goals.'}"
        </p>
      </div>

      <div className="pt-3 border-t border-[#e7e5e4] flex items-center justify-between gap-2">
        <select
          value={recommendation.status || 'considering'}
          onChange={(e) => onStatusChange?.(recommendation.id, e.target.value as AppEventStatus)}
          className="bg-[#f5f5f5] text-[#0c0a09] text-xs rounded-full border border-[#e7e5e4] px-3 py-1 font-semibold focus:outline-none focus:border-[#0c0a09] cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <Link
          to={`/events/${recommendation.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0c0a09] hover:underline transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
