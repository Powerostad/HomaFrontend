import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRedesignChat } from './hooks/useRedesignChat';
import { AnalysisPanel } from './components/panels';
import { ImageToolbar, useImageActions } from './components/workspace';
import { HomaIntakeFlow } from './intake/HomaIntakeFlow';
import { composeIntakeText } from './intake/composeIntakeText';
import type { HomaIntakePayload } from './intake/intakeTypes';
import { ExecutionPanel } from './components/ExecutionPanel';
import './journey.css';

export function RoomRedesignPage() {
  const { sessionId: path } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const chat = useRedesignChat(path);
  const [intake, setIntake] = useState<HomaIntakePayload | null>(null);
  const [input, setInput] = useState('');
  const seeded = useRef(false);
  const selected = chat.selectedVersion;
  const original = chat.originalImage || intake?.image.dataUrl || null;
  const image = selected?.image_url || original;
  const index = chat.versions.findIndex(v => v.version_id === chat.viewedId) + 1;
  const actions = useImageActions({ image, originalImage: original, activeVersion: index, isPreview: !!selected });
  useEffect(() => {
    if (intake && chat.sessionId && !path) navigate(`/redesign/${chat.sessionId}`, { replace: true });
  }, [chat.sessionId, intake, path, navigate]);
  useEffect(() => {
    if (!intake || seeded.current || path) return;
    const timer = setTimeout(() => { seeded.current = true; void chat.sendTurn({ text: composeIntakeText(intake), images: [intake.image.dataUrl], prefsUpdate: intake.prefsUpdate }); }, 0);
    return () => clearTimeout(timer);
  }, [intake, path, chat.sendTurn]);
  const fresh = () => { setIntake(null); seeded.current = false; setInput(''); navigate('/redesign'); };
  if (chat.hydrating) return <main className="redesign-journey" aria-busy="true">{t('redesignJourney.loading')}</main>;
  if (chat.unavailable) return <main className="redesign-journey"><p role="alert">{t('redesignJourney.unavailable')}</p><button onClick={fresh}>{t('redesignJourney.newRoom')}</button></main>;
  if (!path && !intake) return <HomaIntakeFlow onStartAnalysis={setIntake} />;
  return <main className="redesign-journey" dir={i18n.dir()}>
    <header><strong>{t('redesignJourney.title')}</strong><button disabled={chat.status === 'creating'} onClick={fresh}>{t('redesignJourney.newRoom')}</button></header>
    <div className="redesign-columns">
      <section className="redesign-image-column" aria-label={t('redesignJourney.design')}>
        {image && <img className="redesign-main-image" src={image} alt={selected ? t('redesignJourney.design') : t('redesignJourney.original')} />}
        <div className="redesign-image-controls">
          <nav aria-label={t('redesignJourney.history')}>
            <button aria-pressed={chat.viewedId === 'original'} onClick={() => chat.selectVersion('original')}>{t('redesignJourney.original')}</button>
            {chat.versions.map((v, i) => <button key={v.version_id} aria-pressed={chat.viewedId === v.version_id} onClick={() => chat.selectVersion(v.version_id)}>{t('redesignJourney.version', { number: i + 1 })}</button>)}
          </nav>
          <ImageToolbar variant="bare" canCompare={actions.canCompare} onCompare={actions.onCompare} onZoom={actions.onZoom} onDownload={actions.onDownload} onShare={actions.onShare} />
        </div>
        {chat.busy && <p role="status">{chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking')}</p>}
        {chat.newVersionReady && <button onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('redesignJourney.ready')}</button>}
        {selected?.explanation && <p className="redesign-explanation">{selected.explanation}</p>}
        {chat.error && <div role="alert"><p>{chat.error}</p><button disabled={chat.busy} onClick={() => void chat.retry()}>{t('redesignJourney.retry')}</button></div>}
        {selected && <details onToggle={e => { if (e.currentTarget.open) chat.selectVersion(chat.viewedId); }}>
          <summary>{t('redesignJourney.achieve')}</summary>
          {selected.execution ? <ExecutionPanel plan={selected.execution} busy={chat.busy} onPreview={(itemId, productId) => void chat.sendTurn({ text: t('redesignJourney.preview'), action: 'preview_product', itemId, productId })} /> : <p>{t('redesignJourney.legacy')}</p>}
        </details>}
      </section>
      <section className="redesign-conversation" aria-label={t('redesignJourney.conversation')}>
        <AnalysisPanel messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip} busy={chat.busy} rendering={chat.status === 'rendering'} findings={[]} inputValue={input} onInputChange={setInput} onSend={() => { const draft = input.trim(); if (draft && !chat.busy) void chat.sendTurn({ text: draft }).then(accepted => { if (accepted) setInput(current => current.trim() === draft ? '' : current); }); }} />
      </section>
    </div>
    {actions.modals}
  </main>;
}

export default RoomRedesignPage;
