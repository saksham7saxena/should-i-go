import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Calendar, Settings, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { userId, hasCompletedOnboarding } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Should I Go?
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 -mt-1">
              Event Decision Assistant
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/analyze"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/analyze')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Analyze URL</span>
          </Link>

          <Link
            to="/events"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/events')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Saved</span>
          </Link>

          <Link
            to={hasCompletedOnboarding ? '/settings' : '/onboarding'}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/settings') || isActive('/onboarding')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Preferences</span>
          </Link>

          <Link
            to="/evals"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/evals')
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Developer Accuracy Evaluation Benchmark"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline text-xs uppercase tracking-wider font-semibold">Evals</span>
          </Link>

          {/* Anonymous Auth Badge */}
          {userId && (
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]" title={`Supabase Anonymous ID: ${userId}`}>
                Anon User
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
