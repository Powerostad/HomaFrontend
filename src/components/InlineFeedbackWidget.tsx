import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, Minus, ThumbsDown, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiPost } from '../utils/apiClient';
import { trackFeedbackSubmitted } from '../analytics/events';

interface InlineFeedbackWidgetProps {
  flow: 'tryon' | 'studio';
  imageId?: number | null;
  sessionId?: string | null;
}

type FeedbackState = 'idle' | 'submitting' | 'submitted';

const VOTE_OPTIONS = [
  { score: 1, icon: ThumbsUp, labelKey: 'feedback.inline.good' },
  { score: 2, icon: Minus, labelKey: 'feedback.inline.neutral' },
  { score: 3, icon: ThumbsDown, labelKey: 'feedback.inline.bad' },
] as const;

function getStorageKey(flow: string, id: string | number): string {
  return `homa_feedback_${flow}_${id}`;
}

export function InlineFeedbackWidget({ flow, imageId, sessionId }: InlineFeedbackWidgetProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<FeedbackState>('idle');
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const entityId = flow === 'tryon' ? imageId : sessionId;

  // Check localStorage for previously submitted feedback
  useEffect(() => {
    if (!entityId) return;
    const stored = localStorage.getItem(getStorageKey(flow, entityId));
    if (stored) {
      setState('submitted');
      setSelectedScore(parseInt(stored, 10));
    }
  }, [flow, entityId]);

  // Don't render if no entity ID
  if (!entityId) return null;

  const handleVote = async (score: number) => {
    if (state !== 'idle') return;

    setState('submitting');
    setSelectedScore(score);

    try {
      let result;

      if (flow === 'tryon') {
        result = await apiPost('/products/vote/', {
          image_id: imageId,
          vote: score,
        });
      } else {
        result = await apiPost(`/recommendations/sessions/${sessionId}/feedback/`, {
          vote: score,
        });
      }

      if (result.success) {
        setState('submitted');
        localStorage.setItem(getStorageKey(flow, entityId), String(score));

        const feedbackType = score === 1 ? 'satisfied' : score === 2 ? 'neutral' : 'dissatisfied';
        trackFeedbackSubmitted({
          feedback_type: feedbackType,
          slider_value: score,
          product_id: flow === 'tryon' ? String(imageId) : sessionId || undefined,
        });
      } else {
        setState('idle');
        setSelectedScore(null);
        toast.error(t('feedback.inline.submitError', 'خطا در ثبت بازخورد'));
      }
    } catch {
      setState('idle');
      setSelectedScore(null);
      toast.error(t('feedback.inline.submitError', 'خطا در ثبت بازخورد'));
    }
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-t border-black/[0.08]">
      <AnimatePresence mode="wait">
        {state === 'submitted' ? (
          <motion.div
            key="thankyou"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-6 h-6 rounded-full bg-black/[0.06] flex items-center justify-center">
              <Check size={13} strokeWidth={2} className="text-black/60" />
            </div>
            <span className="text-[13px] font-medium text-black/50">
              {t('feedback.inline.thankYou', 'ممنون از بازخوردت!')}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <span className="text-[13px] font-bold text-black/40 uppercase tracking-[0.2em]">
              {t('feedback.inline.title', 'نتیجه چطور بود؟')}
            </span>

            <div className="flex gap-2">
              {VOTE_OPTIONS.map(({ score, icon: Icon, labelKey }) => {
                const isSelected = selectedScore === score;
                const isSubmitting = state === 'submitting' && isSelected;

                return (
                  <button
                    key={score}
                    onClick={() => handleVote(score)}
                    disabled={state === 'submitting'}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 border transition-all
                      text-[12px] font-medium
                      ${isSelected
                        ? 'border-black/20 bg-black/[0.04] text-black'
                        : 'border-black/[0.08] bg-transparent text-black/50 hover:border-black/15 hover:text-black/70'}
                      ${state === 'submitting' && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Icon size={14} strokeWidth={1.5} />
                    )}
                    <span>{t(labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
