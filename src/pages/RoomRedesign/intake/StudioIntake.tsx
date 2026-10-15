import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpRight, Camera, Check, History, ImagePlus, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GOALS, ROOM_TYPES, type HomaIntakePayload } from './intakeTypes';
import { useIntakeFlow } from './useIntakeFlow';

/** Photo-first Studio entry. Picking a file never starts a paid request. */
export function StudioIntake({ onStartAnalysis }: { onStartAnalysis: (payload: HomaIntakePayload) => void }) {
  const { t, i18n } = useTranslation();
  const flow = useIntakeFlow();
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preferences, setPreferences] = useState<NonNullable<HomaIntakePayload['prefsUpdate']>>({});
  const update = (part: Partial<typeof preferences>) => setPreferences(current => ({ ...current, ...part }));
  const pick = (file: File | undefined, source: 'camera' | 'gallery') => {
    if (file && !flow.preparing) void flow.pickImage(file, source);
  };
  const start = () => {
    const payload = flow.buildPayload();
    if (!payload || flow.preparing) return;
    onStartAnalysis({ ...payload, prefsUpdate: { ...preferences, goals: payload.goals,
      room_type: payload.roomType && payload.roomType !== 'not_sure' ? payload.roomType : undefined,
      preserved_items: preferences.preserved_items?.map(value => value.trim()).filter(Boolean),
      style: preferences.style?.map(value => value.trim()).filter(Boolean) } });
  };

  return <div className="studio-editorial-page" dir={i18n.dir()}>
    <Header />
    <main className="studio-entry">
      <div className="studio-entry-topline"><span className="studio-editorial-label">HOMA / {t('studioWorkspace.studio')}</span><Button asChild variant="ghost"><Link to="/studio/projects"><History size={16} aria-hidden="true" />{t('studioChat.archive')}</Link></Button></div>
      <div className="studio-entry-layout" dir="ltr">
        <figure className="studio-entry-photo" dir={i18n.dir()}>
          <img src={flow.image?.dataUrl || '/images/studio/example-good.webp'} alt={t(flow.image ? 'redesignJourney.original' : 'studioWorkspace.exampleAlt')} />
          <figcaption><span>{t(flow.image ? 'studioWorkspace.yourRoom' : 'studioWorkspace.exampleLabel')}</span><span>{t(flow.image ? 'studioWorkspace.photoReady' : 'studioWorkspace.exampleCaption')}</span></figcaption>
          {flow.image && <Button variant="outline" className="studio-replace-photo" disabled={flow.preparing} onClick={() => gallery.current?.click()}><ImagePlus size={16} aria-hidden="true" />{t('redesignJourney.changePhoto')}</Button>}
        </figure>
        <section className="studio-entry-content" dir={i18n.dir()}>
          <ol className="studio-entry-steps" aria-label={t('studioWorkspace.startSteps')}><li data-current={!flow.image}>{flow.image ? <Check size={14} aria-hidden="true" /> : <span>01</span>}{t('studioWorkspace.photoStep')}</li><li data-current={!!flow.image}><span>02</span>{t('studioWorkspace.detailsStep')}</li></ol>
          <h1>{t(flow.image ? 'studioWorkspace.reviewTitle' : 'studioWorkspace.entryTitle')}</h1>
          <p className="studio-entry-intro">{t(flow.image ? 'studioWorkspace.reviewHint' : 'studioWorkspace.entryHint')}</p>
          {!flow.image ? <>
            <div className="studio-photo-drop" data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files[0], 'gallery'); }}>
              <ImagePlus size={28} strokeWidth={1.25} aria-hidden="true" />
              <h2>{t('studioWorkspace.uploadTitle')}</h2><p>{t('studioWorkspace.dropHint')}</p>
              <Button disabled={flow.preparing} onClick={() => gallery.current?.click()}>{flow.preparing ? <Loader2 className="studio-spinner" size={18} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}{t(flow.preparing ? 'studioWorkspace.preparing' : 'studioWorkspace.choosePhoto')}</Button>
              <Button variant="ghost" disabled={flow.preparing} onClick={() => camera.current?.click()}><Camera size={16} aria-hidden="true" />{t('studioWorkspace.takePhoto')}</Button>
              <small>{t('studioWorkspace.fileHint')}</small>
            </div>
            <div className="studio-photo-guidance"><h3>{t('studioWorkspace.photoTips')}</h3><p>{t('studioWorkspace.photoTipsHint')}</p></div>
          </> : <form className="studio-brief" onSubmit={event => { event.preventDefault(); start(); }}>
            <label htmlFor="studio-brief-note">{t('studioWorkspace.briefLabel')} <span>{t('redesignJourney.optional')}</span></label>
            <Textarea id="studio-brief-note" rows={3} maxLength={2000} value={flow.note} onChange={event => flow.setNote(event.target.value)} placeholder={t('studioWorkspace.briefPlaceholder')} />
            <details className="studio-brief-options"><summary>{t('studioWorkspace.preferences')}</summary>
              <label htmlFor="studio-room-type">{t('studioWorkspace.roomType')}</label><select id="studio-room-type" value={flow.roomType || ''} onChange={event => { const room = ROOM_TYPES.find(option => option.value === event.target.value); if (room) flow.setRoomType(room.value); else if (flow.roomType) flow.setRoomType(flow.roomType); }}><option value="">{t('redesignJourney.unspecified')}</option>{ROOM_TYPES.map(room => <option key={room.value} value={room.value}>{t(`studioWorkspace.rooms.${room.value}`)}</option>)}</select>
              <fieldset><legend>{t('redesignJourney.goals')}</legend><div className="studio-brief-goals">{GOALS.map(goal => <label key={goal.value}><input type="checkbox" checked={flow.goals.has(goal.value)} onChange={() => flow.toggleGoal(goal.value)} /><span>{t(`studioWorkspace.goals.${goal.value}`)}</span></label>)}</div></fieldset>
              <label htmlFor="studio-preserve">{t('redesignJourney.preserve')}</label><Input id="studio-preserve" maxLength={500} value={preferences.preserved_items?.join('، ') || ''} onChange={event => update({ preserved_items: event.target.value.split(/[,،]/).slice(0, 20) })} />
              <label htmlFor="studio-style">{t('redesignJourney.style')}</label><Input id="studio-style" maxLength={80} value={preferences.style?.[0] || ''} onChange={event => update({ style: [event.target.value] })} />
              <label htmlFor="studio-budget-mode">{t('redesignJourney.budget')}</label><select id="studio-budget-mode" value={preferences.budget_ceiling == null ? 'unset' : preferences.budget_ceiling === 0 ? 'none' : 'limit'} onChange={event => update({ budget_ceiling: event.target.value === 'unset' ? null : event.target.value === 'none' ? 0 : 1000000 })}><option value="unset">{t('redesignJourney.unspecified')}</option><option value="none">{t('redesignJourney.noPurchases')}</option><option value="limit">{t('redesignJourney.ceiling')}</option></select>
              {preferences.budget_ceiling != null && preferences.budget_ceiling > 0 && <><label htmlFor="studio-budget">{t('redesignJourney.ceiling')} ({t('redesignJourney.toman')})</label><Input id="studio-budget" type="number" min="1" step="1" value={preferences.budget_ceiling} onChange={event => { const amount = Number(event.target.value); if (Number.isSafeInteger(amount) && amount > 0) update({ budget_ceiling: amount }); }} /></>}
            </details>
            {flow.imageTooSmall && <p className="studio-photo-warning">{t('studioWorkspace.smallPhoto')}</p>}
            <Button className="studio-start-button" type="submit" disabled={flow.preparing}>{flow.preparing ? <Loader2 size={18} className="studio-spinner" aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}{t(flow.preparing ? 'studioWorkspace.preparing' : 'studioWorkspace.start')}</Button>
            <p className="studio-entry-promise">{t('studioWorkspace.startHint')}</p>
          </form>}
          {flow.error && <p className="studio-entry-error" role="alert">{t('studioWorkspace.photoError')}</p>}
          <div className="studio-entry-footer"><Check size={16} aria-hidden="true" /><p>{t('studioWorkspace.savedHint')}</p></div>
        </section>
      </div>
      <input className="sr-only" tabIndex={-1} aria-label={t('studioWorkspace.choosePhoto')} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" ref={gallery} disabled={flow.preparing} onChange={event => { pick(event.target.files?.[0], 'gallery'); event.target.value = ''; }} />
      <input className="sr-only" tabIndex={-1} aria-label={t('studioWorkspace.takePhoto')} type="file" accept="image/*" capture="environment" ref={camera} disabled={flow.preparing} onChange={event => { pick(event.target.files?.[0], 'camera'); event.target.value = ''; }} />
    </main>
  </div>;
}
