import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useBasket } from '@/context/BasketContext';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Check, History, Loader2, MessageSquare, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DesktopHeroPanel, MobileHeroSection } from '../Studio/result/HeroImagePanel';
import { CollectionSummary } from '../Studio/result/CollectionSummary';
import { PerformancePanel } from './components/PerformancePanel';
import { SessionDiagnostics } from './components/SessionDiagnostics';
import { StudioConversationDrawer } from './components/StudioConversationDrawer';
import { StudioFlowReport } from './components/StudioFlowReport';
import { useImageActions } from './components/workspace';
import { useRedesignChat } from './hooks/useRedesignChat';
import { useMediaQuery } from './hooks/useMediaQuery';
import { StudioIntake } from './intake/StudioIntake';
import { composeIntakeText } from './intake/composeIntakeText';
import type { HomaIntakePayload } from './intake/intakeTypes';
import './journey.css';
import '../Studio/result/studio-result.css';
import './studio-flow.css';

export function RoomRedesignPage() {
  const { siteValue } = useSiteTranslation();
  const { sessionId: path } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const chat = useRedesignChat(path);
  const basket = useBasket();
  const compact = useMediaQuery('(max-width: 1199px)');
  const [intake, setIntake] = useState<HomaIntakePayload | null>(null);
  const [input, setInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [phase, setPhase] = useState<'analysis' | 'recommendations' | 'basket'>('analysis');
  const lastVersion = useRef<string | null>(null);
  const seeded = useRef(false);
  const selected = chat.selectedVersion;
  const report = selected || chat.versions.find(version => version.version_id === lastVersion.current) || chat.versions[chat.versions.length - 1];
  const execution = report?.execution || (!report ? chat.currentExecution : null);
  const original = chat.originalImage || intake?.image.dataUrl || null;
  const image = selected?.image_url || original;
  useEffect(() => setImageFailed(false), [image]);
  const index = chat.versions.findIndex(version => version.version_id === chat.viewedId) + 1;
  const actions = useImageActions({ image, originalImage: original, activeVersion: index, isPreview: !!selected });
  const refreshedVersion = useRef<string | null>(null);
  if (selected) lastVersion.current = selected.version_id;
  useEffect(() => {
    if (chat.sessionId && !path) navigate(`/studio/chat/${chat.sessionId}`, { replace: true });
  }, [chat.sessionId, path, navigate]);
  useEffect(() => {
    if (!intake || seeded.current || path) return;
    const timer = setTimeout(() => {
      seeded.current = true;
      void chat.sendTurn({ text: composeIntakeText(intake), images: [intake.image.dataUrl], prefsUpdate: intake.prefsUpdate });
    }, 0);
    return () => clearTimeout(timer);
  }, [intake, path, chat.sendTurn]);
  const previousPath = useRef(path);
  useEffect(() => {
    if (previousPath.current && previousPath.current !== path) { setInput(''); setChatOpen(false); lastVersion.current = null; refreshedVersion.current = null; }
    previousPath.current = path;
  }, [path]);
  const fresh = () => { setIntake(null); seeded.current = false; setInput(''); setChatOpen(false); navigate('/studio'); };
  const sendMessage = () => {
    const draft = input.trim();
    if (!draft || chat.busy) return;
    setInput('');
    void chat.sendTurn({ text: draft }).then(accepted => { if (!accepted) setInput(current => current || draft); });
  };
  const goToPhase = (next: typeof phase) => {
    setPhase(next);
    document.getElementById(`section-${next === 'recommendations' ? 'products' : next}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const openChat = () => {
    setChatOpen(true);
    if (!compact) window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    const update = () => {
      const threshold = window.innerHeight * 0.42;
      const products = document.getElementById('section-products');
      const checkout = document.getElementById('section-basket');
      setPhase(checkout && checkout.getBoundingClientRect().top <= threshold ? 'basket'
        : products && products.getBoundingClientRect().top <= threshold ? 'recommendations' : 'analysis');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [execution]);
  const statusText = chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking');
  const header = <div className="studio-flow-heading studio-result-heading">
    <div><p className="studio-result-eyebrow">HOMA / {t('studioWorkspace.studio')}</p><h1>{t('studioCollection.workspaceTitle')}</h1></div>
    <nav className="studio-flow-navigation" aria-label={t('studioChat.archive')}>
      {chat.sessionId && <SessionDiagnostics key={chat.sessionId} sessionId={chat.sessionId} busy={chat.busy} />}
      <Button asChild variant="ghost"><Link to="/studio/projects"><History size={16} aria-hidden="true" />{t('studioChat.archive')}</Link></Button>
      <Button variant="outline" disabled={chat.status === 'creating'} onClick={fresh}><Plus size={16} aria-hidden="true" />{t('studioChat.new')}</Button>
    </nav>
  </div>;
  if (chat.hydrating || chat.unavailable) return <div className="studio-result-page studio-conversation-flow" dir={i18n.dir()}><Header /><main className="studio-archive-page">{header}<div className="studio-page-state" role={chat.unavailable ? 'alert' : 'status'}>{chat.unavailable ? <><h2>{t('studioChat.unavailableTitle')}</h2><p>{t('redesignJourney.unavailable')}</p><Button asChild><Link to="/studio/projects">{t('studioChat.archive')}</Link></Button></> : <><Loader2 className="studio-spinner" aria-hidden="true" /><p>{t('studioChat.loading')}</p></>}</div></main></div>;
  if (!path && !intake) return <StudioIntake onStartAnalysis={setIntake} />;
  const hero = {
    resultImage: report?.image_url || original || '', originalImage: original, showOriginal: !selected,
    isSaved: !!chat.sessionId, isDownloading: actions.isDownloading, analysisOnly: !report?.image_url, showSave: false,
    onToggleOriginal: (show: boolean) => chat.selectVersion(show ? 'original' : lastVersion.current || report?.version_id || 'original'),
    onToggleSaved: () => {}, onDownload: actions.onDownload, onFullscreen: actions.onZoom,
    onExit: () => navigate('/studio/projects'),
    onImageError: () => {
      setImageFailed(true);
      if (selected && refreshedVersion.current !== selected.version_id) {
        refreshedVersion.current = selected.version_id;
        chat.selectVersion(selected.version_id);
      }
    },
  };
  return <div className="studio-result-page studio-conversation-flow" dir={i18n.dir()}>
    <Header />
    <main className="studio-result-main" dir="ltr">
      <section className="studio-result-hero studio-flow-hero" aria-label={t('studioChat.room')}>
        <div className="studio-flow-hero-frame"><DesktopHeroPanel {...hero} /><MobileHeroSection {...hero} /></div>
        <div className="studio-flow-hero-footer" dir={i18n.dir()}>
          {imageFailed && <div className="studio-flow-error" role="alert"><p>{t('redesignJourney.imageUnavailable')}</p><Button variant="outline" onClick={() => chat.selectVersion(chat.viewedId)}>{t('redesignJourney.reloadImage')}</Button></div>}
          <nav className="studio-flow-versions" aria-label={t('redesignJourney.history')}>
            <Button variant="outline" aria-pressed={chat.viewedId === 'original'} onClick={() => chat.selectVersion('original')}>{t('redesignJourney.original')}</Button>
            {chat.versions.map((version, number) => <Button variant="outline" key={version.version_id} aria-pressed={chat.viewedId === version.version_id} onClick={() => chat.selectVersion(version.version_id)}>{t('redesignJourney.version', { number: number + 1 })}</Button>)}
          </nav>
          <Button className="studio-flow-chat-trigger" onClick={openChat} aria-expanded={chatOpen}><MessageSquare size={18} aria-hidden="true" />{t('studioWorkspace.refine')}</Button>
          {chat.newVersionReady && <Button variant="outline" onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('redesignJourney.ready')}</Button>}
        </div>
      </section>
      <section className="studio-result-content studio-flow-content" dir={i18n.dir()} data-chat-open={chatOpen && !compact}>
        <StudioConversationDrawer open={chatOpen} onOpenChange={setChatOpen} compact={compact}
          error={chat.error ? siteValue(chat.error) : null} onRetry={() => void chat.retry()}
          messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip}
          busy={chat.busy} failed={!!chat.error} statusText={statusText} value={input} onChange={setInput} onSend={sendMessage} />
        <div className="studio-flow-report" hidden={chatOpen && !compact}>
        {header}
        <div className="studio-flow-status" role="status">{chat.busy ? <><Loader2 size={16} className="studio-spinner" aria-hidden="true" />{statusText}</> : <><Check size={16} aria-hidden="true" />{t(chat.sessionId ? 'studioChat.saved' : 'studioChat.saving')}</>}</div>
        {chat.error && <div className="studio-flow-error" role="alert"><p>{siteValue(chat.error)}</p><Button variant="outline" disabled={chat.busy} onClick={() => void chat.retry()}>{t('redesignJourney.retry')}</Button></div>}
        {execution ? <StudioFlowReport plan={execution} busy={chat.busy} onOpenBasket={basket.openBasket} onPreview={(itemId, productId) => {
          openChat();
          void chat.sendTurn({ text: '', action: 'preview_product', itemId, productId });
        }} /> : <section id="section-analysis" className="studio-empty-state">{report?.explanation && <p>{siteValue(report.explanation)}</p>}<p>{t(report ? 'redesignJourney.legacy' : 'studioChat.noPlan')}</p><Button onClick={openChat}>{t('studioChat.chat')}</Button></section>}
        {chat.sessionId && (execution || chat.error || report || chat.messages.length > 0) && <PerformancePanel sessionId={chat.sessionId} busy={chat.busy} />}
        </div>
      </section>
    </main>
    <CollectionSummary activePhase={phase} onNavigateToPhase={goToPhase} selectedPrice={basket.totalRial} selectedCount={basket.itemCount} totalRecommendations={execution?.purchases.length || 0} onOpenChat={openChat} chatOpen={chatOpen} />
    {actions.modals}
  </div>;
}

export default RoomRedesignPage;
