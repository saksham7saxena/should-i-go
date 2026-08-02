import React, { useState } from 'react';
import { Star, X, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationId: string;
  onSubmitted?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  recommendationId,
  onSubmitted,
}) => {
  const { userId } = useAuth();
  const [attended, setAttended] = useState<boolean>(true);
  const [worthIt, setWorthIt] = useState<boolean>(true);
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await submitFeedback(userId, recommendationId, {
        attended,
        worth_it: worthIt,
        accuracy_rating: accuracyRating,
        notes: notes.trim() || undefined,
      });
      setIsDone(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
        setIsDone(false);
      }, 1200);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-xl relative text-gray-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Thank You for Your Feedback!</h3>
            <p className="text-xs text-gray-500">Your rating helps refine decision evaluation accuracy.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-black" />
                Event & Recommendation Feedback
              </h3>
              <p className="text-xs text-gray-500 mt-1">Help us measure decision accuracy.</p>
            </div>

            {/* Did you attend? */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Did you attend this event?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttended(true)}
                  className={`py-2 px-4 rounded-lg border text-xs font-semibold transition-all ${
                    attended
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Yes, Attended
                </button>
                <button
                  type="button"
                  onClick={() => setAttended(false)}
                  className={`py-2 px-4 rounded-lg border text-xs font-semibold transition-all ${
                    !attended
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  No, Skipped
                </button>
              </div>
            </div>

            {/* Was it worth it? */}
            {attended && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Was the event worth your time & money?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorthIt(true)}
                    className={`py-2 px-4 rounded-lg border text-xs font-semibold transition-all ${
                      worthIt
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Yes, Worth It
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorthIt(false)}
                    className={`py-2 px-4 rounded-lg border text-xs font-semibold transition-all ${
                      !worthIt
                        ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Not Worth It
                  </button>
                </div>
              </div>
            )}

            {/* Accuracy Rating */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Recommendation Accuracy (1–5)</label>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAccuracyRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= accuracyRating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Optional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this recommendation accurate or inaccurate?"
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-lg shadow-sm transition-all text-xs"
            >
              {isSubmitting ? 'Saving Feedback...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
