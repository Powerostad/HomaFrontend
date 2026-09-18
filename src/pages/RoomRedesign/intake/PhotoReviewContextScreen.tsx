import { useTranslation } from 'react-i18next';
import type { Goal, HomaIntakePayload, IntakeImage, RoomType } from './intakeTypes';
import { PhotoPicker } from './PhotoPicker';
import { RoomTypeSelector } from './RoomTypeSelector';
import { GoalChips } from './GoalChips';
import { OptionalUserNoteInput } from './OptionalUserNoteInput';

type Preferences = NonNullable<HomaIntakePayload['prefsUpdate']>;
interface Props {
  image: IntakeImage; preparing: boolean; onPick: (file: File, source: 'camera' | 'gallery') => void; onBack: () => void;
  roomType?: RoomType; onSelectRoomType: (value: RoomType) => void; goals: Set<Goal>; onToggleGoal: (goal: Goal) => void;
  note: string; onNoteChange: (value: string) => void; onSubmit: () => void;
  preferences: Preferences; onPreferencesChange: (value: Preferences) => void;
}
export function PhotoReviewContextScreen(p: Props) {
  const { t, i18n } = useTranslation();
  const update = (part: Partial<Preferences>) => p.onPreferencesChange({ ...p.preferences, ...part });
  const budget = p.preferences.budget_ceiling;
  return <div className="redesign-journey" dir={i18n.dir()}>
    <header><button onClick={p.onBack}>{t('redesignJourney.back')}</button><strong>{t('redesignJourney.title')}</strong></header>
    <img className="redesign-main-image" src={p.image.dataUrl} alt={t('redesignJourney.original')} />
    <PhotoPicker onPick={p.onPick} disabled={p.preparing}>{open => <button onClick={open}>{t('redesignJourney.changePhoto')}</button>}</PhotoPicker>
    <OptionalUserNoteInput value={p.note} onChange={p.onNoteChange} />
    <details><summary>{t('redesignJourney.goals')} · {p.goals.size || t('redesignJourney.optional')}</summary><RoomTypeSelector value={p.roomType} onSelect={p.onSelectRoomType} /><GoalChips selected={p.goals} onToggle={p.onToggleGoal} /></details>
    <details><summary>{t('redesignJourney.preserve')} · {p.preferences.preserved_items?.join('، ') || t('redesignJourney.optional')}</summary>
      <label>{t('redesignJourney.preserve')}<input className="w-full border rounded-lg p-3" maxLength={500} value={p.preferences.preserved_items?.join(', ') || ''} onChange={e => update({ preserved_items: e.target.value.split(/[,،]/).slice(0, 20) })} /></label>
    </details>
    <details><summary>{t('redesignJourney.budget')} · {budget == null ? t('redesignJourney.unspecified') : budget === 0 ? t('redesignJourney.noPurchases') : `${budget.toLocaleString(i18n.language)} ${t('redesignJourney.toman')}`}</summary>
      <label>{t('redesignJourney.budget')}<select className="w-full p-3" value={budget == null ? 'unset' : budget === 0 ? 'none' : 'limit'} onChange={e => update({ budget_ceiling: e.target.value === 'unset' ? null : e.target.value === 'none' ? 0 : 1000000 })}>
        <option value="unset">{t('redesignJourney.unspecified')}</option><option value="none">{t('redesignJourney.noPurchases')}</option><option value="limit">{t('redesignJourney.ceiling')}</option>
      </select></label>
      {budget != null && budget > 0 && <label>{t('redesignJourney.toman')}<input className="w-full border rounded-lg p-3" type="number" min="1" step="1" value={budget} onChange={e => { const amount = Number(e.target.value); if (Number.isSafeInteger(amount) && amount > 0) update({ budget_ceiling: amount }); }} /></label>}
    </details>
    <details><summary>{t('redesignJourney.style')} · {p.preferences.style?.join(', ') || t('redesignJourney.optional')}</summary><label>{t('redesignJourney.style')}<input className="w-full border rounded-lg p-3" maxLength={80} value={p.preferences.style?.[0] || ''} onChange={e => update({ style: [e.target.value] })} /></label></details>
    <button className="w-full mt-4" style={{ background: 'var(--color-surface-inverse)', color: 'var(--color-surface-default)' }} disabled={p.preparing} onClick={p.onSubmit}>{t('redesignJourney.showDesign')}</button>
  </div>;
}
