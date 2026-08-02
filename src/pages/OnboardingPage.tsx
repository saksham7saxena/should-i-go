import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterestType } from '../types';
import { InterestChip, ALL_INTERESTS } from '../components/InterestChip';
import { DollarSign, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { preferences, updatePreferences } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [interests, setInterests] = useState<InterestType[]>(
    preferences?.interests || ['AI', 'Startups', 'Technology']
  );
  const [maxPrice, setMaxPrice] = useState<number>(preferences?.max_price ?? 100);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (interest: InterestType) => {
    setInterestError(null);
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (interests.length === 0) {
        setInterestError('Choose at least one interest.');
        return;
      }
      setStep(2);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await updatePreferences({
        interests,
        max_price: maxPrice,
      });

      // Phase 10: Check pending preserved URL in sessionStorage (supports camelCase and snake_case)
      const pendingUrl = sessionStorage.getItem('pendingEventUrl') || sessionStorage.getItem('pending_event_url');
      if (pendingUrl) {
        sessionStorage.removeItem('pendingEventUrl');
        sessionStorage.removeItem('pending_event_url');
        navigate(`/analyze?url=${encodeURIComponent(pendingUrl)}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0efed] border border-[#e7e5e4] text-[#0c0a09] text-xs font-semibold uppercase tracking-wider">
          <span>Step {step} of 2</span>
        </div>
        <h1 className="text-3xl font-serif text-[#0c0a09]">
          {step === 1 ? 'Select your interests' : 'Set your maximum ticket budget'}
        </h1>
        <p className="text-xs text-[#777169]">
          {step === 1
            ? 'Choose topics you care about to personalize your event matching.'
            : 'Specify the maximum amount you are willing to spend per event.'}
        </p>
      </div>

      <form onSubmit={handleNextStep} className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0c0a09] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0c0a09]" />
                <span>Target Interests</span>
              </div>
            </div>

            {interestError && (
              <p id="interest-error" role="alert" className="text-xs text-rose-700 font-semibold">
                {interestError}
              </p>
            )}

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
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0c0a09] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0c0a09]" />
                <span>Max Ticket Price</span>
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
              aria-label="Maximum Ticket Price Slider"
              className="w-full h-2 bg-[#f0efed] rounded-lg appearance-none cursor-pointer accent-[#0c0a09]"
            />
            <div className="flex justify-between text-[11px] text-[#777169] font-mono">
              <span>$0 (Free)</span>
              <span>$100</span>
              <span>$250</span>
              <span>$500+</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4] gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-full border border-[#e7e5e4] text-xs font-semibold text-[#4e4e4e] hover:bg-[#fafafa] transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs transition-all flex items-center gap-2 ml-auto"
          >
            <span>{step === 1 ? 'Continue to Budget' : isSubmitting ? 'Saving Profile...' : 'Complete Setup'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
