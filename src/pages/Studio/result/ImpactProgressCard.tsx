/**
 * ImpactProgressCard — Live Harmony Score Tracker
 *
 * Animated card showing current → projected harmony score.
 * Score updates live as user accepts/checks recommendation items.
 * Motivational message adapts to progress level.
 *
 * All styling from CSS variables. Font: Vazirmatn only.
 */
import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import { toLocalizedDigits } from '@/utils/formatters';

const FONT = 'var(--font-family-vazirmatn)';

interface ImpactProgressCardProps {
  currentScore: number;
  liveProjectedScore: number;
  maxProjectedScore: number;
  acceptedCount: number;
  totalCount: number;
}

function getMotivationalMessage(current: number, _live: number, max: number, acceptedCount: number, totalCount: number): string {
  if (acceptedCount === 0) return `با اعمال این ${toLocalizedDigits(totalCount)} تغییر، امتیاز خونه‌تون از ${toLocalizedDigits(current)} به ${toLocalizedDigits(max)} می‌رسه!`;
  if (acceptedCount === totalCount) return `عالی! همه ${toLocalizedDigits(totalCount)} تغییر رو انتخاب کردید`;
  const ratio = acceptedCount / totalCount;
  if (ratio >= 0.7) return `فوق‌العاده! ${toLocalizedDigits(acceptedCount)} از ${toLocalizedDigits(totalCount)} تغییر رو انتخاب کردید`;
  if (ratio >= 0.4) return `خوب پیش می‌رید! ${toLocalizedDigits(acceptedCount)} از ${toLocalizedDigits(totalCount)} تغییر انتخاب شده`;
  return `${toLocalizedDigits(acceptedCount)} از ${toLocalizedDigits(totalCount)} تغییر انتخاب کردید، ادامه بدید!`;
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'hsl(145, 55%, 36%)';
  if (score >= 70) return 'hsl(100, 45%, 40%)';
  if (score >= 50) return 'hsl(40, 65%, 45%)';
  return 'hsl(15, 60%, 45%)';
}

/* Animated number display */
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => toLocalizedDigits(Math.round(v)));
  const [displayText, setDisplayText] = useState(toLocalizedDigits(value));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayText(v));
    return unsubscribe;
  }, [display]);

  return <>{displayText}</>;
}

export function ImpactProgressCard({
  currentScore,
  liveProjectedScore,
  maxProjectedScore,
  acceptedCount,
  totalCount,
}: ImpactProgressCardProps) {
  const hasGain = liveProjectedScore > currentScore;
  const gainDelta = liveProjectedScore - currentScore;
  const maxGain = maxProjectedScore - currentScore;

  // Progress bar fill percentage (relative to max possible gain)
  const progressPercent = maxGain > 0 ? Math.min((gainDelta / maxGain) * 100, 100) : 0;

  const message = getMotivationalMessage(currentScore, liveProjectedScore, maxProjectedScore, acceptedCount, totalCount);
  const scoreColor = getScoreColor(liveProjectedScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        fontFamily: FONT,
        padding: '18px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-sm)',
        marginBottom: '20px',
      }}
    >
      {/* Top Row: Score + Stats */}
      <div className="flex items-center gap-4">
        {/* Score Circle */}
        <div className="relative shrink-0" style={{ width: '56px', height: '56px' }}>
          <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90">
            {/* Track */}
            <circle
              cx={28} cy={28} r={23}
              fill="none"
              stroke="var(--score-ring-track)"
              strokeWidth={5}
            />
            {/* Current score (static) */}
            <circle
              cx={28} cy={28} r={23}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23}
              strokeDashoffset={2 * Math.PI * 23 * (1 - currentScore / 100)}
            />
            {/* Live projected (animated) */}
            <motion.circle
              cx={28} cy={28} r={23}
              fill="none"
              stroke={scoreColor}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23}
              animate={{
                strokeDashoffset: 2 * Math.PI * 23 * (1 - liveProjectedScore / 100),
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          {/* Center number */}
          <div
            className="absolute inset-0 flex items-center justify-center tabular-nums"
            style={{
              fontSize: '16px',
              fontWeight: 'var(--font-weight-bold)',
              color: scoreColor,
              fontFamily: FONT,
              lineHeight: 1,
            }}
          >
            <AnimatedNumber value={liveProjectedScore} />
          </div>
        </div>

        {/* Right: Labels */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span
            style={{
              fontSize: '13px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              fontFamily: FONT,
            }}
          >
            امتیاز هماهنگی فضا
          </span>

          {/* Gain badge */}
          {hasGain && (
            <div
              className="flex items-center gap-1 self-start"
              style={{ transition: 'all 0.3s ease' }}
            >
              <ArrowUpRight size={13} style={{ color: scoreColor }} />
              <span
                className="tabular-nums"
                style={{
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-bold)',
                  color: scoreColor,
                  fontFamily: FONT,
                }}
              >
                +<AnimatedNumber value={gainDelta} />
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  fontFamily: FONT,
                }}
              >
                از {toLocalizedDigits(currentScore)}
              </span>
            </div>
          )}

          {!hasGain && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                fontFamily: FONT,
              }}
            >
              فعلی: {toLocalizedDigits(currentScore)} از ۱۰۰
            </span>
          )}
        </div>

        {/* Accepted counter */}
        <div
          className="flex items-center gap-1 shrink-0"
          style={{
            padding: '4px 10px',
            borderRadius: '100px',
            background: acceptedCount > 0 ? 'rgba(0,49,45,0.06)' : 'var(--muted)',
            border: acceptedCount > 0 ? '1px solid rgba(0,49,45,0.10)' : '1px solid transparent',
          }}
        >
          <CheckCircle2
            size={12}
            style={{
              color: acceptedCount > 0 ? 'var(--feedback-good)' : 'var(--muted-foreground)',
            }}
          />
          <span
            className="tabular-nums"
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: acceptedCount > 0 ? 'var(--feedback-good)' : 'var(--muted-foreground)',
              fontFamily: FONT,
            }}
          >
            {toLocalizedDigits(acceptedCount)}/{toLocalizedDigits(totalCount)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          marginTop: '14px',
          height: '4px',
          borderRadius: '100px',
          background: 'var(--score-ring-track)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%',
            borderRadius: '100px',
            background: scoreColor,
          }}
        />
      </div>

      {/* Motivational message */}
      <div
        className="flex items-center gap-1.5"
        style={{ marginTop: '10px', transition: 'opacity 0.3s ease' }}
      >
        {acceptedCount === totalCount && (
          <Sparkles size={11} style={{ color: scoreColor, flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            fontFamily: FONT,
          }}
        >
          {message}
        </span>
      </div>
    </motion.div>
  );
}
