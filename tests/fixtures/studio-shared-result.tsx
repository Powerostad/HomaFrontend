import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/context/AppProviders';
import { StudioResultView } from '../../src/pages/Studio/ResultPage';
import { ConversationResult } from '../../src/pages/RoomRedesign/RoomRedesignPage';
import { useConversationStudioResult } from '../../src/pages/RoomRedesign/hooks/useConversationStudioResult';
import { useMediaQuery } from '../../src/pages/RoomRedesign/hooks/useMediaQuery';
import type { useRedesignChat } from '../../src/pages/RoomRedesign/hooks/useRedesignChat';
import type { ExecutionPlan } from '../../src/pages/RoomRedesign/services/redesignChatService';
import '../../src/i18n/config';
import '../../src/styles/globals.css';

// Development-only fixture. No model or basket mutations are sent by these controls.
const plan: ExecutionPlan = { purchases: [
  { item_id: 'lamp', category: 'روشنایی', quantity: 1, reason_fa: 'نور گرم کنار مبل، روشنایی فضا را کامل می‌کند.', relation: 'similar', product: { product_id: 7, name: 'چراغ ایستاده با پایهٔ چوبی', price_rial: 24000000, unique_link: 'fixture-lamp', image_url: '/images/studio/preset-warm-living.webp' }, alternatives: [{ product_id: 8, name: 'چراغ جایگزین بدون قیمت', price_rial: null, image_url: '' }] },
  { item_id: 'rug', category: 'فرش', quantity: 1, reason_fa: 'اتصال بخش‌های نشیمن با یک بافت طبیعی.', relation: 'concept', product: null, alternatives: [] },
], free_actions: [{ instruction_fa: 'مبل را به پنجره نزدیک‌تر کن.', reason_fa: 'استفاده از نور طبیعی' }], surface_actions: [], known_subtotal_rial: 24000000, unknown_cost_item_ids: ['rug'], budget_ceiling_toman: null, budget_status: 'incomplete' };
const original = '/images/studio/example-good.webp';
const result = '/images/studio/preset-warm-living.webp';
function Preview() {
  const [viewedId, selectVersion] = useState('v1');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const compact = useMediaQuery('(max-width:1199px)');
  const state = useConversationStudioResult({ plan, sessionId: null, versionId: 'fixture', resultImage: result, originalImage: original, showOriginal: viewedId === 'original', onToggleOriginal: show => selectVersion(show ? 'original' : 'v1'), onOpenChat: () => setOpen(true) });
  const version = { version_id: 'v1', base_version_id: 'original', image_url: result, explanation: '', execution: plan, legacy_incomplete: false };
  const chat: ReturnType<typeof useRedesignChat> = { sessionId: null, messages: [{ id: '1', role: 'user', text: '', imageUrl: original }, { id: '2', role: 'assistant', text: 'نور طبیعی فضا مناسب است؛ با یک چراغ کنار مبل شروع می‌کنیم.' }], chipGroups: [],
    versions: [version], currentExecution: plan, originalImage: original, viewedId, selectVersion: async id => { selectVersion(id); }, selectedVersion: viewedId === 'v1' ? version : undefined,
    busy: false, status: 'idle', stage: null, error: new URLSearchParams(location.search).has('failed') ? 'تولید تصویر ناموفق بود؛ تحلیل و محصولات ذخیره شده‌اند.' : null, unavailable: false, hydrating: false,
    sendTurn: async () => false, retry: async () => {}, selectChip: () => {}, newVersionReady: false };
  if (new URLSearchParams(location.search).has('reference')) return <StudioResultView state={{ ...state, handleFinalize: () => {} }} />;
  return <ConversationResult chat={chat} plan={plan} versionId="fixture-connected" resultImage={result} originalImage={original} onToggleOriginal={show => selectVersion(show ? 'original' : 'v1')} onImageError={() => {}} compact={compact} chatOpen={open} setChatOpen={setOpen} input={draft} setInput={setDraft} sendMessage={() => {}} fresh={() => {}} />;
}
createRoot(document.getElementById('root')!).render(<MemoryRouter><AppProviders><Preview /></AppProviders></MemoryRouter>);
