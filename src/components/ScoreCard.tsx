import React from 'react';
import { ScoreBreakdown } from '../types';
import { Target, DollarSign, Clock, Sparkles, Heart } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  breakdown: ScoreBreakdown;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, breakdown }) => {
  const getScoreColor = (val: number) => {
    if (val >= 75) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (val >= 50) return 'from-amber-500 to-yellow-400 text-amber-400';
    return 'from-rose-500 to-red-400 text-rose-400';
  };

  const metrics = [
    {
      label: 'Interest Match',
      score: breakdown.interestMatchScore,
      max: 35,
      icon: Heart,
      color: 'bg-rose-500',
    },
    {
      label: 'Goal Alignment',
      score: breakdown.goalMatchScore,
      max: 25,
      icon: Target,
      color: 'bg-indigo-500',
    },
    {
      label: 'Price Fit',
      score: breakdown.priceFitScore,
      max: 20,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: 'Timing & Schedule',
      score: breakdown.timingFitScore,
      max: 10,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      label: 'Novelty & Discovery',
      score: breakdown.noveltyScore,
      max: 10,
      icon: Sparkles,
      color: 'bg-sky-500',
    },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-200">Scoring Breakdown</h3>
          <p className="text-xs text-slate-400">Deterministic algorithm evaluation across 5 categories</p>
        </div>
        <div className="text-right">
          <span className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
            {score}
          </span>
          <span className="text-sm font-semibold text-slate-400"> / 100</span>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(100, Math.round((item.score / item.max) * 100));
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <div className="font-mono text-slate-400 text-xs">
                  <span className="font-bold text-white">{item.score}</span> / {item.max} pts
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color}`}
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
