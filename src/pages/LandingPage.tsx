import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Target, Zap, Link2 } from 'lucide-react';
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
    { title: 'UX Design Masterclass', url: 'https://designacademy.org/workshops/ux-intensive' },
    { title: 'Austin Music Fest', url: 'https://austin-festivals.com/indie-soundscapes' },
  ];

  return (
    <div className="space-y-16 py-12 sm:py-20">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>Cal.com Inspired Event Decision Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.08]">
          Never waste time on the{' '}
          <span className="underline underline-offset-8 decoration-gray-300">
            wrong events
          </span>{' '}
          again.
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Paste any public event URL. We evaluate actual facts against your budget, schedule, interests, and attendance goals to give a clear recommendation:{' '}
          <span className="font-bold text-emerald-700">Go</span>,{' '}
          <span className="font-bold text-amber-700">Maybe</span>, or{' '}
          <span className="font-bold text-rose-700">Skip</span>.
        </p>

        {/* URL Input Form */}
        <form onSubmit={handleQuickAnalyze} className="max-w-xl mx-auto space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-xl border border-gray-300 focus-within:border-black shadow-sm transition-all">
            <div className="relative flex-1 flex items-center">
              <Link2 className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste event link (e.g. https://eventbrite.com/e/123456)"
                className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-5 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 text-xs"
            >
              <span>Analyze Event</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </form>

        {/* Example URL Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 pt-1">
          <span className="text-gray-400 font-medium">Try example:</span>
          {exampleUrls.map((ex) => (
            <button
              key={ex.title}
              onClick={() => {
                setUrl(ex.url);
                setError('');
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md text-gray-800 transition-colors text-[11px] font-medium"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </section>

      {/* Onboarding Banner Callout */}
      {!hasCompletedOnboarding && (
        <section className="max-w-3xl mx-auto px-4">
          <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-gray-900 text-base">Set up your decision preferences first</h3>
              <p className="text-xs text-gray-600">
                Define your target interests, max ticket budget, and primary attendance goal for accurate scoring.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-sm shrink-0 transition-colors flex items-center gap-1.5"
            >
              <span>Setup Profile (1 min)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 3 Core Feature Cards (Cal.com light gray card surfaces) */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-black flex items-center justify-center shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Deterministic TypeScript Engine</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Transparent scoring across interest match, budget ceiling, goal alignment, timing, and novelty.
          </p>
        </div>

        <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-black flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Gemini Fact Extraction</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Gemini reads page facts (title, date, venue, price) into structured JSON without hallucinating.
          </p>
        </div>

        <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-black flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Anonymous RLS Security</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Instant anonymous account session. Row Level Security guarantees your preferences remain private.
          </p>
        </div>
      </section>
    </div>
  );
};
