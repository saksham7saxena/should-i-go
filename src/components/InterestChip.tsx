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
      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 select-none ${
        isSelected
          ? 'bg-black border-black text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-400'}`} />
      <span>{label}</span>
    </button>
  );
};
