import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/context/AppProviders';
import { StudioDiscovery } from '../../src/pages/RoomRedesign/components/StudioDiscovery';
import { StudioConversationDrawer } from '../../src/pages/RoomRedesign/components/StudioConversationDrawer';
import { useMediaQuery } from '../../src/pages/RoomRedesign/hooks/useMediaQuery';
import { useConversationStudioResult } from '../../src/pages/RoomRedesign/hooks/useConversationStudioResult';
import { StudioResultView } from '../../src/pages/Studio/ResultPage';
import type { ExecutionPlan } from '../../src/pages/RoomRedesign/services/redesignChatService';
import type { StudioMotherDocument } from '../../src/pages/RoomRedesign/services/motherDocument';
import '../../src/i18n/config';
import '../../src/styles/globals.css';
import '../../src/pages/RoomRedesign/studio-conversation.css';
import '../../src/pages/RoomRedesign/journey.css';

// Local-only controls; no model calls, basket mutations or real consultation submission.
const original = '/images/studio/example-good.webp';
const result = '/images/studio/preset-warm-living.webp';
const plan: ExecutionPlan = {
  purchases: [{ item_id: 'rug', category: 'فرش', quantity: 1, relation: 'similar', reason_fa: 'فرش روشن‌تر، محدودهٔ نشیمن را منسجم می‌کند.',
    product: { product_id: 7, name: 'فرش بافت‌دار کرم و طوسی', image_url: result, price_rial: 4350000, unique_link: 'fixture-rug' },
    alternatives: [{ product_id: 8, name: 'فرش وینتیج کرم روشن', image_url: original, price_rial: 5500000, unique_link: 'fixture-alt' }] }],
  free_actions: [{ reason_fa: 'مسیر رفت‌وآمد باید باز بماند.', instruction_fa: 'میز کنار مبل را از ورودی فاصله بده.' }],
  surface_actions: [{ change_fa: 'رنگ‌آمیزی دیوار با رنگ کرم گرم' }], known_subtotal_rial: 4350000, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: ['surface:0'],
  studio_documents: { room: {
    room_analysis: {
      layout_evaluation: { layout_issues: [{ issue_id: 'layout-1', evidence: 'فرش کوچک، دو بخش نشیمن را از هم جدا نشان می‌دهد.', severity: 'high' }] },
      harmony_diagnosis: { main_conflicts: [{ conflict_id: 'harmony-1', evidence: 'سطوح اصلی رنگ‌های نزدیک دارند؛ یک بافت روشن می‌تواند به فضا عمق بدهد.', severity: 'medium' }] },
      function_diagnosis: { functional_issues: [{ function_issue_id: 'function-1', evidence: 'جای میز کنار مبل، مسیر ورودی را باریک کرده است.' }] },
    },
    layout_fix_plan: [{ resolves_issue_id: 'layout-1', specific_instruction: 'فرش بزرگ‌تر را طوری قرار بده که پایه‌های جلویی هر دو مبل روی آن بنشیند.' },
      { resolves_issue_id: 'function-1', specific_instruction: 'میز کنار مبل را کمی از ورودی دور کن تا مسیر بازتر شود.' }],
    existing_items_decision: [{ related_issue_ids: ['harmony-1'], action_instruction: 'مبل‌ها را حفظ کن و با کوسن و بافت روشن‌تر، تضاد ملایمی بساز.' }],
    user_facing_summary: { positive_diagnosis: 'نور طبیعی خوب و مبلمان هماهنگ، پایهٔ مناسبی برای بهترشدن این نشیمن ساخته‌اند.', main_improvement_idea: 'با حفظ مبلمان، پیوند دو بخش نشیمن و مسیر حرکت را بهتر می‌کنیم.' },
  } as unknown as StudioMotherDocument },
};

function Preview() {
  const [status, setStatus] = useState('rendering');
  const [opened, setOpened] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [draft, setDraft] = useState('');
  const compact = useMediaQuery('(max-width:1199px)');
  const busy = status === 'pending' || status === 'rendering';
  const state = useConversationStudioResult({ plan, sessionId: null, versionId: 'discovery-fixture', originalImage: original, resultImage: result,
    showOriginal: false, onToggleOriginal: () => {}, onOpenChat: () => setOpenChat(true) });
  const drawer = <StudioConversationDrawer open={openChat} onOpenChange={setOpenChat} compact={compact} messages={[]} chipGroups={[]} onSelectChip={() => {}}
    busy={busy} statusText="در حال آماده‌سازی" value={draft} onChange={setDraft} onSend={() => {}} />;
  return <>
    {!opened ? <StudioDiscovery plan={status === 'pending' ? null : plan} originalImage={original} sessionId={null} busy={busy} resultAvailable={status === 'ready'}
      error={status === 'failed' ? 'تولید تصویر ناموفق بود؛ تحلیل و پیشنهادها حفظ شده‌اند.' : null} onComplete={() => { setOpened(true); window.scrollTo(0, 0); }}
      onRetry={() => setStatus('rendering')} onNew={() => { setOpened(false); setStatus('pending'); }} onDiscuss={() => setOpenChat(true)} panel={drawer} />
      : <StudioResultView state={{ ...state, handleFinalize: () => {} }} conversation={{ open: openChat, compact, onOpen: () => setOpenChat(true), onExit: () => setOpened(false),
        panel: drawer, toolbar: null, status: null, details: null, afterReport: null, busy: false, priceUnknown: false, onImageError: () => {}, onPreview: () => {} }} />}
    <div style={{ padding: 8, paddingBottom: 'calc(var(--studio-summary-height, 160px) + 32px)', background: 'var(--color-surface-muted)', fontSize: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }} dir="rtl">
      <span>پیش‌نمایش محلی — بدون مصرف مدل</span>
      <button onClick={() => { setOpened(false); setStatus('pending'); }}>قبل از تحلیل</button>
      <button onClick={() => { setOpened(false); setStatus('rendering'); }}>مرور هنگام رندر</button>
      <button onClick={() => setStatus('ready')}>تکمیل آزمایشی نتیجه</button>
      <button onClick={() => setStatus('failed')}>خطای آزمایشی تصویر</button>
    </div>
  </>;
}
createRoot(document.getElementById('root')!).render(<MemoryRouter><AppProviders><Preview /></AppProviders></MemoryRouter>);
