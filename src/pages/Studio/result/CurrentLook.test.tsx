// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { CurrentLook } from './CurrentLook';
import type { StudioResultViewState } from './viewState';
vi.mock('react-i18next', async original => ({...await original<typeof import('react-i18next')>(), useTranslation:()=>({t:(key:string)=>key,i18n:{dir:()=> 'rtl'}}) }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation:()=>({siteValue:(value:unknown)=>value,siteText:(value:string)=>value}) }));
it('opens saved selections without changing them and restores focus on close', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT=true;
  const toggle=vi.fn(); const details=vi.fn();
  const state={categoryGroups:[{itemId:1,categoryDisplay:'Rug',actionStatus:'available',products:[{id:'rug1',name:'Main rug',price:100,image:'',uniqueLink:'rug1'},{id:'rug2',name:'Selected alternative',price:200,image:'',uniqueLink:'rug2'}]}],basketProductIds:new Set(['rug2']),selectedPrice:200,toggleBasketProduct:toggle,handleProductClick:details} as unknown as StudioResultViewState;
  const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
  try {
    await act(async()=>root.render(<CurrentLook state={state}/>));
    const trigger=container.querySelector('button')!;
    await act(async()=>trigger.click());
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Selected alternative');
    expect(toggle).not.toHaveBeenCalled();expect(details).not.toHaveBeenCalled();
    const select=document.querySelector<HTMLButtonElement>('[role=dialog] button[aria-pressed=true]')!;
    await act(async()=>select.click());expect(toggle).toHaveBeenCalledExactlyOnceWith('rug2');
    await act(async()=>document.querySelector<HTMLButtonElement>('.studio-current-look-close')!.click());
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  } finally { await act(async()=>root.unmount());container.remove(); }
});
