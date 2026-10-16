import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Check, History, Image, Loader2, MessageSquare, Plus, ShoppingBag, List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConversationPanel } from './components/ConversationPanel';
import { ExecutionPanel } from './components/ExecutionPanel';
import { StudioImage } from './components/StudioImage';
import { SessionDiagnostics } from './components/SessionDiagnostics';
import { PerformancePanel } from './components/PerformancePanel';
import { ImageToolbar, useImageActions } from './components/workspace';
import { useRedesignChat } from './hooks/useRedesignChat';
import { useMediaQuery } from './hooks/useMediaQuery';
import { StudioIntake } from './intake/StudioIntake';
import { composeIntakeText } from './intake/composeIntakeText';
import type { HomaIntakePayload } from './intake/intakeTypes';
import './journey.css';
import './workbench.css';

export function RoomRedesignPage() {
  const { siteValue } = useSiteTranslation();
  const { sessionId: path } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const chat = useRedesignChat(path);
  const [intake, setIntake] = useState<HomaIntakePayload | null>(null);
  const [input, setInput] = useState('');
  const compact = useMediaQuery('(max-width: 767px)');
  const [section, setSection] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'image' : 'conversation');
  const tabList = useRef<HTMLDivElement>(null);
  const openSection = (value: string) => {
    setSection(value);
    if (compact) requestAnimationFrame(() => tabList.current?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  const seeded = useRef(false);
  const selected = chat.selectedVersion;
  // Comparing with the original photo must not hide the latest design report.
  const report = selected || chat.versions[chat.versions.length - 1];
  // Catalogue/design results belong to the validated analysis, not a successful
  // image. Keep immutable version reports when a rendered version is selected.
  const execution = report?.execution || (!report ? chat.currentExecution : null);
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
    if (previousPath.current && previousPath.current !== path) { setInput(''); setSection('conversation'); }
    previousPath.current = path;
  }, [path]);
  const fresh = () => { setIntake(null); seeded.current = false; setInput(''); setSection('conversation'); navigate('/studio'); };
  const sendMessage = () => {
    const draft = input.trim();
    if (!draft || chat.busy) return;
    setInput('');
    void chat.sendTurn({ text: draft }).then(accepted => {
      if (!accepted) setInput(current => current || draft);
    });
  };
  const statusText = chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking');
  const header = <div className="studio-workbench-header">
    <div className="studio-workbench-title"><p className="studio-editorial-label">HOMA / {t('studioWorkspace.studio')}</p><h1>{t('studioCollection.workspaceTitle')}</h1></div>
    <nav className="studio-workbench-nav" aria-label={t('studioChat.archive')}>
      {chat.sessionId && <SessionDiagnostics key={chat.sessionId} sessionId={chat.sessionId} busy={chat.busy} />}
      <Button asChild variant="outline"><Link to="/studio/projects"><History size={18} aria-hidden="true" />{t('studioChat.archive')}</Link></Button>
      <Button disabled={chat.status === 'creating'} onClick={fresh}><Plus size={18} aria-hidden="true" />{t('studioChat.new')}</Button>
    </nav>
  </div>;
  if (chat.hydrating) return <div className="studio-editorial-page" dir={i18n.dir()}><Header /><main className="redesign-journey">{header}<div className="studio-page-state" role="status"><Loader2 size={28} className="studio-spinner" aria-hidden="true" /><h2>{t('studioChat.loading')}</h2></div></main></div>;
  if (chat.unavailable) return <div className="studio-editorial-page" dir={i18n.dir()}><Header /><main className="redesign-journey">{header}<div className="studio-page-state" role="alert"><h2>{t('studioChat.unavailableTitle')}</h2><p>{t('redesignJourney.unavailable')}</p><Button asChild><Link to="/studio/projects">{t('studioChat.archive')}</Link></Button></div></main></div>;
  if (!path && !intake) return <StudioIntake onStartAnalysis={setIntake} />;
  return <div className="studio-editorial-page studio-workbench-page" dir={i18n.dir()}><Header /><main className="redesign-journey">
    {header}
    <div className="studio-session-status">{chat.busy ? <span role="status"><Loader2 size={16} className="studio-spinner" aria-hidden="true" />{statusText}</span> : chat.sessionId ? <><Check size={16} aria-hidden="true" />{t('studioChat.saved')}</> : <><Loader2 size={16} className="studio-spinner" aria-hidden="true" />{t('studioChat.saving')}</>}</div>
    {chat.error && <div className="studio-error" role="alert"><p>{siteValue(chat.error)}</p><Button variant="outline" disabled={chat.busy} onClick={() => void chat.retry()}>{t('redesignJourney.retry')}</Button></div>}
    <Tabs className="studio-workbench" dir={i18n.dir()} value={section} onValueChange={openSection} data-section={section}>
      <TabsList ref={tabList} className="studio-workspace-tablist" aria-label={t('studioWorkspace.workspace')}>
        <TabsTrigger value="image"><Image size={18} aria-hidden="true" />{t('studioCollection.image')}</TabsTrigger>
        <TabsTrigger value="conversation"><MessageSquare size={18} aria-hidden="true" />{t('studioWorkspace.conversation')}</TabsTrigger>
        <TabsTrigger value="plan"><List size={18} aria-hidden="true" />{t('studioChat.plan')}</TabsTrigger>
        <TabsTrigger value="products"><ShoppingBag size={18} aria-hidden="true" />{t('studioWorkspace.products')}{execution && <span className="studio-count">{execution.purchases.length.toLocaleString(i18n.language)}</span>}</TabsTrigger>
      </TabsList>
      <div className="redesign-columns" dir="ltr">
      <TabsContent value="image" forceMount hidden={compact && section !== 'image'} className="redesign-image-column" dir={i18n.dir()} aria-label={t('studioChat.room')}>
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
        {chat.newVersionReady && <Button onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('redesignJourney.ready')}</Button>}
        <div className="studio-canvas-next"><Button variant="outline" onClick={() => openSection('products')}><ShoppingBag size={18} aria-hidden="true" />{t('studioCollection.exploreProducts')}</Button><Button onClick={() => openSection('conversation')}><MessageSquare size={18} aria-hidden="true" />{t('studioWorkspace.refine')}</Button></div>
      </TabsContent>
      <section className="studio-workspace-panel" hidden={section === 'image'} dir={i18n.dir()} aria-label={t('studioWorkspace.workspace')}>
          <TabsContent className="redesign-conversation" value="conversation" forceMount hidden={section !== 'conversation'}>
            <ConversationPanel active={section === 'conversation'} messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip} busy={chat.busy} failed={!!chat.error} statusText={statusText} value={input} onChange={setInput} onSend={sendMessage} />
          </TabsContent>
          {(['plan', 'products'] as const).map(panel => <TabsContent className="studio-workspace-report" value={panel} key={panel}>
            <div className="studio-report-context"><span>{report ? t('redesignJourney.version', { number: chat.versions.indexOf(report) + 1 }) : t(execution ? 'studioChat.plan' : 'studioWorkspace.awaitingDesign')}</span><Button variant="ghost" onClick={() => openSection('conversation')}><MessageSquare size={16} aria-hidden="true" />{t('studioWorkspace.refine')}</Button></div>
            {execution ? <ExecutionPanel section={panel} plan={execution} busy={chat.busy} onPreview={(itemId, productId) => { openSection('conversation'); void chat.sendTurn({ text: '', action: 'preview_product', itemId, productId }); }} />
              : <div className="studio-empty-note">{report?.explanation && <p className="redesign-explanation">{siteValue(report.explanation)}</p>}<p>{t(report ? 'redesignJourney.legacy' : 'studioChat.noPlan')}</p></div>}
          </TabsContent>)}
      </section>
    </div>
    </Tabs>
    {actions.modals}
    {chat.sessionId && (execution || chat.error || report || chat.messages.length > 0) && <PerformancePanel sessionId={chat.sessionId} busy={chat.busy} />}
  </main></div>;
}

export default RoomRedesignPage;
