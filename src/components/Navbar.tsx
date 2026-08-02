import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Calendar, Settings, Activity, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { userId, hasCompletedOnboarding } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-gray-900 group-hover:text-black transition-colors">
              Should I Go?
            </span>
          </div>
        </Link>

        {/* Navigation Links - Cal.com Pill Group */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-gray-100/80 p-1 rounded-full border border-gray-200/80">
          <Link
            to="/analyze"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/analyze')
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Analyze</span>
          </Link>

          <Link
            to="/events"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/events')
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black hover:bg-white/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-gray-700" />
            <span>Saved</span>
          </Link>

          <Link
            to={hasCompletedOnboarding ? '/settings' : '/onboarding'}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/settings') || isActive('/onboarding')
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black hover:bg-white/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-gray-700" />
            <span className="hidden sm:inline">Preferences</span>
          </Link>

          <Link
            to="/evals"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/evals')
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-black hover:bg-white/50'
            }`}
            title="Developer Evals Harness"
          >
            <Activity className="w-3.5 h-3.5 text-gray-600" />
            <span className="hidden md:inline text-[11px] font-semibold">Evals</span>
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/analyze"
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            New Scan
          </Link>
        </div>
      </div>
    </header>
  );
};
