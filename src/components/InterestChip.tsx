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
      aria-pressed={isSelected}
      onClick={() => onToggle(label)}
      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0a09] ${
        isSelected
          ? 'bg-[#0c0a09] border-[#0c0a09] text-white shadow-xs'
          : 'bg-white border-[#e7e5e4] text-[#4e4e4e] hover:bg-[#fafafa] hover:border-[#d6d3d1]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#a8a29e]'}`} />
      <span>{label}</span>
    </button>
  );
};
