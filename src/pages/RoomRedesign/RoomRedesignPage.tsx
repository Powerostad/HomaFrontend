import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Check, History, Image, Loader2, MessageSquare, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConversationPanel } from './components/ConversationPanel';
import { ExecutionPanel } from './components/ExecutionPanel';
import { StudioImage } from './components/StudioImage';
import { ImageToolbar, useImageActions } from './components/workspace';
import { useRedesignChat } from './hooks/useRedesignChat';
import { HomaIntakeFlow } from './intake/HomaIntakeFlow';
import { composeIntakeText } from './intake/composeIntakeText';
import type { HomaIntakePayload } from './intake/intakeTypes';
import './journey.css';

export function RoomRedesignPage() {
  const { siteValue } = useSiteTranslation();
  const { sessionId: path } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const chat = useRedesignChat(path);
  const [intake, setIntake] = useState<HomaIntakePayload | null>(null);
  const [input, setInput] = useState('');
  const [section, setSection] = useState<'plan' | 'products'>('plan');
  const [mobileView, setMobileView] = useState<'room' | 'chat'>('chat');
  const seeded = useRef(false);
  const selected = chat.selectedVersion;
  const original = chat.originalImage || intake?.image.dataUrl || null;
  const image = selected?.image_url || original;
  const index = chat.versions.findIndex(v => v.version_id === chat.viewedId) + 1;
  const actions = useImageActions({ image, originalImage: original, activeVersion: index, isPreview: !!selected });
  // Promote the server identity immediately: a bookmark/reload can resume even
  // while the first render is processing. Never store conversations locally.
  useEffect(() => {
    if (chat.sessionId && !path) navigate(`/studio/chat/${chat.sessionId}`, { replace: true });
  }, [chat.sessionId, path, navigate]);
  useEffect(() => {
    if (!intake || seeded.current || path) return;
    const timer = setTimeout(() => { seeded.current = true; void chat.sendTurn({ text: composeIntakeText(intake), images: [intake.image.dataUrl], prefsUpdate: intake.prefsUpdate }); }, 0);
    return () => clearTimeout(timer);
  }, [intake, path, chat.sendTurn]);
  const previousPath = useRef(path);
  useEffect(() => {
    // Canonicalizing a newly created chat must not erase the next message draft.
    if (previousPath.current && previousPath.current !== path) setInput('');
    previousPath.current = path;
  }, [path]);
  const fresh = () => { setIntake(null); seeded.current = false; setInput(''); navigate('/studio'); };
  const sendMessage = () => {
    const draft = input.trim();
    if (!draft || chat.busy) return;
    setInput('');
    void chat.sendTurn({ text: draft }).then(accepted => {
      if (!accepted) setInput(current => current || draft);
    });
  };
  const statusText = chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking');
  const header = <header className="studio-workbench-header">
    <Link className="studio-brand" to="/" aria-label="HOMA">HOMA</Link>
    <div className="studio-workbench-title"><h1>{t('studioChat.title')}</h1><p>{t('studioChat.subtitle')}</p></div>
    <nav className="studio-workbench-nav" aria-label={t('studioChat.archive')}>
      <Button asChild variant="outline"><Link to="/studio/projects"><History size={18} aria-hidden="true" />{t('studioChat.archive')}</Link></Button>
      <Button variant="outline" disabled={chat.status === 'creating'} onClick={fresh}><Plus size={18} aria-hidden="true" />{t('studioChat.new')}</Button>
    </nav>
  </header>;
  if (chat.hydrating) return <main className="redesign-journey" dir={i18n.dir()}>{header}<div className="studio-page-state" role="status"><Loader2 size={28} className="studio-spinner" aria-hidden="true" /><h2>{t('studioChat.loading')}</h2></div></main>;
  if (chat.unavailable) return <main className="redesign-journey" dir={i18n.dir()}>{header}<div className="studio-page-state" role="alert"><h2>{t('studioChat.unavailableTitle')}</h2><p>{t('redesignJourney.unavailable')}</p><Button asChild><Link to="/studio/projects">{t('studioChat.archive')}</Link></Button></div></main>;
  if (!path && !intake) return <HomaIntakeFlow onStartAnalysis={setIntake} />;
  return <main className="redesign-journey" dir={i18n.dir()}>
    {header}
    <div className="studio-session-status">{chat.sessionId ? <><Check size={16} aria-hidden="true" />{t('studioChat.saved')}</> : <><Loader2 size={16} className="studio-spinner" aria-hidden="true" />{t('studioChat.saving')}</>}</div>
    <nav className="studio-mobile-nav" aria-label={t('studioChat.title')}>
      <Button variant="ghost" aria-pressed={mobileView === 'room'} onClick={() => setMobileView('room')}><Image size={18} />{t('studioChat.room')}</Button>
      <Button variant="ghost" aria-pressed={mobileView === 'chat'} onClick={() => setMobileView('chat')}><MessageSquare size={18} />{t('studioChat.chat')}</Button>
    </nav>
    <div className="redesign-columns" data-mobile-view={mobileView}>
      <section className="redesign-image-column" aria-label={t('studioChat.room')}>
        <div className="studio-canvas">
          <div className="studio-canvas-heading"><h2>{selected ? t('redesignJourney.version', { number: index }) : t('redesignJourney.original')}</h2><ImageToolbar variant="bare" canCompare={actions.canCompare} onCompare={actions.onCompare} onZoom={actions.onZoom} onDownload={actions.onDownload} onShare={actions.onShare} /></div>
          {image ? <StudioImage image={image} versionKey={chat.viewedId}
            alt={selected ? t('redesignJourney.design') : t('redesignJourney.original')}
            onRefresh={() => chat.selectVersion(chat.viewedId)} /> : <div className="studio-image-placeholder"><Image size={32} aria-hidden="true" /><p>{t('studioChat.noImage')}</p></div>}
          <nav className="studio-version-strip" aria-label={t('redesignJourney.history')}>
            <Button variant="ghost" aria-pressed={chat.viewedId === 'original'} onClick={() => chat.selectVersion('original')}>{original && <img src={original} alt="" />}{t('redesignJourney.original')}</Button>
            {chat.versions.map((version, versionIndex) => <Button variant="ghost" key={version.version_id} aria-pressed={chat.viewedId === version.version_id} onClick={() => chat.selectVersion(version.version_id)}><img src={version.image_url} alt="" loading="lazy" />{t('redesignJourney.version', { number: versionIndex + 1 })}</Button>)}
          </nav>
          <p className="studio-canvas-hint">{t('studioChat.previewHint')}</p>
        </div>
        {chat.busy && <div className="studio-processing studio-processing--canvas" role="status"><Loader2 size={18} className="studio-spinner" aria-hidden="true" /><span>{statusText}</span></div>}
        {chat.newVersionReady && <Button onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('redesignJourney.ready')}</Button>}
        {chat.error && <div className="studio-error" role="alert"><p>{siteValue(chat.error)}</p><Button variant="outline" disabled={chat.busy} onClick={() => void chat.retry()}>{t('redesignJourney.retry')}</Button></div>}
        <div className="studio-design-guide">
          <nav className="studio-guide-tabs" aria-label={t('redesignJourney.achieve')}>
            <Button variant="ghost" aria-pressed={section === 'plan'} onClick={() => setSection('plan')}>{t('studioChat.plan')}</Button>
            <Button variant="ghost" aria-pressed={section === 'products'} onClick={() => setSection('products')}><ShoppingBag size={16} />{t('studioChat.products')}{selected?.execution && <span className="studio-count">{selected.execution.purchases.length.toLocaleString(i18n.language)}</span>}</Button>
          </nav>
          {selected?.execution ? <ExecutionPanel section={section} plan={selected.execution} busy={chat.busy} onPreview={(itemId, productId) => void chat.sendTurn({ text: t('redesignJourney.preview'), action: 'preview_product', itemId, productId })} />
            : <div className="studio-empty-note">{selected?.explanation && <p className="redesign-explanation">{siteValue(selected.explanation)}</p>}<p>{t(selected ? 'redesignJourney.legacy' : chat.versions.length ? 'studioChat.selectDesignHint' : 'studioChat.noPlan')}</p>{!selected && !!chat.versions.length && <Button variant="outline" className="mt-4" onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('studioChat.latest')}</Button>}</div>}
        </div>
      </section>
      <section className="redesign-conversation" aria-label={t('studioChat.chat')}>
        <ConversationPanel messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip} busy={chat.busy} statusText={statusText} value={input} onChange={setInput} onSend={sendMessage} />
      </section>
    </div>
    {actions.modals}
  </main>;
}

export default RoomRedesignPage;
