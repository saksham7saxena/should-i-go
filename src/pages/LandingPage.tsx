import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidUrl, normalizeUrl } from '../lib/urlParser';
import { ArrowRight, Link2, Sparkles, Target, Zap, ShieldCheck } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { hasCompletedOnboarding } = useAuth();

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      setError('Please enter a valid HTTP or HTTPS event URL.');
      return;
    }
    setError('');

    const normUrl = normalizeUrl(trimmed);

    // Phase 10: Store pending event URL using key 'pendingEventUrl'
    if (!hasCompletedOnboarding) {
      sessionStorage.setItem('pendingEventUrl', normUrl);
      navigate('/onboarding');
    } else {
      navigate(`/analyze?url=${encodeURIComponent(normUrl)}`);
    }
  };

  const exampleUrls = [
    { title: 'Tech AI Summit', url: 'https://techcrunch.com/events/disrupt-2026' },
    { title: 'UX Design Intensive', url: 'https://designacademy.org/workshops/ux-intensive' },
    { title: 'Austin Music Fest', url: 'https://austin-festivals.com/indie-soundscapes' },
  ];

  return (
    <div className="space-y-16 py-12 sm:py-20 text-[#0c0a09]">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 px-4 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0efed] border border-[#e7e5e4] text-[#0c0a09] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#0c0a09]" />
          <span>Structured Event Decision Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif text-[#0c0a09] leading-[1.08]">
          Never waste time on the wrong events.
        </h1>

        <p className="text-base sm:text-lg text-[#4e4e4e] max-w-2xl mx-auto leading-relaxed font-sans">
          Paste any public event link. We evaluate verified facts against your budget, schedule, and goals to give a clear recommendation:{' '}
          <span className="font-bold text-emerald-800">Go</span>,{' '}
          <span className="font-bold text-amber-800">Maybe</span>, or{' '}
          <span className="font-bold text-rose-800">Skip</span>.
        </p>

        {/* Primary URL Input Form */}
        <form onSubmit={handleAnalyzeSubmit} className="max-w-xl mx-auto space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl border border-[#e7e5e4] focus-within:border-[#0c0a09] shadow-xs transition-all">
            <div className="relative flex-1 flex items-center">
              <Link2 className="w-4 h-4 text-[#777169] absolute left-3.5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste event link (e.g. https://eventbrite.com/e/123456)"
                className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-6 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold rounded-full shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 text-xs"
            >
              <span>Should I go?</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-rose-700 font-medium">{error}</p>}
        </form>

        {/* Example URL Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#777169] pt-1">
          <span className="text-[#a8a29e] font-medium">Try sample:</span>
          {exampleUrls.map((ex) => (
            <button
              key={ex.title}
              onClick={() => {
                setUrl(ex.url);
                setError('');
              }}
              className="px-3 py-1 bg-white hover:bg-[#fafafa] border border-[#e7e5e4] rounded-full text-[#4e4e4e] transition-colors text-[11px] font-medium"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid (ElevenLabs white card surfaces) */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-lg text-[#0c0a09]">Deterministic Logic</h3>
          <p className="text-xs text-[#4e4e4e] leading-relaxed">
            Transparent score computation across interest match, budget ceiling, goal alignment, and timing.
          </p>
        </div>

        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-lg text-[#0c0a09]">Fact Extraction</h3>
          <p className="text-xs text-[#4e4e4e] leading-relaxed">
            Gemini extracts verified event details (title, dates, venue, pricing) without inventing facts.
          </p>
        </div>

        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-lg text-[#0c0a09]">Anonymous Security</h3>
          <p className="text-xs text-[#4e4e4e] leading-relaxed">
            Instant anonymous session under Row Level Security guarantees your data privacy.
          </p>
        </div>
      </section>
    </div>
  );
};
