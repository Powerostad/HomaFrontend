// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { BilingualSwitch } from './BilingualSwitch';

const state = vi.hoisted(() => ({ language: 'fa', changeLanguage: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: state }) }));
let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(() => {
  if (root) flushSync(() => root?.unmount());
  container?.remove();
  vi.clearAllMocks();
});

describe('bilingual shortcut', () => {
  for (const [source, target, label] of [['fa', 'en', 'English'], ['en', 'fa', 'فارسی']]) {
    it(`switches from ${source} to ${target} without dropping other URL state`, () => {
      state.language = source;
      window.history.replaceState({ preserved: true }, '', '/?example=1#section');
      container = document.createElement('div');
      document.body.append(container);
      root = createRoot(container);
      flushSync(() => root?.render(<BilingualSwitch />));
      const button = container.querySelector('button')!;
      expect(button.textContent).toBe(label);
      expect(button.getAttribute('lang')).toBe(target);
      button.click();
      expect(state.changeLanguage).toHaveBeenCalledWith(target);
      expect(new URLSearchParams(window.location.search).get('lang')).toBe(target);
      expect(new URLSearchParams(window.location.search).get('example')).toBe('1');
      expect(window.location.hash).toBe('#section');
      expect(window.history.state).toEqual({ preserved: true });
    });
  }
});
