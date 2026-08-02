import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterestType, PrimaryGoalType, PreferredDayType, PreferredTimeType } from '../types';
import { InterestChip, ALL_INTERESTS } from '../components/InterestChip';
import { Sparkles, DollarSign, Calendar, Clock, Target, ArrowRight } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { preferences, updatePreferences } = useAuth();
  const navigate = useNavigate();

  const [interests, setInterests] = useState<InterestType[]>(
    preferences?.interests || ['AI', 'Startups', 'Technology']
  );
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

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (interests.length === 0) {
      alert('Please select at least one interest to build your scoring profile.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePreferences({
        interests,
        max_price: maxPrice,
        preferred_days: preferredDays,
        preferred_times: preferredTimes,
        primary_goal: primaryGoal,
      });
      navigate('/analyze');
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personal Decision Profile</span>
        </div>
        <h1 className="text-3xl font-black text-white">What events matter to you?</h1>
        <p className="text-sm text-slate-400">
          Your selections determine deterministic event recommendation scores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        {/* Step 1: Select Interests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Select Your Interests</span>
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
              <span>Maximum Ticket Price</span>
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
            <span>Preferred Days</span>
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
            <span>Preferred Event Times</span>
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
            <span>Primary Reason for Attending</span>
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

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-extrabold text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <span>{isSubmitting ? 'Saving Profile...' : 'Save Profile & Continue'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
