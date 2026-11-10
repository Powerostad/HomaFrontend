// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, it, vi } from 'vitest';
import { PublicShowcase } from './PublicShowcase';
import { fetchPublicShowcase, fetchPublicShowcaseGroups, fetchPublicCategories } from '@/services/publicShowcaseService';
vi.mock('@/components/Header',()=>({Header:()=>null}));
vi.mock('@/components/Footer',()=>({Footer:()=>null}));
vi.mock('@/hooks/useSeo', () => ({ useSeo: vi.fn() }));
vi.mock('@/services/publicShowcaseService', () => ({ fetchPublicShowcase: vi.fn(), fetchPublicShowcaseGroups: vi.fn(), fetchPublicCategories: vi.fn() }));
vi.mock('@/components/figma/ImageWithFallback', () => ({ ImageWithFallback: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props}/> }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (_key: string, fallback: string) => fallback, i18n: { language: 'fa', dir: () => 'rtl' } }) }));
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; window.history.replaceState(null,'','/explore?category=test'); vi.mocked(fetchPublicCategories).mockResolvedValue([]); vi.mocked(fetchPublicShowcaseGroups).mockResolvedValue([]); });
it('renders all categories as separately labelled sections with their own products', async () => {
  window.history.replaceState(null, '', '/explore');
  vi.mocked(fetchPublicShowcaseGroups).mockResolvedValue([
    {category:{code:'bedding',label:'روتختی'},results:[{image_url:'/bedding-photo/',price:100}]},
    {category:{code:'lighting',label:'روشنایی'},results:[{image_url:'/lamp-photo/',price:200}]},
  ]);
  const node = document.createElement('div'); const root = createRoot(node);
  try {
    await act(async () => root.render(<PublicShowcase/>));
    const sections = node.querySelectorAll('section');
    expect(sections).toHaveLength(2);
    expect(sections[0].querySelector('h2')?.textContent).toBe('روتختی');
    expect(sections[0].querySelector('img')?.getAttribute('src')).toBe('/bedding-photo/');
    expect(sections[1].querySelector('img')?.getAttribute('src')).toBe('/lamp-photo/');
    expect(sections[1].querySelector('a')?.getAttribute('href')).toBe('/explore?category=lighting');
  } finally { await act(async () => root.unmount()); }
});
it('renders only product photos and prices without details, seller or external links', async () => {
  vi.mocked(fetchPublicShowcase).mockResolvedValue([{ image_url:'/opaque-photo/', price:1000000 },{ image_url:'/other-photo/', price:null }]);
  const node=document.createElement('div');const root=createRoot(node);
  try {
    await act(async () => root.render(<PublicShowcase/>));
    expect(node.querySelectorAll('figure')).toHaveLength(2);
    expect([...node.querySelectorAll('img')].map(x=>x.alt)).toEqual(['تصویر محصول','تصویر محصول']);
    expect(node.querySelectorAll('figure a')).toHaveLength(0);
    expect(node.textContent).toContain('قیمت اعلام نشده');
    expect(node.querySelectorAll('figure h2,figure p,figure button')).toHaveLength(0);
  } finally { await act(async () => root.unmount()); }
});
it('shows retry rather than falling back to the full catalogue API', async () => {
  vi.mocked(fetchPublicShowcase).mockRejectedValue(new Error('unavailable'));
  const node=document.createElement('div');const root=createRoot(node);
  try { await act(async()=>root.render(<PublicShowcase/>));expect(node.textContent).toContain('تلاش دوباره');expect(node.querySelectorAll('figure')).toHaveLength(0); }
  finally { await act(async()=>root.unmount()); }
});
it('switches the category request and exposes its real subcategories', async () => {
  vi.mocked(fetchPublicCategories).mockResolvedValue([{code:'window_coverings',label:'پرده',children:[{code:'curtain_panel',label:'پرده پارچه‌ای',children:[]}]}]);
  vi.mocked(fetchPublicShowcase).mockResolvedValue([{image_url:'/curtain-photo/',price:100000}]);
  const node=document.createElement('div');const root=createRoot(node);
  try {
    await act(async()=>root.render(<PublicShowcase/>));
    const link=node.querySelector<HTMLAnchorElement>('a[href="/explore?category=window_coverings"]')!;
    await act(async()=>link.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0})));
    expect(fetchPublicShowcase).toHaveBeenLastCalledWith(expect.any(AbortSignal),'window_coverings');
    expect(node.querySelector('select')?.textContent).toContain('پرده پارچه‌ای');
    const select=node.querySelector('select')!;select.value='curtain_panel';
    await act(async()=>select.dispatchEvent(new Event('change',{bubbles:true})));
    expect(fetchPublicShowcase).toHaveBeenLastCalledWith(expect.any(AbortSignal),'curtain_panel');
    expect(node.querySelectorAll('figure')).toHaveLength(1);
  } finally {await act(async()=>root.unmount());window.history.replaceState(null,'','/');}
});
