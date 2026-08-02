import React from 'react';
import { Compass, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#101010] text-gray-400 py-12 px-4 sm:px-6 border-t border-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Should I Go?</span>
          </div>
          <p className="text-xs text-gray-500">
            Personalized, deterministic event decision tool powered by Gemini API & RLS.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anonymous RLS Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Deterministic Scoring Algorithm</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
