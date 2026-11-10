import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GOALS, ROOM_TYPES, type HomaIntakePayload } from './intakeTypes';
import type { UseIntakeFlow } from './useIntakeFlow';

type Preferences = NonNullable<HomaIntakePayload['prefsUpdate']>;

/** Optional help edits the same draft. Finishing never submits or starts analysis. */
export function IntakeGuide({ flow, preferences, update }: { flow:UseIntakeFlow; preferences:Preferences; update:(part:Partial<Preferences>) => void }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const headings = ['studioWorkspace.roomType', 'studioWorkspace.briefLabel', 'redesignJourney.preserve', 'redesignJourney.style', 'redesignJourney.budget'];
  return <Dialog open={open} onOpenChange={value => { setOpen(value); if (value) setStep(0); }}>
    <DialogTrigger asChild><Button type="button" variant="outline">{t('studioGuide.guidedHelp')}</Button></DialogTrigger>
    <DialogContent className="studio-intake-guide" dir={i18n.dir()}>
      <DialogHeader><DialogTitle>{t('studioGuide.guidedHelp')}</DialogTitle><DialogDescription>{t('studioGuide.guideHint')}</DialogDescription></DialogHeader>
      <p aria-live="polite">{t('studioGuide.step', { number:step + 1, total:5 })}</p>
      <h3>{t(headings[step])}</h3>
      {step === 0 && <div className="studio-guide-options">{ROOM_TYPES.map(room => <Button key={room.value} type="button" variant="outline" aria-pressed={flow.roomType === room.value} onClick={() => flow.setRoomType(room.value)}>{t(`studioWorkspace.rooms.${room.value}`)}</Button>)}</div>}
      {step === 1 && <><label htmlFor="guided-note">{t('studioWorkspace.briefLabel')}</label><Textarea id="guided-note" rows={3} maxLength={2000} value={flow.note} onChange={event => flow.setNote(event.target.value)} /><div className="studio-guide-options">{GOALS.map(goal => <Button key={goal.value} type="button" variant="outline" aria-pressed={flow.goals.has(goal.value)} onClick={() => flow.toggleGoal(goal.value)}>{t(`studioWorkspace.goals.${goal.value}`)}</Button>)}</div></>}
      {step === 2 && <><label htmlFor="guided-preserve">{t('redesignJourney.preserve')}</label><Input id="guided-preserve" maxLength={500} value={preferences.preserved_items?.join('، ') || ''} onChange={event => update({ preserved_items:event.target.value.split(/[,،]/).slice(0,20) })} /></>}
      {step === 3 && <><label htmlFor="guided-style">{t('redesignJourney.style')}</label><Input id="guided-style" maxLength={80} value={preferences.style?.[0] || ''} onChange={event => update({ style:[event.target.value] })} /></>}
      {step === 4 && <><label htmlFor="guided-budget">{t('redesignJourney.ceiling')} ({t('redesignJourney.toman')})</label><Input id="guided-budget" type="number" min="0" step="1" value={preferences.budget_ceiling ?? ''} placeholder={t('redesignJourney.unspecified')} onChange={event => { const value = event.target.value; const amount = Number(value); if (!value) update({ budget_ceiling:null }); else if (Number.isSafeInteger(amount) && amount >= 0) update({ budget_ceiling:amount }); }} /></>}
      <div className="studio-guide-actions">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(value => value - 1)}>{t('redesignJourney.back')}</Button>
        <Button type="button" variant="outline" onClick={() => step === 4 ? setOpen(false) : setStep(value => value + 1)}>{t(step === 4 ? 'studioGuide.doneGuide' : 'studioGuide.skip')}</Button>
        {step < 4 && <Button type="button" onClick={() => setStep(value => value + 1)}>{t('studioGuide.next')}</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
