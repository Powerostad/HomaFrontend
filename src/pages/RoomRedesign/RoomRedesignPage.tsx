/**
 * RoomRedesignPage — conversational AI room-redesign flow.
 *
 * Three bottom-nav tabs, each a DISTINCT view:
 *   - تحلیل فضا (analysis): the conversation — intake (photo analysis + questions)
 *     ↔ review (generated preview + feedback). Sub-state is preserved per tab.
 *   - محصولات (products): ranked suggestions + product carousel.
 *   - سبد (basket): selected products + checkout.
 *
 * Driven by mock data; backend chat wiring comes later. Deep-link for review:
 *   ?tab=analysis|products|basket  and back-compat ?phase=analysis|suggestions|preview
 */
import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { RD } from './theme';
import { useMediaQuery } from './hooks/useMediaQuery';
import { RoomCanvas, BottomNav } from './components/shell';
import { DesktopWorkspace, type DeskTab } from './components/desktop';
import { AnalysisPanel, SuggestionsPanel, PreviewPanel, BasketPanel } from './components/panels';
import {
  ANALYSIS_IMAGE,
  ANALYSIS_PINS,
  ANALYSIS_CHIP_GROUPS,
  SUGGESTION_IMAGE,
  SUGGESTION_PINS,
  PREVIEW_IMAGE,
  PREVIEW_PINS,
  ROOM_VERSIONS,
  SUGGESTION_PRODUCTS,
} from './data/mockData';
import type { AnalysisState, NavTab, RedesignProduct } from './types';

const TAB_ORDER: NavTab[] = ['analysis', 'products', 'basket'];

function resolveInit(sp: URLSearchParams): { tab: NavTab; analysis: AnalysisState } {
  const phase = sp.get('phase');
  const tab = sp.get('tab');
  if (phase === 'suggestions') return { tab: 'products', analysis: 'intake' };
  if (phase === 'review' || phase === 'preview') return { tab: 'analysis', analysis: 'review' };
  if (phase === 'analysis') return { tab: 'analysis', analysis: 'intake' };
  if (tab === 'products') return { tab: 'products', analysis: 'intake' };
  if (tab === 'basket') return { tab: 'basket', analysis: 'intake' };
  return { tab: 'analysis', analysis: 'intake' };
}

function initialDeskTab(init: { tab: NavTab; analysis: AnalysisState }): DeskTab {
  if (init.tab === 'analysis') return init.analysis === 'review' ? 'preview' : 'analysis';
  if (init.tab === 'products') return 'suggestions';
  return 'products'; // basket
}

export function RoomRedesignPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Tablet (≥768) and up get the workspace (it collapses 3-col → 2-col itself);
  // only true phones (<768) get the mobile bottom-sheet.
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const init = useMemo(() => resolveInit(searchParams), [searchParams]);

  const [navTab, setNavTab] = useState<NavTab>(init.tab);
  const [analysisState, setAnalysisState] = useState<AnalysisState>(init.analysis);
  const [input, setInput] = useState('');
  const [activeVersion, setActiveVersion] = useState(ROOM_VERSIONS.length);
  const [cart, setCart] = useState<RedesignProduct[]>([]);
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const [deskTab, setDeskTab] = useState<DeskTab>(() => initialDeskTab(init));
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    ANALYSIS_CHIP_GROUPS.forEach((g) => {
      if (g.selectedId) s[g.id] = g.selectedId;
    });
    return s;
  });

  const reduce = useReducedMotion();
  const D = reduce ? 0 : 0.22;

  const canvas = useMemo(() => {
    if (navTab === 'analysis' && analysisState === 'review')
      return { image: PREVIEW_IMAGE, pins: PREVIEW_PINS, showVersions: true };
    if (navTab === 'products') return { image: SUGGESTION_IMAGE, pins: SUGGESTION_PINS, showVersions: false };
    if (navTab === 'basket') return { image: PREVIEW_IMAGE, pins: [], showVersions: false };
    return { image: ANALYSIS_IMAGE, pins: ANALYSIS_PINS, showVersions: false };
  }, [navTab, analysisState]);

  const goTab = (next: NavTab) => {
    if (next === navTab) return;
    setAxis('x');
    setNavDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(navTab) ? 1 : -1);
    setNavTab(next);
  };
  const goReview = () => {
    setAxis('y');
    setNavDir(1);
    setAnalysisState('review');
    setNavTab('analysis');
    setInput('');
  };
  const addToCart = (p: RedesignProduct) => setCart((c) => (c.some((x) => x.id === p.id) ? c : [...c, p]));
  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  // Large screens get the desktop workspace; small screens keep the mobile sheet.
  if (isDesktop) {
    return (
      <DesktopWorkspace
        cart={cart}
        addToCart={addToCart}
        input={input}
        setInput={setInput}
        activeVersion={activeVersion}
        setActiveVersion={setActiveVersion}
        deskTab={deskTab}
        onTabChange={setDeskTab}
        onExit={() => navigate('/')}
      />
    );
  }

  const viewKey = navTab === 'analysis' ? `analysis:${analysisState}` : navTab;
  const enterOffset = axis === 'x' ? { x: reduce ? 0 : navDir * 24 } : { y: reduce ? 0 : 18 };
  const exitOffset = axis === 'x' ? { x: reduce ? 0 : navDir * -16 } : { y: reduce ? 0 : -10 };

  return (
    <div className="w-full flex justify-center" style={{ backgroundColor: RD.cream }}>
      <div
        className="relative w-full max-w-[520px] h-[100dvh] flex flex-col overflow-hidden"
        style={{ backgroundColor: RD.sheet }}
        dir="rtl"
      >
        <RoomCanvas
          imageUrl={canvas.image}
          pins={canvas.pins}
          versions={canvas.showVersions ? ROOM_VERSIONS : undefined}
          activeVersion={canvas.showVersions ? activeVersion : undefined}
          onVersionChange={canvas.showVersions ? setActiveVersion : undefined}
        />

        {/* Bottom sheet overlapping the image */}
        <div
          className="relative -mt-6 flex-1 min-h-0 rounded-t-[36px] overflow-hidden z-10"
          style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.08)' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewKey}
              className="h-full w-full"
              initial={{ opacity: 0, ...enterOffset }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, ...exitOffset }}
              transition={{ duration: D, ease: [0.22, 1, 0.36, 1] }}
            >
              {navTab === 'analysis' && analysisState === 'intake' && (
                <AnalysisPanel
                  inputValue={input}
                  onInputChange={setInput}
                  onSend={goReview}
                  selected={selected}
                  onSelectChip={(groupId, chipId) => {
                    setSelected((s) => ({ ...s, [groupId]: chipId }));
                    if (groupId === 'start') goReview();
                  }}
                />
              )}
              {navTab === 'analysis' && analysisState === 'review' && (
                <PreviewPanel
                  inputValue={input}
                  onInputChange={setInput}
                  onSend={() => setInput('')}
                  onContinue={() => toast.success('در حال ساخت نسخه‌ی بعدی…')}
                  onViewProducts={() => goTab('products')}
                  onPrevVersion={() => setActiveVersion((v) => Math.max(1, v - 1))}
                  onNextVersion={() => setActiveVersion((v) => Math.min(ROOM_VERSIONS.length, v + 1))}
                />
              )}
              {navTab === 'products' && (
                <SuggestionsPanel
                  onPreview={goReview}
                  onAdd={addToCart}
                  onAddAll={() => {
                    setCart(SUGGESTION_PRODUCTS);
                    toast.success('محصولات به سبد اضافه شد');
                    goTab('basket');
                  }}
                />
              )}
              {navTab === 'basket' && (
                <BasketPanel
                  items={cart}
                  onRemove={removeFromCart}
                  onCheckout={() => toast.success('در حال انتقال به پرداخت…')}
                  onGoProducts={() => goTab('products')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav active={navTab} onChange={goTab} itemCount={cart.length} />
      </div>
    </div>
  );
}

export default RoomRedesignPage;
