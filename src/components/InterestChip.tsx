import React from 'react';
import { InterestType } from '../types';

interface InterestChipProps {
  label: InterestType;
  isSelected: boolean;
  onToggle: (interest: InterestType) => void;
}

export const ALL_INTERESTS: InterestType[] = [
  'AI',
  'Startups',
  'Design',
  'Technology',
  'Film',
  'Music',
  'Outdoors',
  'Networking',
  'Food',
  'Sports',
];

export const InterestChip: React.FC<InterestChipProps> = ({ label, isSelected, onToggle }) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(label)}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2 select-none ${
        isSelected
          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20 scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
      <span>{label}</span>
    </button>
  );
};
