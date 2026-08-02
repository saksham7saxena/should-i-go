import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Check } from 'lucide-react';
import { recordFeedback } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  recommendationId: string;
  eventTitle: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  recommendationId,
  eventTitle,
}) => {
  const [attended, setAttended] = useState<boolean | null>(null);
  const [worthIt, setWorthIt] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordFeedback(userId, recommendationId, {
        attended: attended ?? undefined,
        worth_it: worthIt ?? undefined,
        accuracy_rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-6 relative text-[#0c0a09]"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-[#777169] hover:text-[#0c0a09] p-1 rounded-full hover:bg-[#f5f5f5]"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif text-[#0c0a09]">Thank you for your feedback!</h3>
            <p className="text-xs text-[#777169]">Your input helps improve future recommendations.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 id="feedback-title" className="text-xl font-serif text-[#0c0a09]">
                Post-Event Feedback
              </h2>
              <p className="text-xs text-[#777169]">
                How was <span className="font-semibold text-[#0c0a09]">{eventTitle}</span>?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0c0a09] block">Did you end up going?</label>
              <div className="flex items-center gap-2">
                <button
                  ref={firstInputRef}
                  type="button"
                  aria-pressed={attended === true}
                  onClick={() => setAttended(true)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                    attended === true
                      ? 'bg-[#0c0a09] text-white border-[#0c0a09]'
                      : 'bg-[#f5f5f5] text-[#4e4e4e] border-[#e7e5e4]'
                  }`}
                >
                  Yes, I went
                </button>
                <button
                  type="button"
                  aria-pressed={attended === false}
                  onClick={() => {
                    setAttended(false);
                    setWorthIt(null);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                    attended === false
                      ? 'bg-[#0c0a09] text-white border-[#0c0a09]'
                      : 'bg-[#f5f5f5] text-[#4e4e4e] border-[#e7e5e4]'
                  }`}
                >
                  No, I skipped
                </button>
              </div>
            </div>

            {attended && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-[#0c0a09] block">Was it worth attending?</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={worthIt === true}
                    onClick={() => setWorthIt(true)}
                    className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                      worthIt === true
                        ? 'bg-[#0c0a09] text-white border-[#0c0a09]'
                        : 'bg-[#f5f5f5] text-[#4e4e4e] border-[#e7e5e4]'
                    }`}
                  >
                    Yes, worth it
                  </button>
                  <button
                    type="button"
                    aria-pressed={worthIt === false}
                    onClick={() => setWorthIt(false)}
                    className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                      worthIt === false
                        ? 'bg-[#0c0a09] text-white border-[#0c0a09]'
                        : 'bg-[#f5f5f5] text-[#4e4e4e] border-[#e7e5e4]'
                    }`}
                  >
                    Not worth it
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0c0a09] block">Recommendation Accuracy (1–5)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} out of 5 stars`}
                    aria-pressed={rating === star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-500' : 'text-[#d6d3d1]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-notes" className="text-xs font-bold text-[#0c0a09] block">Short Notes (Optional)</label>
              <textarea
                id="modal-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any takeaways or reflections..."
                className="w-full bg-[#f5f5f5] border border-[#e7e5e4] rounded-lg px-3 py-2 text-xs text-[#0c0a09] focus:outline-none focus:border-[#0c0a09]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e5e4]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#777169] hover:text-[#0c0a09]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
