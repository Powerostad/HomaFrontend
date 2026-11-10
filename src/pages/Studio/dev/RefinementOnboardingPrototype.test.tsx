// @vitest-environment jsdom
import { act, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefinementCoachmarkPrototype, refinementStarterExamples, useRefinementOnboardingPrototype } from './RefinementOnboardingPrototype';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (value: string) => value }) }));
beforeEach(() => { localStorage.clear(); Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

async function mount(profile = 'test-profile') {
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  function Harness() {
    const [ready, setReady] = useState(false), [open, setOpen] = useState(false);
    const state = useRefinementOnboardingPrototype({ enabled: true, ready, open, profile });
    const start = () => { state.enterComposer(); setOpen(true); };
    return <><button id="ready" onClick={() => setReady(true)}>ready</button>
      <button id="review" onClick={() => setReady(false)}>review</button>
      <button id="open" onClick={start}>open</button>
      <button id="close" onClick={() => { state.closeComposer(); setOpen(false); }}>close</button>
      <output>{state.startersVisible ? 'starters' : 'no-starters'}</output>
      {state.hintVisible && <RefinementCoachmarkPrototype onDismiss={state.dismiss} onStart={start} />}</>;
  }
  await act(async () => root.render(<StrictMode><Harness /></StrictMode>));
  return { node, click: async (id: string) => act(async () => node.querySelector<HTMLButtonElement>(`#${id}`)!.click()),
    cleanup: async () => { await act(async () => root.unmount()); node.remove(); } };
}

describe('contextual refinement onboarding prototype', () => {
  it('does not consume the one-time introduction while the result tab is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    const ui = await mount();
    try {
      await ui.click('ready');
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
      expect(localStorage.getItem('homa:prototype:refinement-onboarding:v1:test-profile:hint')).toBeNull();
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(document.querySelector('.studio-refinement-coachmark')).not.toBeNull();
    } finally { await ui.cleanup(); }
  });
  it('waits for the result journey and shows only once, including reload before dismissal', async () => {
    let ui = await mount();
    try {
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
      await ui.click('ready');
      expect(document.querySelectorAll('.studio-refinement-coachmark')).toHaveLength(1);
      await ui.cleanup(); ui = await mount(); await ui.click('ready');
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
    } finally { await ui.cleanup(); }
  });

  it('dismisses without opening a composer and does not replay after reviewing the design', async () => {
    const ui = await mount();
    try {
      await ui.click('ready');
      await act(async () => document.querySelector<HTMLButtonElement>('.studio-refinement-coachmark header button')!.click());
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
      expect(ui.node.querySelector('output')?.textContent).toBe('no-starters');
      await ui.click('review'); await ui.click('ready');
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
    } finally { await ui.cleanup(); }
  });

  it('opens starter suggestions on first composer entry only and keeps ordinary requests possible', async () => {
    const ui = await mount();
    try {
      await ui.click('ready');
      await act(async () => document.querySelector<HTMLButtonElement>('.studio-refinement-coachmark footer button')!.click());
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
      expect(ui.node.querySelector('output')?.textContent).toBe('starters');
      expect(refinementStarterExamples.map(item => item.id)).toEqual(['color', 'layout', 'budget']);
      await ui.click('close'); await ui.click('open');
      expect(ui.node.querySelector('output')?.textContent).toBe('no-starters');
    } finally { await ui.cleanup(); }
  });

  it('keeps dismissal in memory when persistent storage is unavailable', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const ui = await mount();
    try {
      await ui.click('ready');
      await act(async () => document.querySelector<HTMLButtonElement>('.studio-refinement-coachmark header button')!.click());
      await ui.click('review'); await ui.click('ready');
      expect(document.querySelector('.studio-refinement-coachmark')).toBeNull();
    } finally { await ui.cleanup(); storage.mockRestore(); }
  });
});
