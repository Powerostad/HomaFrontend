import { useSiteTranslation } from '@/i18n/siteCopy';
import { Check, ChevronDown, Phone } from 'lucide-react';
import { useState } from 'react';
import { ACTION_DIFFICULTY_MAP, type CategoryGroup } from './types';

/** The static Studio's non-product flow, separate from product cards and checkout. */
export function ActionRecommendationCard({ group, selected, onToggle }: {
  group: CategoryGroup; selected: boolean; onToggle: () => void;
}) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const [showGuidance, setShowGuidance] = useState(false);
  const isLayout = group.actionKind === 'layout';
  const difficulty = ACTION_DIFFICULTY_MAP[isLayout ? 'simple' : group.interventionTier === 'structural' ? 'professional' : 'moderate'];
  const DifficultyIcon = difficulty.icon;
  return <article id={`recommendation-${group.itemId}`} className="studio-action-recommendation" dir={siteDirection()} tabIndex={-1}>
    <div className="studio-action-heading">
      <span className="studio-result-eyebrow">{siteValue(group.actionType || (isLayout ? siteText('بهبود چیدمان') : siteText('خدمات اجرایی')))}</span>
      <h3>{siteValue(group.categoryDisplay)}</h3>
    </div>
    {group.designRationaleFa && group.designRationaleFa !== group.categoryDisplay && <p>{siteValue(group.designRationaleFa)}</p>}
    {group.recommendationReasonFa && <p>{siteValue(group.recommendationReasonFa)}</p>}
    {group.placements.length > 0 && <ul>{group.placements.map(placement => <li key={placement}>{siteValue(placement)}</li>)}</ul>}
    <div className="studio-action-metadata">
      <span><DifficultyIcon size={16} aria-hidden="true" />{siteText(difficulty.label)}</span>
      {!isLayout && <span>{siteText('هزینه اجرا پس از بررسی و استعلام مشخص می‌شود.')}</span>}
    </div>
    {group.actionGuidance && <div className="studio-action-guidance">
      <button type="button" className="studio-details-toggle" onClick={() => setShowGuidance(!showGuidance)} aria-expanded={showGuidance} aria-controls={`action-guidance-${group.itemId}`}>
        {siteText('جزئیات طرح پیشنهادی')}<ChevronDown size={16} className={showGuidance ? 'is-open' : ''} />
      </button>
      <div id={`action-guidance-${group.itemId}`} hidden={!showGuidance}><p>{siteValue(group.actionGuidance)}</p></div>
    </div>}
    <button type="button" className={`studio-primary-button ${selected ? 'is-selected' : ''}`} onClick={onToggle} aria-pressed={selected}>
      {selected ? <Check size={16} /> : !isLayout ? <Phone size={16} /> : null}
      {siteText(isLayout ? selected ? 'تغییر انتخاب شد' : 'انتخاب تغییر' : selected ? 'برای مشاوره انتخاب شد' : 'انتخاب برای مشاوره')}
    </button>
  </article>;
}
