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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-400">Your rating helps refine decision model evaluation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Event & Recommendation Feedback
              </h3>
              <p className="text-xs text-slate-400 mt-1">Help us measure recommendation accuracy.</p>
            </div>

            {/* Did you attend? */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Did you attend this event?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttended(true)}
                  className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    attended
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Yes, Attended
                </button>
                <button
                  type="button"
                  onClick={() => setAttended(false)}
                  className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    !attended
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  No, Skipped
                </button>
              </div>
            </div>

            {/* Was it worth it? */}
            {attended && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Was the event worth your time & money?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorthIt(true)}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      worthIt
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Yes, Worth It
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorthIt(false)}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      !worthIt
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Not Worth It
                  </button>
                </div>
              </div>
            )}

            {/* Recommendation Accuracy Rating (1-5) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Recommendation Accuracy Rating (1–5)</label>
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAccuracyRating(star)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= accuracyRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Optional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this recommendation accurate or inaccurate?"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {isSubmitting ? 'Saving Feedback...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
