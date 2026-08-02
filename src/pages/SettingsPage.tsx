import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InterestType, PrimaryGoalType, PreferredDayType, PreferredTimeType } from '../types';
import { InterestChip, ALL_INTERESTS } from '../components/InterestChip';
import { Settings, Sparkles, DollarSign, Calendar, Clock, Target, Check, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { userId, preferences, updatePreferences } = useAuth();

  const [interests, setInterests] = useState<InterestType[]>(preferences?.interests || ['AI', 'Startups', 'Technology']);
  const [maxPrice, setMaxPrice] = useState<number>(preferences?.max_price ?? 100);
  const [preferredDays, setPreferredDays] = useState<PreferredDayType[]>(
    preferences?.preferred_days || ['Weekday', 'Weekend']
  );
  const [preferredTimes, setPreferredTimes] = useState<PreferredTimeType[]>(
    preferences?.preferred_times || ['Evening']
  );
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoalType>(
    preferences?.primary_goal || 'Learn something'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const toggleInterest = (interest: InterestType) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleDay = (day: PreferredDayType) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: PreferredTimeType) => {
    setPreferredTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const goalsList: { label: PrimaryGoalType; description: string }[] = [
    { label: 'Learn something', description: 'Focus on workshops, technical talks, and industry keynotes.' },
    { label: 'Meet people', description: 'Prioritize networking, founder mixers, and community meetups.' },
    { label: 'Have fun', description: 'Look for festivals, live concerts, games, and entertainment.' },
    { label: 'Try something new', description: 'Discover fresh topics and unique local experiences.' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavedSuccess(false);

    try {
      await updatePreferences({
        interests,
        max_price: maxPrice,
        preferred_days: preferredDays,
        preferred_times: preferredTimes,
        primary_goal: primaryGoal,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Decision Preferences</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Update rules used by the deterministic scoring algorithm.
          </p>
        </div>

        {userId && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">RLS Protected</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        {/* Step 1: Select Interests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Target Interests</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {ALL_INTERESTS.map((item) => (
              <InterestChip
                key={item}
                label={item}
                isSelected={interests.includes(item)}
                onToggle={toggleInterest}
              />
            ))}
          </div>
        </div>

        {/* Step 2: Maximum Ticket Price */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Maximum Ticket Budget</span>
            </div>
            <span className="font-mono text-indigo-400 text-base font-bold">
              {maxPrice === 0 ? 'Free Only ($0)' : `$${maxPrice}`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>$0 (Free)</span>
            <span>$100</span>
            <span>$250</span>
            <span>$500+</span>
          </div>
        </div>

        {/* Step 3: Preferred Days */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Preferred Event Days</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['Weekday', 'Weekend'] as PreferredDayType[]).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  preferredDays.includes(day)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {day}s
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Preferred Times */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Preferred Event Hours</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['Morning', 'Afternoon', 'Evening'] as PreferredTimeType[]).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => toggleTime(time)}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all ${
                  preferredTimes.includes(time)
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Primary Goal */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Target className="w-4 h-4 text-rose-400" />
            <span>Primary Goal for Attending</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalsList.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setPrimaryGoal(g.label)}
                className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 ${
                  primaryGoal === g.label
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs text-indigo-300">{g.label}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{g.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Save Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          {savedSuccess ? (
            <div className="px-4 py-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Preferences Updated Successfully!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">All updates apply immediately to future event scans.</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-8 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
