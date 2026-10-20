import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StudioResultView } from '../ResultPage';
import { StudioConversationDrawer } from '../../RoomRedesign/components/StudioConversationDrawer';
import { useConversationStudioResult } from '../../RoomRedesign/hooks/useConversationStudioResult';
import { useMediaQuery } from '../../RoomRedesign/hooks/useMediaQuery';
import type { BackendProduct, ExecutionPlan } from '../../RoomRedesign/services/redesignChatService';
import type { ChatMessage } from '../../RoomRedesign/types';
import '../../RoomRedesign/studio-conversation.css';
import { StudioDiscovery } from '../../RoomRedesign/components/StudioDiscovery';
import { studioV2Fixture } from './studioV2Fixture';

// Illustrative data only. Never represents an account, quote or model result.
const product = (id: number, name: string, category: string, price: number, image: string): BackendProduct => ({
  product_id: id, name, category_fa: category, price_rial: price,
  image_url: image, unique_link: `local-preview-${id}`,
  description: 'محصول و قیمت نمونه برای بررسی رابط کاربری؛ قابل سفارش نیست.',
});
const legacyPlan: ExecutionPlan = {
  purchases: [
    { item_id: 'table', quantity: 1, category: 'میز جلو مبلی', relation: 'sample', reason_fa: 'فرم ساده و بافت چوب با نشیمن هماهنگ است.',
      product: product(1, 'میز جلو مبلی چوبی مدرن', 'میز جلو مبلی', 115900000, '/images/studio/preset-modern-living.webp'),
      alternatives: [product(2, 'میز جلو مبلی با فرم گرد', 'میز جلو مبلی', 98000000, '/images/studio/preset-warm-living.webp'), product(5, 'میز جلو مبلی با رنگ روشن', 'میز جلو مبلی', 108000000, '/images/studio/preset-dining.webp')] },
    { item_id: 'rug', quantity: 1, category: 'فرش', relation: 'sample', reason_fa: 'بافت طبیعی و رنگ خنثی به تعادل فضا کمک می‌کند.',
      product: product(3, 'فرش کرم با بافت طبیعی', 'فرش', 43500000, '/images/comparison/rug/after.webp'),
      alternatives: [product(4, 'فرش با طرح کلاسیک', 'فرش', 55000000, '/images/comparison/rug/before.webp')] },
    { item_id: 'light', quantity: 1, category: 'روشنایی', relation: 'sample', reason_fa: 'نور گرم یک لایهٔ روشنایی ملایم به فضا اضافه می‌کند.', product: null, alternatives: [] },
  ],
  free_actions: [{ instruction_fa: 'پایه‌های جلویی مبل را روی فرش قرار دهید.', reason_fa: 'انسجام بیشتر محدودهٔ نشیمن.' }],
  surface_actions: [{ change_fa: 'بررسی رنگ‌آمیزی دیوار با رنگ خنثی.' }],
  known_subtotal_rial: 159400000, budget_ceiling_toman: null, budget_status: 'sample', unknown_cost_item_ids: ['light'],
};

export default function LocalStudioPreview() {
  const plan = new URLSearchParams(window.location.search).get('preview') === 'v2' ? studioV2Fixture : legacyPlan;
  const { t } = useTranslation();
  const compact = useMediaQuery('(max-width: 1199px)');
  const [open, setOpen] = useState(false);
  const [original, setOriginal] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState('');
  const [demoPhase, setDemoPhase] = useState<'loading' | 'review' | 'result'>(() => new URLSearchParams(window.location.search).get('preview') === 'loading' ? 'loading' : 'result');
  const openChat = () => setOpen(true);
  const state = useConversationStudioResult({ plan, sessionId: 'local-ui-preview', versionId: 'sample-v1',
    resultImage: '/images/studio/preset-warm-living.webp', originalImage: '/images/studio/preset-modern-living.webp',
    showOriginal: original, onToggleOriginal: setOriginal, onOpenChat: openChat });
  const append = (text: string) => {
    if (!text.trim()) return;
    setMessages(previous => [...previous, { id: `local-${previous.length}`, role: 'user', text: text.trim() }]);
    setNotice(t('studioLocal.noModel'));
  };
  if (demoPhase !== 'result') return <StudioDiscovery plan={demoPhase === 'review' ? plan : null} originalImage="/images/studio/preset-modern-living.webp" sessionId={null} busy={demoPhase === 'loading'} error={null} resultAvailable={demoPhase === 'review'} onRetry={() => {}} onNew={() => setDemoPhase('result')} onDiscuss={openChat} onComplete={() => setDemoPhase('result')} panel={<Button variant="outline" onClick={() => setDemoPhase(demoPhase === 'loading' ? 'review' : 'result')}>{t('studioLocal.hint')} · {demoPhase === 'loading' ? 'نمایش تحلیل نمونه' : 'نمایش نتیجه نمونه'}</Button>} />;
  return <StudioResultView state={{ ...state, handleFinalize: async () => setNotice(t('studioLocal.noCheckout')) }} conversation={{
    open, compact, onOpen: openChat, onClose: () => setOpen(false), onExit: () => setNotice(t('studioLocal.hint')),
    busy: false, priceUnknown: true, onImageError: () => setNotice(t('studioLocal.imageError')),
    onPreview: () => setNotice(t('studioLocal.noModel')),
    onRefineProduct: async (_product, text) => { append(text); openChat(); return true; },
    panel: <StudioConversationDrawer open={open} onOpenChange={setOpen} compact={compact}
      messages={messages} chipGroups={[]} busy={false} statusText="" value={input} onChange={setInput}
      onSend={() => { append(input); setInput(''); }} onSelectChip={() => {}} />,
    toolbar: <p>{t('studioLocal.hint')}</p>,
    status: <div className="studio-local-preview-note"><span>{t('studioLocal.hint')}</span>{notice && <p role="status">{notice}</p>}</div>,
    details: <p>{t('studioLocal.analysis')}</p>,
    afterReport: <><details><summary>{t('studioLocal.report')}</summary><p>{t('studioLocal.noModel')}</p><Button variant="outline" onClick={() => setMessages([])}>{t('studioLocal.clearChat')}</Button></details></>,
  }} />;
}
