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
      color: 'bg-[#0c0a09]',
    },
    {
      label: 'Goal Alignment',
      score: breakdown.goalMatchScore,
      max: 25,
      icon: Target,
      color: 'bg-stone-700',
    },
    {
      label: 'Price Fit',
      score: breakdown.priceFitScore,
      max: 20,
      icon: DollarSign,
      color: 'bg-emerald-700',
    },
    {
      label: 'Timing & Schedule',
      score: breakdown.timingFitScore,
      max: 10,
      icon: Clock,
      color: 'bg-amber-700',
    },
    {
      label: 'Novelty & Discovery',
      score: breakdown.noveltyScore,
      max: 10,
      icon: Sparkles,
      color: 'bg-blue-700',
    },
  ];

  return (
    <div className="bg-white border border-[#e7e5e4] rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-4 mb-5">
        <div>
          <h4 className="text-sm font-bold text-[#0c0a09]">Score Breakdown</h4>
          <p className="text-xs text-[#777169]">Deterministic evaluation across 5 categories</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-[#0c0a09] font-mono">
            {score}
          </span>
          <span className="text-xs font-semibold text-[#777169]"> / 100</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {metrics.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(100, Math.round((item.score / item.max) * 100));
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#4e4e4e] font-medium">
                  <Icon className="w-3.5 h-3.5 text-[#777169]" />
                  <span>{item.label}</span>
                </div>
                <div className="font-mono text-[#777169] text-xs">
                  <span className="font-bold text-[#0c0a09]">{item.score}</span> / {item.max} pts
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#f0efed] overflow-hidden">
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
