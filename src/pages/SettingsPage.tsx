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
    { label: 'Learn something', description: 'Focus on workshops, technical talks, and keynotes.' },
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
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-black" />
            <h1 className="text-2xl font-extrabold text-gray-900">Decision Preferences</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Update rules used by the deterministic scoring engine.
          </p>
        </div>

        {userId && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px]">RLS Protected</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Step 1: Select Interests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Target Interests</span>
          </div>
          <div className="flex flex-wrap gap-2">
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
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs font-bold text-gray-900 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-700" />
              <span>Maximum Ticket Budget</span>
            </div>
            <span className="font-mono text-black text-sm font-bold">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-[11px] text-gray-500 font-mono">
            <span>$0 (Free)</span>
            <span>$100</span>
            <span>$250</span>
            <span>$500+</span>
          </div>
        </div>

        {/* Step 3: Preferred Days */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-gray-700" />
            <span>Preferred Days</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['Weekday', 'Weekend'] as PreferredDayType[]).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-2.5 px-4 rounded-lg border text-xs font-bold transition-all ${
                  preferredDays.includes(day)
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {day}s
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Preferred Times */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-gray-700" />
            <span>Preferred Event Hours</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['Morning', 'Afternoon', 'Evening'] as PreferredTimeType[]).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => toggleTime(time)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                  preferredTimes.includes(time)
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Primary Goal */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Target className="w-4 h-4 text-gray-700" />
            <span>Primary Goal for Attending</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalsList.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setPrimaryGoal(g.label)}
                className={`p-3.5 rounded-lg border text-left transition-all space-y-1 ${
                  primaryGoal === g.label
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`font-bold text-xs ${primaryGoal === g.label ? 'text-white' : 'text-gray-900'}`}>{g.label}</div>
                <div className={`text-[11px] ${primaryGoal === g.label ? 'text-gray-300' : 'text-gray-500'}`}>{g.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
          {savedSuccess ? (
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Preferences Updated Successfully!</span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Updates apply immediately to future event scans.</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
