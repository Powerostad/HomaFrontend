// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrintReportDocument, StudioPrintReport, waitForPrintAssets } from './StudioPrintReport';
import type { PrintReportState } from './printReportModel';
vi.mock('react-i18next', async original => ({ ...await original<typeof import('react-i18next')>(), useTranslation:() => ({ t:(key:string) => key, i18n:{ language:'en', dir:() => 'ltr' } }) }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation:() => ({ siteValue:(value:unknown) => value, siteText:(value:string) => value }) }));
const state:PrintReportState = { projectName:'My room', originalImage:null, resultImage:'', analysisOnly:true, categoryGroups:[], basketProductIds:new Set(), productQuantityOverrides:new Map(), diagnosisDetail:'<script>not HTML</script>' };
let root:Root; let container:HTMLDivElement;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?:boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); });
describe('print report', () => {
  it('escapes saved text, marks missing media, and does not include technical costs or prompts', async () => {
    await act(async () => root.render(<PrintReportDocument state={state} date="2026-10-17T19:00:00Z" />));
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>not HTML</script>');
    expect(container.textContent).toContain('studioPrint.noProblems');
    expect(container.querySelectorAll('.studio-print-missing')).toHaveLength(2);
    expect(container.textContent).not.toContain('studioDiagnostics');
  });
  it('opens a preview without printing, prints only explicitly, and removes the private print root on close', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    vi.stubGlobal('requestAnimationFrame', (callback:() => void) => { callback(); return 1; });
    await act(async () => root.render(<StudioPrintReport state={state} />));
    expect(document.querySelector('.homa-print-root')).toBeNull();
    await act(async () => container.querySelector('button')!.click());
    expect(print).not.toHaveBeenCalled();
    expect(document.querySelector('.homa-print-root')).not.toBeNull();
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'studioPrint.print')!.click());
    expect(print).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
    expect(document.querySelector('.homa-print-root')).toBeNull();
    vi.unstubAllGlobals();
  });
  it('waits for pending media and refuses to report readiness after a timeout', async () => {
    const report = document.createElement('div'); const img = document.createElement('img'); report.append(img);
    Object.defineProperty(img, 'complete', { value:false });
    const result = waitForPrintAssets(report, 10);
    expect(await result).toBe(false);
    const loaded = waitForPrintAssets(report, 1000); img.dispatchEvent(new Event('load'));
    expect(await loaded).toBe(true);
  });
});
