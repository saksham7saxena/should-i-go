import React from 'react';
import { Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#f5f5f5] text-[#777169] py-12 px-4 sm:px-6 border-t border-[#e7e5e4]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-xs">
              <Compass className="w-3 h-3 text-white" />
            </div>
            <span className="font-serif text-base text-[#0c0a09]">Should I Go?</span>
          </div>
          <p className="text-xs text-[#777169]">
            A structured decision assistant for evaluating public event details against your personal budget and goals.
          </p>
        </div>

        <div className="text-xs text-[#a8a29e] space-y-1">
          <p>© {new Date().getFullYear()} Should I Go? • All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};
