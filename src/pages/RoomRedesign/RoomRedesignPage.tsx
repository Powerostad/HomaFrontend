/**
 * RoomRedesignPage — conversational AI room-redesign flow, wired to the backend
 * chat API (`/api/recommendations/chat/`) via `useRedesignChat`.
 *
 * Intake = upload a room photo + optional need text + optional category scope.
 * The first turn sends the photo (+ composed text); follow-up turns continue the
 * conversation. Products from the stream feed the محصولات tab and the unified
 * BasketContext; the سبد tab mirrors the session's selections.
 *
 * Mobile (<768): bottom-sheet with 3 tabs (analysis / products / basket).
 * Desktop (≥768): the DesktopWorkspace. Deep-link: ?tab=analysis|products|basket.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Droplet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RD } from './theme';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useRedesignChat } from './hooks/useRedesignChat';
import { useBasket } from '@/context/BasketContext';
import { RoomCanvas, BottomNav } from './components/shell';
import { DesktopWorkspace, type DeskTab } from './components/desktop';
import { AnalysisPanel, SuggestionsPanel, BasketPanel } from './components/panels';
import { MobileSheet } from './components/BottomSheet';
import { ImageToolbar, useImageActions } from './components/workspace';
import { toPersianDigits } from '@/utils/formatters';
import { AnalysisLoadingScreen } from './intake/AnalysisLoadingScreen';
import { composeIntakeText } from './intake/composeIntakeText';
import { HomaIntakeFlow } from './intake/HomaIntakeFlow';
import {
  isRedesignSessionId,
  removeLegacyRedesignParams,
  shouldCanonicalizeSessionPath,
  shouldResetRedesignView,
  shouldSeedIntake,
} from './redesignRouteState';
import { selectChatProduct } from './services/redesignChatService';
import type { HomaIntakePayload } from './intake/intakeTypes';
import type { RedesignCategory } from './services/transformers';
import type { NavTab, RedesignProduct } from './types';

const TAB_ORDER: NavTab[] = ['analysis', 'products', 'basket'];

function resolveInitTab(sp: URLSearchParams): NavTab {
  const tab = sp.get('tab');
  if (tab === 'products') return 'products';
  if (tab === 'basket') return 'basket';
  return 'analysis';
}

function initialDeskTab(tab: NavTab): DeskTab {
  if (tab === 'products' || tab === 'basket') return 'products';
  return 'analysis';
}

/** Full-screen loader shown while a `/redesign/:sessionId` path hydrates. */
function ResumeLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: RD.canvas }}
      dir="rtl"
    >
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: RD.ink }}>
        <Droplet size={22} strokeWidth={2} color="#fff" />
      </span>
      <div className="flex items-center gap-2" style={{ fontFamily: 'Vazirmatn' }}>
        <Loader2 size={16} strokeWidth={2.5} className="animate-spin" style={{ color: RD.inkSoft }} />
        <span className="text-[14px]" style={{ color: RD.inkSoft }}>در حال بارگذاری گفتگو…</span>
      </div>
    </div>
  );
}

export function RoomRedesignPage() {
  const [searchParams] = useSearchParams();
  const { sessionId: rawRouteSessionId } = useParams<{ sessionId?: string }>();
  const routeSessionId = isRedesignSessionId(rawRouteSessionId) ? rawRouteSessionId : undefined;
  const hasInvalidSessionPath = Boolean(rawRouteSessionId && !routeSessionId);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const initTab = useMemo(() => resolveInitTab(searchParams), [searchParams]);

  // A session path identifies the conversation resource. The root `/redesign`
  // path is the new-session entry point and owns the intake phase locally until
  // the first durable chat session is created.
  const chat = useRedesignChat(routeSessionId);
  const [intakePayload, setIntakePayload] = useState<HomaIntakePayload | null>(null);
  const didConsumeIntakeRef = useRef(false);
  const [intakeAttempt, setIntakeAttempt] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  // First turn finished (busy true→false) without producing any analysis content
  // and without an error — a silent/empty backend turn. Lets the overlay escape.
  const [silentFail, setSilentFail] = useState(false);
  const turnWasBusyRef = useRef(false);

  const [navTab, setNavTab] = useState<NavTab>(initTab);
  const [deskTab, setDeskTab] = useState<DeskTab>(() => initialDeskTab(initTab));
  const [input, setInput] = useState('');
  const { basket, addItem, removeItem } = useBasket();
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const previousRouteSessionIdRef = useRef(routeSessionId);
  // Mobile: the single scroll container; we scroll it to the top to refocus the photo.
  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const prevVersionsRef = useRef(0);
  const prevMsgLenRef = useRef(0);

  const reduce = useReducedMotion();
  const D = reduce ? 0 : 0.22;

  const intakeImage = intakePayload?.image.dataUrl ?? null;

  // Image currently on the canvas (mobile): active render → preview → uploaded
  // photo. The mobile image chrome (caption + toolbar + zoom/compare modals)
  // reuses the SAME hook the desktop canvas uses, so both surfaces behave alike.
  // Called unconditionally (above the desktop early-return) to respect hook order.
  const mobileActiveVersionImage = chat.versions.find((v) => v.index === chat.activeVersion)?.imageUrl;
  const mobileCanvasImage = mobileActiveVersionImage ?? chat.previewImage ?? intakeImage ?? null;
  const mobileImageActions = useImageActions({
    image: mobileCanvasImage,
    originalImage: intakeImage,
    activeVersion: chat.activeVersion,
    isPreview: chat.hasResult,
  });

  // When a render image arrives, surface it: desktop jumps to the preview tab.
  useEffect(() => {
    if (isDesktop && chat.previewImage) setDeskTab('preview');
  }, [isDesktop, chat.previewImage]);

  // Reflect the live session id in the path so the conversation is addressable
  // (reload / share / reopen restores it). Replace so creating a session does
  // not add an extra history entry before the first turn is visible.
  useEffect(() => {
    if (!shouldCanonicalizeSessionPath({
      hasIntakePayload: Boolean(intakePayload),
      routeSessionId,
      chatSessionId: chat.sessionId,
      previousRouteSessionId: previousRouteSessionIdRef.current,
    })) return;
    navigate(`/redesign/${chat.sessionId}`, { replace: true });
  }, [chat.sessionId, intakePayload, routeSessionId, navigate]);

  // A route change is a session boundary. Reset view-only state so opening one
  // conversation cannot inherit another conversation's tab, composer text, or
  // unsent intake image. Preserve the intake image only for the root→canonical
  // transition of the session that just created it.
  useEffect(() => {
    if (!shouldResetRedesignView(previousRouteSessionIdRef.current, routeSessionId)) return;
    previousRouteSessionIdRef.current = routeSessionId;
    const isCurrentDraftSession = Boolean(routeSessionId && routeSessionId === chat.sessionId);
    setNavTab(initTab);
    setDeskTab(initialDeskTab(initTab));
    setInput('');
    setNavDir(1);
    prevVersionsRef.current = 0;
    prevMsgLenRef.current = 0;
    if (!isCurrentDraftSession) {
      setIntakePayload(null);
      setAnalyzing(false);
      setSilentFail(false);
      didConsumeIntakeRef.current = false;
      turnWasBusyRef.current = false;
    }
  }, [chat.sessionId, initTab, routeSessionId]);

  // The current flow has no session or phase query parameters. Remove those
  // retired values while preserving the supported view tab parameter.
  useEffect(() => {
    if (!searchParams.has('s') && !searchParams.has('phase')) return;
    const cleaned = removeLegacyRedesignParams(searchParams).toString();
    const pathname = routeSessionId ? `/redesign/${routeSessionId}` : '/redesign';
    navigate(`${pathname}${cleaned ? `?${cleaned}` : ''}`, { replace: true });
  }, [navigate, routeSessionId, searchParams]);

  // Mobile: when a NEW render lands, scroll the sheet back to the top so the
  // freshly generated photo is in focus (the sheet drops to its peek).
  useEffect(() => {
    if (isDesktop) return;
    if (chat.versions.length > prevVersionsRef.current) {
      prevVersionsRef.current = chat.versions.length;
      sheetScrollRef.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [isDesktop, chat.versions.length, reduce]);

  // Mobile: on a new chat turn (text reply, NOT a render) scroll the sheet to the
  // bottom so هما's latest response is in view (the photo refocus above owns renders).
  useEffect(() => {
    if (isDesktop) return;
    const grew = chat.messages.length > prevMsgLenRef.current;
    prevMsgLenRef.current = chat.messages.length;
    const newVersion = chat.versions.length > prevVersionsRef.current;
    if ((!grew && !chat.busy) || newVersion || navTab !== 'analysis') return;
    requestAnimationFrame(() => {
      const el = sheetScrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    });
  }, [isDesktop, chat.messages.length, chat.versions.length, chat.busy, navTab, reduce]);


  // Seed the conversation from the intake payload collected inside `/redesign`:
  // compose the first turn (photo + Persian context) and show the loading overlay
  // until هما's analysis starts streaming. Fired once, deferred a tick so the send
  // survives React StrictMode's dev mount→unmount→remount probe (which would
  // otherwise abort an in-flight stream started synchronously on mount).
  useEffect(() => {
    if (!shouldSeedIntake({
      didConsumeIntake: didConsumeIntakeRef.current,
      hasIntakePayload: Boolean(intakePayload),
      routeSessionId,
      messageCount: chat.messages.length,
    }) || !intakePayload) return;
    const t = setTimeout(() => {
      if (didConsumeIntakeRef.current) return;
      didConsumeIntakeRef.current = true;
      setAnalyzing(true);
      void chat.sendTurn({
        text: composeIntakeText(intakePayload),
        images: [intakePayload.image.dataUrl],
      });
    }, 0);
    return () => clearTimeout(t);
  }, [intakeAttempt, intakePayload, routeSessionId, chat.messages.length, chat.sendTurn]);

  // ── Send follow-up text turns ─────────────────────────────────────
  const onSend = () => {
    if (chat.busy) return;
    if (!input.trim()) return;
    void chat.sendTurn({ text: input.trim(), images: [] });
    setInput('');
  };

  const basketProducts = useMemo<RedesignProduct[]>(
    () => basket.shop_groups.flatMap((group) => group.items.map((item) => ({
      id: item.id,
      name: item.product_name,
      subtitle: item.shop_name,
      priceRial: item.current_price_rial ?? item.snapshot_price_rial,
      imageUrl: item.product_image_url,
    }))),
    [basket.shop_groups],
  );
  const addToCart = async (p: RedesignProduct) => {
    const source = chat.products.find((product) => product.id === p.id || product.productId === p.productId);
    if (!source?.uniqueLink) {
      toast.error('این محصول در حال حاضر قابل افزودن به سبد نیست');
      return;
    }
    const added = await addItem({
      product_unique_link: source.uniqueLink,
      source_context: 'try_on_result',
      redesign_session_id: chat.sessionId,
    });
    if (added && chat.sessionId && source.categoryCode) {
      const selected = await selectChatProduct({
        sessionId: chat.sessionId,
        category: source.categoryCode,
        productId: source.productId,
      });
      if (!selected.success) toast.error(selected.error || 'انتخاب محصول ذخیره نشد');
    }
  };
  const removeFromCart = (id: string) => void removeItem(id);
  const addAll = async () => {
    await Promise.all(chat.products.map((product) => addToCart(product)));
    toast.success('محصولات به سبد اضافه شد');
    goTab('basket');
  };
  // Add every product of one design category to the basket at once.
  const onAddCategory = (cat: RedesignCategory) => {
    void Promise.all(cat.products.map((product) => addToCart(product)));
    toast.success(`محصولات «${cat.title}» به سبد اضافه شد`);
  };
  // Preview just this category's change (instruction-scoped render of the scene).
  const onPreviewCategory = (cat: RedesignCategory) => {
    if (chat.busy) return;
    void chat.renderScene(`لطفاً فقط «${cat.title}» را در این فضا تغییر بده و نتیجه را نشان بده.`);
    if (!isDesktop) goTab('analysis');
  };
  const onCheckout = () => {
    toast.success('در حال آماده‌سازی سبد…');
  };

  // ── New session: abandon the current thread and start fresh ───────
  // The server-side session still persists; we only drop the local pointer
  // (localStorage + current path) and reset the view. Confirm if there's a
  // conversation to lose. `chat.reset()` clears the hook state + localStorage.
  const onNewSession = () => {
    if (
      chat.messages.length > 0 &&
      !window.confirm('گفتگوی فعلی بسته شود و گفتگوی جدیدی شروع شود؟')
    ) {
      return;
    }
    chat.reset();
    setIntakePayload(null);
    setIntakeAttempt(0);
    setInput('');
    setAnalyzing(false);
    setNavTab('analysis');
    setDeskTab('analysis');
    // Start a fresh analysis through the root redesign entry point. The old
    // session remains addressable at its own `/redesign/:sessionId` path.
    navigate('/redesign');
  };

  const goTab = (next: NavTab) => {
    if (next === navTab) return;
    setNavDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(navTab) ? 1 : -1);
    setNavTab(next);
  };

  // Pins are anchored to the user's original photo (version 1 / pre-generation
  // intake) — never to a generated preview, where the coordinates wouldn't match.
  const showPins = chat.versions.length === 0 || chat.activeVersion === 1;
  const visiblePins = showPins ? chat.pins : [];

  // First-turn analysis: keep the loading overlay up until هما's analysis begins
  // streaming (assistant text / chips / a result). Then reveal the chat. On a
  // first-turn failure, the overlay flips to an error + retry state.
  const analysisStarted =
    chat.messages.some((m) => m.role === 'assistant' && m.text.trim().length > 0) ||
    chat.chipGroups.length > 0 ||
    chat.hasResult ||
    chat.findings.length > 0;
  const firstTurnFailed = !analysisStarted && (chat.status === 'error' || silentFail);

  // Detect a silent/empty first turn: the stream went busy then settled without
  // any content or error, which would otherwise leave the overlay stuck loading.
  useEffect(() => {
    if (!analyzing || analysisStarted) return;
    if (chat.busy) {
      turnWasBusyRef.current = true;
      return;
    }
    if (turnWasBusyRef.current && chat.status !== 'error') setSilentFail(true);
  }, [analyzing, analysisStarted, chat.busy, chat.status]);

  // Retry the first turn from scratch: reset clears the failed turn (and its user
  // bubble) so we don't accumulate duplicate messages, then re-send the intake.
  const onRetryAnalysis = () => {
    if (!intakePayload) return;
    setSilentFail(false);
    turnWasBusyRef.current = false;
    didConsumeIntakeRef.current = false;
    setIntakeAttempt((attempt) => attempt + 1);
    chat.reset();
    setAnalyzing(true);
    // Retry from the root entry path so the next durable session can receive
    // its own canonical `/redesign/:sessionId` URL.
    if (routeSessionId) navigate('/redesign', { replace: true });
  };

  const analysisOverlay =
    analyzing && !analysisStarted ? (
      <AnalysisLoadingScreen
        imageUrl={intakeImage ?? intakePayload?.image.dataUrl}
        stage={chat.stage}
        error={firstTurnFailed}
        onRetry={onRetryAnalysis}
      />
    ) : null;

  // Resuming a shared session (`/redesign/:sessionId`): hold a loading screen until the first DB
  // load resolves, so the user never sees a blank workspace or an intake flash.
  if (chat.hydrating) {
    return <ResumeLoadingScreen />;
  }

  // Session paths are UUIDs issued by the chat API. Invalid suffixes are not
  // alternate redesign flows; return to the single current entry point.
  if (hasInvalidSessionPath) {
    return <Navigate to="/redesign" replace />;
  }

  // `/redesign` is the new-session entry point. Intake is a phase of this flow,
  // not a second route, and hands its payload back to this page before the first
  // chat session is created.
  if (!routeSessionId && !intakePayload) {
    return <HomaIntakeFlow onStartAnalysis={setIntakePayload} />;
  }

  // ── Desktop ───────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        {analysisOverlay}
        <DesktopWorkspace
        cart={basketProducts}
        addToCart={addToCart}
        input={input}
        setInput={setInput}
        onSend={onSend}
        activeVersion={chat.activeVersion}
        setActiveVersion={chat.setActiveVersion}
        deskTab={deskTab}
        onTabChange={setDeskTab}
        onExit={() => navigate('/')}
        onNewSession={onNewSession}
        onRender={() => void chat.renderScene()}
        onQuickEdit={(text) => {
          if (chat.busy) return;
          void chat.sendTurn({ text, images: [] });
        }}
        onAddCategory={onAddCategory}
        onPreviewCategory={onPreviewCategory}
        messages={chat.messages}
        chipGroups={chat.chipGroups}
        onSelectChip={chat.selectChip}
        busy={chat.busy}
        rendering={chat.status === 'rendering'}
        products={chat.products}
        categories={chat.categories}
        hasResult={chat.hasResult}
        previewImage={chat.previewImage}
        originalImage={intakeImage}
        pins={visiblePins}
        findings={chat.findings}
        versions={chat.versions}
        />
      </>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────
  const canvasImage = mobileCanvasImage;
  const enterOffset = { x: reduce ? 0 : navDir * 24 };
  const exitOffset = { x: reduce ? 0 : navDir * -16 };

  // Mobile: ONE native scroll container. The photo is a sticky focus layer; the
  // sheet (real content) scrolls up over it. Scroll from anywhere (photo included),
  // scroll to top → photo refocuses. Peek grows once the conversation starts.
  // Photo sits at its natural height; the sheet rests right under its bottom edge.
  return (
    <div
      className="relative w-full max-w-[520px] h-[100dvh] overflow-hidden"
      style={{ backgroundColor: RD.cream }}
      dir="rtl"
    >
      {analysisOverlay}
      <MobileSheet
        scrollRef={sheetScrollRef}
        showHint={chat.hasResult}
        focus={
          <RoomCanvas
            imageUrl={canvasImage}
            pins={visiblePins}
            versions={chat.versions.length > 0 ? chat.versions : undefined}
            activeVersion={chat.versions.length > 0 ? chat.activeVersion : undefined}
            onVersionChange={chat.versions.length > 0 ? chat.setActiveVersion : undefined}
            onNewSession={chat.messages.length > 0 ? onNewSession : undefined}
          />
        }
      >
        {/* Image actions — flush sheet chrome directly under the photo (not over it):
            version label + bare ghost toolbar on a hairline. Same actions as desktop. */}
        {chat.hasResult && (
          <div
            className="flex items-center justify-between px-5 py-2"
            dir="rtl"
            style={{ backgroundColor: RD.sheet, borderBottom: `1px solid ${RD.line}` }}
          >
            <span className="text-[12.5px] font-medium" style={{ color: RD.inkSoft, fontFamily: 'Vazirmatn' }}>
              پیش‌نمایش · نسخه {toPersianDigits(chat.activeVersion)}
            </span>
            <ImageToolbar
              variant="bare"
              canCompare={mobileImageActions.canCompare}
              onDownload={mobileImageActions.onDownload}
              onShare={mobileImageActions.onShare}
              onCompare={mobileImageActions.onCompare}
              onZoom={mobileImageActions.onZoom}
            />
          </div>
        )}

        {/* Nav sticks to the top of the sheet as the user scrolls into content. */}
        <div className="sticky top-0 z-30 px-5 pt-1 pb-2.5" style={{ backgroundColor: RD.sheet }}>
          <BottomNav active={navTab} onChange={goTab} itemCount={basket.item_count} />
        </div>

        {/* Panel content with tab transitions (flows in the page scroll). */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={navTab}
              className="w-full"
              initial={{ opacity: 0, ...enterOffset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, ...exitOffset }}
              transition={{ duration: D, ease: [0.22, 1, 0.36, 1] }}
            >
              {navTab === 'analysis' && (
                  <AnalysisPanel
                    messages={chat.messages}
                    chipGroups={chat.chipGroups}
                    onSelectChip={chat.selectChip}
                    busy={chat.busy}
                    rendering={chat.status === 'rendering'}
                    findings={chat.findings}
                    inputValue={input}
                    onInputChange={setInput}
                    onSend={onSend}
                  />
                )}
                {navTab === 'products' && (
                  <SuggestionsPanel
                    categories={chat.categories}
                    hasResult={chat.hasResult}
                    onPreview={() => {
                      void chat.renderScene();
                      goTab('analysis');
                    }}
                    onAddAll={addAll}
                    onAdd={addToCart}
                    onAddCategory={onAddCategory}
                    onPreviewCategory={onPreviewCategory}
                  />
                )}
                {navTab === 'basket' && (
                  <BasketPanel
                    items={basketProducts}
                    onRemove={removeFromCart}
                    onCheckout={onCheckout}
                    onGoProducts={() => goTab('products')}
                  />
                )}
            </motion.div>
          </AnimatePresence>
        </div>
      </MobileSheet>
      {mobileImageActions.modals}
    </div>
  );
}

export default RoomRedesignPage;
