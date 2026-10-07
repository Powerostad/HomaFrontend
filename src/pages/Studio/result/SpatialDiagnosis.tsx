import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { CheckCircle2, ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DiagnosisAction } from './DiagnosisActionCard';

const FONT = 'var(--font-family-vazirmatn)';

export interface DetectedContext {
  roomType: string;
  targetStyle: string;
  naturalLight: string;
  dominantSurfaces: string;
}

interface SpatialDiagnosisProps {
  harmonyScore: number;
  projectedScore: number;
  totalPrice: number;
  selectedPrice: number;
  selectedCount: number;
  totalRecommendations: number;
  diagnosisDetail: string;
  diagnosisExpanded: boolean;
  onToggleDiagnosis: () => void;
  detectedContext?: DetectedContext;
  diagnosisActions?: DiagnosisAction[];
  onScrollToStep?: (itemId: number) => void;
  onNavigateToRecommendations?: () => void;
}

function impactLabel(level: DiagnosisAction['status'], t: (key: string, fallback: string) => string) {
  if (level === 'critical') return t('studio.result.v2.impact.high', 'اثر بالا');
  if (level === 'warning') return t('studio.result.v2.impact.medium', 'اثر متوسط');
  return t('studio.result.v2.impact.low', 'اثر کم');
}

export function SpatialDiagnosis({
  harmonyScore,
  projectedScore,
  totalPrice,
  selectedPrice,
  selectedCount,
  totalRecommendations,
  diagnosisDetail,
  diagnosisExpanded,
  onToggleDiagnosis,
  detectedContext,
  diagnosisActions = [],
  onScrollToStep,
  onNavigateToRecommendations,
}: SpatialDiagnosisProps) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const headline = harmonyScore >= 75
    ? t('studio.result.v2.diagnosis.headlineGood', 'فضای شما پایه‌ی هماهنگی خوبی دارد')
    : t('studio.result.v2.diagnosis.headlinePotential', 'فضای شما ظرفیت زیادی برای یک تغییر حساب‌شده دارد');
  const detail = diagnosisDetail || t('studio.result.v2.diagnosis.defaultDetail', 'با تمرکز روی چند نقطه کلیدی، می‌شود بدون شلوغ کردن فضا، تعادل و کاربرد آن را بهتر کرد.');

  return (
    <section className="studio-diagnosis" aria-label={t('studio.result.v2.diagnosis.label', 'تحلیل فضا')} style={{ fontFamily: FONT }}>
      <div className="studio-diagnosis-intro">
        <div>
          <p className="studio-result-eyebrow">{t('studio.result.v2.diagnosis.label', 'تحلیل فضا')}</p>
          <h2>{siteValue(headline)}</h2>
          <p>{siteValue(detail)}</p>
        </div>
        <button type="button" className="studio-text-button" onClick={onNavigateToRecommendations}>
          {t('studio.result.v2.diagnosis.seeChanges', 'دیدن تغییرها')}
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="studio-diagnosis-metrics" aria-label={t('studio.result.v2.diagnosis.metrics', 'خلاصه عددی تحلیل')}>
        <div className="studio-diagnosis-metric">
          <span>{t('studio.result.v2.diagnosis.harmonyScore', 'امتیاز هماهنگی')}</span>
          <strong dir="ltr">{siteValue(toLocalizedDigits(harmonyScore))}<small>/۱۰۰</small></strong>
          <em>{t('studio.result.v2.diagnosis.scoreMethod', 'ترکیب رنگ، سبک و تناسب')}</em>
        </div>
        <div className="studio-diagnosis-metric">
          <span>{t('studio.result.v2.diagnosis.changeCount', 'تغییر پیشنهادی')}</span>
          <strong>{siteValue(toLocalizedDigits(totalRecommendations))}</strong>
          <em>{t('studio.result.v2.diagnosis.changeHint', 'قابل بررسی جداگانه')}</em>
        </div>
        <div className="studio-diagnosis-metric">
          <span>{t('studio.result.v2.diagnosis.recommendedTotal', 'هزینه همه پیشنهادها')}</span>
          <strong className="studio-price" dir="ltr">{siteValue(formatPriceFromRial(totalPrice, false))}</strong>
          <em>{t('common.toman', 'تومان')} · {t('studio.result.v2.diagnosis.estimated', 'تخمینی')}</em>
        </div>
        <div className="studio-diagnosis-metric studio-diagnosis-metric-selected">
          <span>{t('studio.result.v2.diagnosis.selectedTotal', 'انتخاب فعلی')}</span>
          <strong className="studio-price" dir="ltr">{siteValue(formatPriceFromRial(selectedPrice, false))}</strong>
          <em>{siteValue(toLocalizedDigits(selectedCount))} {t('studio.result.v2.diagnosis.selectedProducts', 'محصول انتخاب شده')}</em>
        </div>
      </div>

      <div className="studio-diagnosis-actions">
        <div className="studio-subsection-heading">
          <h3>{t('studio.result.v2.diagnosis.improvementTitle', 'سه فرصت بهبود')}</h3>
          <span>{t('studio.result.v2.diagnosis.linkHint', 'هر مورد به پیشنهاد متناظر وصل است')}</span>
        </div>
        {siteValue(diagnosisActions.slice(0, 3).map((action, index) => (
          <article key={action.id} className="studio-diagnosis-action">
            <div className="studio-diagnosis-action-number" aria-hidden="true">{siteValue(String(index + 1).padStart(2, '0'))}</div>
            <div className="studio-diagnosis-action-copy">
              <div className="studio-diagnosis-action-heading">
                <h4>{siteValue(action.title)}</h4>
                <span>{siteValue(impactLabel(action.status, t))}</span>
              </div>
              <p><strong>{t('studio.result.v2.card.problemStatement', 'مشکل فعلی')}:</strong> {siteValue(action.diagnosis)}</p>
              <p><strong>{t('studio.result.v2.card.designStrategy', 'راهکار پیشنهادی')}:</strong> {siteValue(action.solution)}</p>
              <p><strong>{t('studio.result.v2.card.expectedImpact', 'اثر مورد انتظار')}:</strong> {t('studio.result.v2.card.expectedImpactCopy', 'تعادل بیشتر و خوانایی بهتر فضا')}</p>
              {siteValue(action.placements && action.placements.length > 0 && (
                <div className="studio-placement-list">
                  {siteValue(action.placements.map((placement) => <span key={placement}>{siteValue(placement)}</span>))}
                </div>
              ))}
              <button type="button" className="studio-inline-link" onClick={() => action.linkedItemId && onScrollToStep?.(action.linkedItemId)}>
                {t('studio.result.v2.card.viewRecommendation', 'مشاهده پیشنهاد')}
                <ChevronLeft size={15} />
              </button>
            </div>
          </article>
        )))}
      </div>

      <div className="studio-diagnosis-details">
        <button type="button" className="studio-details-toggle" onClick={onToggleDiagnosis} aria-expanded={diagnosisExpanded}>
          <span><Sparkles size={16} />{t('studio.result.v2.diagnosis.detailToggle', 'جزئیات تشخیص')}</span>
          <ChevronDown className={diagnosisExpanded ? 'is-open' : ''} size={17} />
        </button>
        {siteValue(diagnosisExpanded && (
          <div className="studio-details-content">
            {siteValue(detectedContext && (
              <div className="studio-context-pills">
                {siteValue(detectedContext.roomType && <span>{t('studio.result.v2.diagnosis.roomType', 'نوع فضا')}: {siteValue(detectedContext.roomType)}</span>)}
                {siteValue(detectedContext.targetStyle && <span>{t('studio.result.v2.diagnosis.style', 'سبک هدف')}: {siteValue(detectedContext.targetStyle)}</span>)}
                {siteValue(detectedContext.naturalLight && <span>{t('studio.result.v2.diagnosis.light', 'نور')}: {siteValue(detectedContext.naturalLight)}</span>)}
                {siteValue(detectedContext.dominantSurfaces && <span>{t('studio.result.v2.diagnosis.surfaces', 'سطوح غالب')}: {siteValue(detectedContext.dominantSurfaces)}</span>)}
              </div>
            ))}
            <p>{siteValue(detail)}</p>
            <div className="studio-score-explanation">
              <CheckCircle2 size={16} />
              <span>{t('studio.result.v2.diagnosis.projectedExplanation', 'اگر همه تغییرها اعمال شوند، امتیاز پیش‌بینی‌شده به')} <strong>{siteValue(toLocalizedDigits(projectedScore))}</strong> {t('studio.result.v2.diagnosis.outOf', 'از ۱۰۰ می‌رسد.')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
