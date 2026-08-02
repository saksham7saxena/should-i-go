import React from 'react';
import { ScoreBreakdown } from '../types';
import { Target, DollarSign, Clock, Sparkles, Heart } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  breakdown: ScoreBreakdown;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, breakdown }) => {
  const metrics = [
    {
      label: 'Interest Match',
      score: breakdown.interestMatchScore,
      max: 35,
      icon: Heart,
      color: 'bg-black',
    },
    {
      label: 'Goal Alignment',
      score: breakdown.goalMatchScore,
      max: 25,
      icon: Target,
      color: 'bg-gray-800',
    },
    {
      label: 'Price Fit',
      score: breakdown.priceFitScore,
      max: 20,
      icon: DollarSign,
      color: 'bg-emerald-600',
    },
    {
      label: 'Timing & Schedule',
      score: breakdown.timingFitScore,
      max: 10,
      icon: Clock,
      color: 'bg-amber-600',
    },
    {
      label: 'Novelty & Discovery',
      score: breakdown.noveltyScore,
      max: 10,
      icon: Sparkles,
      color: 'bg-blue-600',
    },
  ];

  return (
    <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">Scoring Breakdown</h3>
          <p className="text-xs text-gray-500">Deterministic evaluation across 5 categories</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-black">
            {score}
          </span>
          <span className="text-sm font-semibold text-gray-500"> / 100</span>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(100, Math.round((item.score / item.max) * 100));
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{item.label}</span>
                </div>
                <div className="font-mono text-gray-500 text-xs">
                  <span className="font-bold text-gray-900">{item.score}</span> / {item.max} pts
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
