import { CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toLocalizedDigits } from '@/utils/formatters';
import type { CSSProperties } from 'react';

interface ImpactProgressCardProps {
  currentScore: number;
  liveProjectedScore: number;
  maxProjectedScore: number;
  acceptedCount: number;
  totalCount: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'var(--color-feedback-success)';
  if (score >= 55) return 'var(--color-feedback-warning)';
  return 'var(--color-feedback-error)';
}

export function ImpactProgressCard({
  currentScore,
  liveProjectedScore,
  maxProjectedScore,
  acceptedCount,
  totalCount,
}: ImpactProgressCardProps) {
  const { t } = useTranslation();
  const scoreColor = getScoreColor(liveProjectedScore);
  const maxGain = Math.max(0, maxProjectedScore - currentScore);
  const acceptedGain = Math.max(0, liveProjectedScore - currentScore);
  const progressPercent = maxGain > 0 ? Math.min(100, (acceptedGain / maxGain) * 100) : 0;
  const message = acceptedCount === 0
    ? t('studio.result.v2.diagnosis.scoreHint', 'امتیاز بر اساس رنگ، سبک و تناسب فعلی فضا محاسبه شده است.')
    : t('studio.result.v2.diagnosis.acceptedHint', '{{count}} تغییر برای بهبود هماهنگی انتخاب شده است.', { count: acceptedCount });

  return (
    <section className="studio-impact-card" aria-label={t('studio.result.v2.diagnosis.scoreLabel', 'امتیاز هماهنگی')}>
      <div className="studio-impact-score" style={{ '--score-color': scoreColor } as CSSProperties}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="studio-impact-track" cx="32" cy="32" r="27" />
          <circle
            className="studio-impact-ring"
            cx="32"
            cy="32"
            r="27"
            pathLength="100"
            strokeDasharray={`${liveProjectedScore} 100`}
          />
        </svg>
        <strong dir="ltr">{toLocalizedDigits(liveProjectedScore)}</strong>
      </div>
      <div className="studio-impact-copy">
        <div className="studio-impact-heading">
          <h2>{t('studio.result.v2.diagnosis.harmonyScore', 'امتیاز هماهنگی فضا')}</h2>
          <span dir="ltr">{toLocalizedDigits(currentScore)} → {toLocalizedDigits(maxProjectedScore)}</span>
        </div>
        <p>{message}</p>
        <div className="studio-impact-progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%`, background: scoreColor }} />
        </div>
      </div>
      <div className="studio-impact-count">
        {acceptedCount === totalCount && totalCount > 0 ? <Sparkles size={16} /> : <CheckCircle2 size={16} />}
        <span dir="ltr">{toLocalizedDigits(acceptedCount)}/{toLocalizedDigits(totalCount)}</span>
        <small>{t('studio.result.v2.diagnosis.acceptedChanges', 'تغییر انتخاب شده')}</small>
      </div>
    </section>
  );
}
