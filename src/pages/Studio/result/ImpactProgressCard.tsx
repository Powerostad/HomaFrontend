import { useSiteTranslation } from '@/i18n/siteCopy';
import { toLocalizedDigits } from '@/utils/formatters';
import { CheckCircle2, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

interface ImpactProgressCardProps {
  currentScore?: number;
  liveProjectedScore?: number;
  maxProjectedScore?: number;
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
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const measured = currentScore != null && liveProjectedScore != null && maxProjectedScore != null;
  const scoreColor = measured ? getScoreColor(liveProjectedScore) : 'var(--color-feedback-success)';
  const maxGain = measured ? Math.max(0, maxProjectedScore - currentScore) : totalCount;
  const acceptedGain = measured ? Math.max(0, liveProjectedScore - currentScore) : acceptedCount;
  const progressPercent = maxGain > 0 ? Math.min(100, (acceptedGain / maxGain) * 100) : 0;
  const message = measured && acceptedCount === 0
    ? t('studio.result.v2.diagnosis.scoreHint', 'امتیاز بر اساس رنگ، سبک و تناسب فعلی فضا محاسبه شده است.')
    : t('studio.result.v2.diagnosis.acceptedHint', '{{count}} تغییر برای بهبود هماهنگی انتخاب شده است.', { count: acceptedCount });

  return (
    <section className="studio-impact-card" aria-label={measured ? t('studio.result.v2.diagnosis.scoreLabel', 'امتیاز هماهنگی') : t('studio.result.v2.diagnosis.acceptedChanges')}>
      <div className="studio-impact-score" style={{ '--score-color': scoreColor } as CSSProperties}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="studio-impact-track" cx="32" cy="32" r="27" />
          <circle
            className="studio-impact-ring"
            cx="32"
            cy="32"
            r="27"
            pathLength="100"
            strokeDasharray={`${measured ? liveProjectedScore : progressPercent} 100`}
          />
        </svg>
        <strong dir="ltr">{siteValue(toLocalizedDigits(measured ? liveProjectedScore : acceptedCount))}</strong>
      </div>
      <div className="studio-impact-copy">
        <div className="studio-impact-heading">
          <h2>{measured ? t('studio.result.v2.diagnosis.harmonyScore', 'امتیاز هماهنگی فضا') : t('studio.result.v2.diagnosis.acceptedChanges')}</h2>
          {measured && <span dir="ltr">{siteValue(toLocalizedDigits(currentScore))} → {siteValue(toLocalizedDigits(maxProjectedScore))}</span>}
        </div>
        <p>{siteValue(message)}</p>
        <div className="studio-impact-progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%`, background: scoreColor }} />
        </div>
      </div>
      <div className="studio-impact-count">
        {siteValue(acceptedCount === totalCount && totalCount > 0 ? <Sparkles size={16} /> : <CheckCircle2 size={16} />)}
        <span dir="ltr">{siteValue(toLocalizedDigits(acceptedCount))}/{siteValue(toLocalizedDigits(totalCount))}</span>
        <small>{t('studio.result.v2.diagnosis.acceptedChanges', 'تغییر انتخاب شده')}</small>
      </div>
    </section>
  );
}
