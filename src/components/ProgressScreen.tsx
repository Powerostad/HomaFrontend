import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toLocalizedDigits } from '@/utils/formatters';

/* ── Types ── */

export interface ProgressSubMessage {
  text: string;
  delayMs: number;
}

export interface ProgressStep {
  label: string;
  subMessages: ProgressSubMessage[];
  estimatedSec: number;
}

export interface ProgressScreenProps {
  steps: ProgressStep[];
  activeStepIndex: number;
  tips: string[];
  bgImage: string | null;
  uploadProgress?: number | null;
  isUploading?: boolean;
  statusOverride?: React.ReactNode;
}

/* ── Component ── */

export function ProgressScreen({
  steps,
  activeStepIndex,
  tips,
  bgImage,
  uploadProgress,
  isUploading,
  statusOverride,
}: ProgressScreenProps) {
  const { t } = useTranslation();

  // Only move forward (never go backwards)
  const [maxStep, setMaxStep] = useState(activeStepIndex);
  useEffect(() => {
    setMaxStep((prev) => Math.max(prev, activeStepIndex));
  }, [activeStepIndex]);

  // Accumulated micro-feed messages
  const [visibleMessages, setVisibleMessages] = useState<
    Array<{ text: string; stepIdx: number; done: boolean }>
  >([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  // When maxStep advances, schedule new sub-messages and mark previous ones as done
  useEffect(() => {
    // Mark all previous step messages as done
    setVisibleMessages((prev) =>
      prev.map((msg) =>
        msg.stepIdx < maxStep ? { ...msg, done: true } : msg,
      ),
    );

    // Schedule sub-messages for the current step
    const step = steps[maxStep];
    if (!step) return;

    // Clear any pending timers from previous step changes
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    step.subMessages.forEach((sub) => {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.text === sub.text && m.stepIdx === maxStep))
            return prev;
          return [
            ...prev.map((m) =>
              m.stepIdx === maxStep && !m.done ? m : m,
            ),
            { text: sub.text, stepIdx: maxStep, done: false },
          ];
        });
      }, sub.delayMs);
      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [maxStep, steps]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  // Rotating tips
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    if (tips.length === 0) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Time estimate: sum of remaining steps' estimatedSec
  const remainingSec = steps
    .slice(maxStep)
    .reduce((sum, s) => sum + s.estimatedSec, 0);

  return (
    <>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <>
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover blur-[80px] scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 mix-blend-overlay" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[20px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6">
        {/* Stepped progress bar */}
        <div className="flex w-full gap-1.5 mb-6">
          {steps.map((step, idx) => {
            const isCompleted = idx < maxStep;
            const isActive = idx === maxStep;
            return (
              <div key={idx} className="flex-1 flex flex-col gap-2">
                <div className="h-1.5 rounded-full overflow-hidden bg-border-subtle">
                  {isCompleted && (
                    <div className="h-full w-full bg-content-primary rounded-full" />
                  )}
                  {isActive && (
                    <div className="h-full w-1/2 bg-content-primary rounded-full overflow-hidden relative">
                      <div
                        className="absolute inset-0 bg-content-primary"
                        style={{
                          animation: 'indeterminate 1.8s ease-in-out infinite',
                        }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] text-center leading-tight ${
                    isActive
                      ? 'text-content-primary font-medium'
                      : isCompleted
                        ? 'text-content-secondary'
                        : 'text-content-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Upload progress bar (TryOn only) */}
        {isUploading && uploadProgress != null && uploadProgress > 0 && (
          <div className="w-full max-w-[200px] mb-4">
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[11px] text-black/40 mt-2 text-center">
              {t('tryOn.progress.uploadPercent', {
                percent: Math.round(uploadProgress),
              })}
            </p>
          </div>
        )}

        {/* Micro-feed */}
        <div
          ref={feedRef}
          className="w-full max-h-[180px] overflow-hidden mb-6 flex flex-col gap-2"
        >
          <AnimatePresence initial={false}>
            {visibleMessages.slice(-6).map((msg) => (
              <motion.div
                key={`${msg.stepIdx}-${msg.text}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                {msg.done ? (
                  <Check
                    size={14}
                    className="text-content-secondary flex-shrink-0"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-content-primary animate-pulse flex-shrink-0" />
                )}
                <span
                  className={`text-[13px] leading-snug ${
                    msg.done
                      ? 'text-content-secondary'
                      : 'text-content-primary font-medium'
                  }`}
                >
                  {msg.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Status override (e.g. retrying amber message) */}
        {statusOverride && (
          <div className="mb-4">{statusOverride}</div>
        )}

        {/* Time estimate */}
        {remainingSec > 0 && (
          <p className="text-[12px] font-medium text-content-muted mb-4">
            {t('progress.timeEstimate', {
              seconds: toLocalizedDigits(remainingSec),
              defaultValue: `کمتر از ${toLocalizedDigits(remainingSec)} ثانیه`,
            })}
          </p>
        )}

        {/* Tips carousel */}
        {tips.length > 0 && (
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-[12px] text-content-secondary text-center max-w-[300px] leading-relaxed"
              >
                {tips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
