import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InterestType, PreferredDayType, PreferredTimeType } from '../types';
import { InterestChip, ALL_INTERESTS } from '../components/InterestChip';
import { Settings, Sparkles, DollarSign, Calendar, Clock, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences } = useAuth();

  const [interests, setInterests] = useState<InterestType[]>(preferences?.interests || ['AI', 'Startups', 'Technology']);
  const [maxPrice, setMaxPrice] = useState<number>(preferences?.max_price ?? 100);
  const [preferredDays, setPreferredDays] = useState<PreferredDayType[]>(
    preferences?.preferred_days || ['Weekday', 'Weekend']
  );
  const [preferredTimes, setPreferredTimes] = useState<PreferredTimeType[]>(
    preferences?.preferred_times || ['Evening']
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
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      <div className="border-b border-[#e7e5e4] pb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#0c0a09]" />
          <h1 className="text-3xl font-serif text-[#0c0a09]">Preferences</h1>
        </div>
        <p className="text-xs text-[#777169] mt-1">
          Manage your default interests, budget, and preferred schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Interests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c0a09] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#0c0a09]" />
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

        {/* Max Ticket Budget */}
        <div className="space-y-3 pt-4 border-t border-[#e7e5e4]">
          <div className="flex items-center justify-between text-xs font-bold text-[#0c0a09] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#0c0a09]" />
              <span>Maximum Ticket Budget</span>
            </div>
            <span className="font-mono text-[#0c0a09] text-base font-bold">
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
            className="w-full h-2 bg-[#f0efed] rounded-lg appearance-none cursor-pointer accent-[#0c0a09]"
          />
          <div className="flex justify-between text-[11px] text-[#777169] font-mono">
            <span>$0 (Free)</span>
            <span>$100</span>
            <span>$250</span>
            <span>$500+</span>
          </div>
        </div>

        {/* Preferred Days */}
        <div className="space-y-3 pt-4 border-t border-[#e7e5e4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c0a09] uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#0c0a09]" />
            <span>Preferred Event Days</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['Weekday', 'Weekend'] as PreferredDayType[]).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-2.5 px-4 rounded-full border text-xs font-bold transition-all ${
                  preferredDays.includes(day)
                    ? 'bg-[#0c0a09] border-[#0c0a09] text-white shadow-xs'
                    : 'bg-white border-[#e7e5e4] text-[#4e4e4e] hover:bg-[#fafafa]'
                }`}
              >
                {day}s
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Times */}
        <div className="space-y-3 pt-4 border-t border-[#e7e5e4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c0a09] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#0c0a09]" />
            <span>Preferred Event Hours</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['Morning', 'Afternoon', 'Evening'] as PreferredTimeType[]).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => toggleTime(time)}
                className={`py-2.5 px-3 rounded-full border text-xs font-bold transition-all ${
                  preferredTimes.includes(time)
                    ? 'bg-[#0c0a09] border-[#0c0a09] text-white shadow-xs'
                    : 'bg-white border-[#e7e5e4] text-[#4e4e4e] hover:bg-[#fafafa]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Save Controls */}
        <div className="pt-4 border-t border-[#e7e5e4] flex items-center justify-between gap-4">
          {savedSuccess ? (
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-full flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Preferences Saved!</span>
            </div>
          ) : (
            <span className="text-xs text-[#777169]">Updates apply to future event scans.</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-[#0c0a09] hover:bg-[#292524] text-white font-bold text-xs rounded-full shadow-xs transition-all"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
