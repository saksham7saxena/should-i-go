import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, ShieldCheck, Target, Zap, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidUrl } from '../lib/urlParser';

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { hasCompletedOnboarding } = useAuth();

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!isValidUrl(url)) {
      setError('Please enter a valid HTTP or HTTPS event URL.');
      return;
    }
    setError('');
    navigate(`/analyze?url=${encodeURIComponent(url.trim())}`);
  };

  const exampleUrls = [
    { title: 'Tech AI Summit', url: 'https://techcrunch.com/events/disrupt-2026' },
    { title: 'UX Design Workshop', url: 'https://designacademy.org/workshops/ux-intensive' },
    { title: 'Austin Music Fest', url: 'https://austin-festivals.com/indie-soundscapes' },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Structured Decision Tool • Powered by Gemini & RLS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Never waste time on the{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
            wrong events
          </span>{' '}
          again.
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Paste any public event URL. We analyze the facts against your personal budget, interests, schedule, and goals to give a clear recommendation:{' '}
          <span className="font-bold text-emerald-400">Go</span>,{' '}
          <span className="font-bold text-amber-400">Maybe</span>, or{' '}
          <span className="font-bold text-rose-400">Skip</span>.
        </p>

        {/* Quick URL Input Form */}
        <form onSubmit={handleQuickAnalyze} className="max-w-xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 focus-within:border-indigo-500 shadow-2xl transition-all">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste event link (e.g. https://eventbrite.com/e/123456)"
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 text-sm"
            >
              <span>Analyze Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        </form>

        {/* Example URL Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Try example:</span>
          {exampleUrls.map((ex) => (
            <button
              key={ex.title}
              onClick={() => {
                setUrl(ex.url);
                setError('');
              }}
              className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 transition-colors text-[11px]"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </section>

      {/* Onboarding Notice Callout if not done */}
      {!hasCompletedOnboarding && (
        <section className="max-w-3xl mx-auto px-4">
          <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-white text-base">Set up your decision profile first</h3>
              <p className="text-xs text-slate-300">
                Choose your interests, budget limit, preferred days, and main goal for accurate scoring.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shrink-0 transition-colors flex items-center gap-1.5"
            >
              <span>Setup Preferences (1 min)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Key Feature Pillars */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">Deterministic TypeScript Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scores are calculated strictly via standard algorithms across interest, budget, goal alignment, timing, and novelty.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">Gemini Fact Extraction</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gemini reads page facts (title, date, venue, price) into structured JSON without hallucinating or inventing missing facts.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">Anonymous RLS Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant anonymous account session. Row Level Security guarantees your preferences and saved events remain completely private.
          </p>
        </div>
      </section>
    </div>
  );
};
