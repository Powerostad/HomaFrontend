import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { History, Loader2, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StudioResultView } from '../Studio/ResultPage';
import { ExecutionPanel } from './components/ExecutionPanel';
import { SessionDiagnostics } from './components/SessionDiagnostics';
import { StudioImageExport } from './components/StudioImageExport';
import { StudioConversationDrawer } from './components/StudioConversationDrawer';
import { StudioDiscovery } from './components/StudioDiscovery';
import { useConversationStudioResult } from './hooks/useConversationStudioResult';
import { useRedesignChat } from './hooks/useRedesignChat';
import { useMediaQuery } from './hooks/useMediaQuery';
import { StudioIntake } from './intake/StudioIntake';
import { composeIntakeText } from './intake/composeIntakeText';
import type { HomaIntakePayload } from './intake/intakeTypes';
import type { ExecutionPlan } from './services/redesignChatService';
import { buildDiscoveryReview } from './services/discoveryReview';
import './journey.css';
import './studio-conversation.css';

type Chat = ReturnType<typeof useRedesignChat>;

export function ConversationResult({ chat, plan, versionId, resultImage, originalImage, onToggleOriginal, onImageError, compact, chatOpen, setChatOpen, input, setInput, sendMessage, fresh }: {
  chat: Chat; plan: ExecutionPlan | null; versionId: string; resultImage: string; originalImage: string | null;
  onToggleOriginal: (show: boolean) => void; onImageError: () => void; compact: boolean;
  chatOpen: boolean; setChatOpen: (open: boolean) => void; input: string; setInput: (value: string) => void;
  sendMessage: () => void; fresh: () => void;
}) {
  const { t } = useTranslation();
  const { siteValue, siteText } = useSiteTranslation();
  const navigate = useNavigate();
  const openChat = () => { setChatOpen(true); if (!compact) window.scrollTo({ top: 0, behavior: 'instant' }); };
  const state = useConversationStudioResult({ plan, sessionId: chat.sessionId, versionId, resultImage, originalImage,
    showOriginal: chat.viewedId === 'original', onToggleOriginal, onOpenChat: openChat,
    onChooseProduct: product => {
      if (chat.busy || !product.studioItemId || !product.studioProductId) return;
      openChat();
      void chat.sendTurn({ text: '', action: 'select_product', itemId: product.studioItemId, productId: product.studioProductId,
        variantId: product.variantId, placementId: product.studioPlacementId });
    } });
  const statusText = chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking');
  return <StudioResultView state={state} conversation={{
    open: chatOpen, compact, onOpen: openChat, onClose: () => setChatOpen(false), onExit: () => navigate('/studio/projects'), busy: chat.busy,
    priceUnknown: !!plan?.unknown_cost_item_ids.length, onImageError,
    printReview: buildDiscoveryReview(plan),
    onRefineProduct: async (product, text) => {
      if (!product.studioItemId || !product.studioProductId || chat.busy || !text.trim()) return false;
      openChat();
      return chat.sendTurn({ text, action: plan?.search_version ? 'review_product' : 'chat',
        itemId: product.studioItemId, productId: product.studioProductId, variantId: product.variantId,
        placementId: product.studioPlacementId, reviewKind: 'verify_specification' });
    },
    onPreview: product => {
      if (product.studioItemId && product.studioProductId && !chat.busy) { openChat(); void chat.sendTurn({ text: '', action: 'preview_product', itemId: product.studioItemId, productId: product.studioProductId, variantId: product.variantId, placementId: product.studioPlacementId }); }
    },
    panel: <StudioConversationDrawer open={chatOpen} onOpenChange={setChatOpen} compact={compact}
      error={chat.error ? siteValue(chat.error) : null} onRetry={() => void chat.retry()}
      messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip}
      busy={chat.busy} failed={!!chat.error} statusText={statusText} value={input} onChange={setInput} onSend={sendMessage} />,
    toolbar: <>
      <div className="studio-result-version-row">
        <label>{t('redesignJourney.history')}<select aria-label={t('redesignJourney.history')} value={chat.viewedId} onChange={event => chat.selectVersion(event.target.value)}>
          <option value="original">{t('redesignJourney.original')}</option>
          {plan?.search_version && <option value="current">{t('studioV2.currentPlan')}</option>}
          {chat.versions.map((version, index) => <option key={version.version_id} value={version.version_id}>{version.image_status === 'exported' ? siteText('نسخهٔ {{number}} — بستهٔ تصویر آماده', { number: index + 1 }) : t(version.image_status === 'failed' ? 'studioAudit.versionFailed' : version.image_pending ? 'studioAudit.versionPending' : 'studioAudit.versionReady', { number: index + 1 })}</option>)}
        </select></label>
      </div>
      {chat.newVersionReady && <Button variant="outline" onClick={() => chat.selectVersion(chat.versions[chat.versions.length - 1].version_id)}>{t('redesignJourney.ready')}</Button>}
      <nav className="studio-result-session-tools" aria-label={t('studioChat.archive')}>
        <Link to="/studio/projects" className="studio-text-button"><History size={16} />{t('studioChat.archive')}</Link>
        <button type="button" className="studio-text-button" disabled={chat.status === 'creating'} onClick={fresh}><Plus size={16} />{t('studioChat.new')}</button>
      </nav>
    </>,
    status: <>
      {chat.busy && <div className="studio-conversation-status" role="status"><Loader2 size={16} className="studio-spinner" />{statusText}</div>}
      {chat.error && <div className="studio-flow-error" role="alert"><p>{siteValue(chat.error)}</p><Button variant="outline" disabled={chat.busy} onClick={() => void chat.retry()}>{t('redesignJourney.retry')}</Button></div>}
    </>,
    details: plan ? <ExecutionPanel plan={plan} busy={chat.busy} section="plan" onPreview={() => {}} /> : null,
    afterReport: <>{!plan && <p className="studio-empty-state">{t(chat.versions.length ? 'redesignJourney.legacy' : 'studioChat.noPlan')}</p>}
            {chat.sessionId && import.meta.env.MODE === 'studio-local' && <StudioImageExport key={`export-${chat.sessionId}`} sessionId={chat.sessionId} busy={chat.busy} />}
            {chat.sessionId && <SessionDiagnostics key={chat.sessionId} sessionId={chat.sessionId} busy={chat.busy} />}</>,
  }} />;
}

export function RoomRedesignPage() {
  const { sessionId: path } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const chat = useRedesignChat(path);
  const compact = useMediaQuery('(max-width: 1199px)');
  const [intake, setIntake] = useState<HomaIntakePayload | null>(null);
  const [input, setInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewActive, setReviewActive] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const lastVersion = useRef<string | null>(null);
  const refreshedVersion = useRef<string | null>(null);
  const seeded = useRef(false);
  const selected = chat.selectedVersion;
  if (selected) lastVersion.current = selected.version_id;
  const report = chat.viewedId === 'current' ? chat.versions.find(version => version.version_id === chat.currentBaseVersionId)
    : selected || chat.versions.find(version => version.version_id === lastVersion.current) || chat.versions[chat.versions.length - 1];
  const plan = chat.viewedId === 'current' ? chat.currentExecution : selected ? selected.execution : report?.execution || chat.currentExecution || null;
  const original = chat.originalImage || intake?.image.dataUrl || null;
  useEffect(() => {
    if (!chat.hydrating && !reviewDismissed && !chat.versions.length && (chat.busy || chat.currentExecution || chat.error)) setReviewActive(true);
  }, [chat.hydrating, chat.busy, chat.currentExecution, chat.error, chat.versions.length, reviewDismissed]);
  useEffect(() => setImageFailed(false), [selected?.image_url, original]);
  useEffect(() => { if (chat.sessionId && !path) navigate(`/studio/chat/${chat.sessionId}`, { replace: true }); }, [chat.sessionId, path, navigate]);
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
    if (previousPath.current && previousPath.current !== path) { setInput(''); setChatOpen(false); setReviewActive(false); setReviewDismissed(false); lastVersion.current = null; refreshedVersion.current = null; }
    previousPath.current = path;
  }, [path]);
  const fresh = () => { setIntake(null); seeded.current = false; setInput(''); setChatOpen(false); setReviewActive(false); setReviewDismissed(false); navigate('/studio'); };
  const sendMessage = () => {
    const draft = input.trim();
    if (!draft || chat.busy) return;
    setInput('');
    void chat.sendTurn({ text: draft }).then(accepted => { if (!accepted) setInput(current => current || draft); });
  };
  if (chat.hydrating || chat.unavailable) return <div className="studio-result-page" dir={i18n.dir()}><Header /><main className="studio-archive-page"><div className="studio-page-state" role={chat.unavailable ? 'alert' : 'status'}>
    {chat.unavailable ? <><h1>{t('studioChat.unavailableTitle')}</h1><p>{t('redesignJourney.unavailable')}</p><Button asChild><Link to="/studio/projects">{t('studioChat.archive')}</Link></Button></> : <><Loader2 className="studio-spinner" /><p>{t('studioChat.loading')}</p></>}
  </div></main></div>;
  if (!path && !intake) return <StudioIntake onStartAnalysis={payload => { setIntake(payload); setReviewActive(true); setReviewDismissed(false); }} />;
  const discovering = !reviewDismissed && (reviewActive || (!chat.versions.length && (chat.busy || !!plan || !!chat.error)));
  if (discovering) return <StudioDiscovery key={chat.sessionId || path || 'new'} plan={plan} analysisPreview={chat.analysisPreview} originalImage={original}
    sessionId={chat.sessionId} busy={chat.busy} error={chat.error} resultAvailable={!!report?.image_url && !report.image_pending} stage={chat.stage}
    onRetry={() => void chat.retry()} onNew={fresh} onDiscuss={() => setChatOpen(true)}
    onComplete={() => { setReviewDismissed(true); setReviewActive(false); setChatOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
    panel={<>{chat.sessionId && import.meta.env.MODE === 'studio-local' && <StudioImageExport key={chat.sessionId} sessionId={chat.sessionId} busy={chat.busy} />}<StudioConversationDrawer open={chatOpen} onOpenChange={setChatOpen} compact={compact}
      messages={chat.messages} chipGroups={chat.chipGroups} onSelectChip={chat.selectChip}
      busy={chat.busy} failed={!!chat.error} statusText={chat.stage || t(chat.status === 'rendering' ? 'redesignJourney.rendering' : 'redesignJourney.thinking')}
      value={input} onChange={setInput} onSend={sendMessage} /></>} />;
  return <>
    <ConversationResult key={`${chat.sessionId || path || 'new'}:${chat.viewedId === 'current' ? 'current' : report?.version_id || 'analysis'}`} chat={chat} plan={plan}
      versionId={chat.viewedId === 'current' ? 'current' : report?.version_id || 'analysis'} resultImage={(report?.image_pending ? original : report?.image_url) || original || ''} originalImage={original}
      onToggleOriginal={show => chat.selectVersion(show ? 'original' : lastVersion.current || report?.version_id || 'original')}
      onImageError={() => {
        setImageFailed(true);
        if (selected && refreshedVersion.current !== selected.version_id) { refreshedVersion.current = selected.version_id; chat.selectVersion(selected.version_id); }
      }} compact={compact} chatOpen={chatOpen} setChatOpen={setChatOpen} input={input} setInput={setInput} sendMessage={sendMessage} fresh={fresh} />
    {imageFailed && <div className="studio-conversation-media-error" role="alert"><p>{t('redesignJourney.imageUnavailable')}</p><Button variant="outline" onClick={() => { setImageFailed(false); chat.selectVersion(chat.viewedId); }}>{t('redesignJourney.reloadImage')}</Button></div>}
  </>;
}

export default RoomRedesignPage;
