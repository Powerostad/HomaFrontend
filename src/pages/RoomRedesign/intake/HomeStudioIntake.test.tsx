// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { HomeStudioIntake } from './HomeStudioIntake';
vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteDirection: () => 'rtl' }) }));
vi.mock('./intakePhoto', () => ({ prepareIntakeImage: async (file: File) => ({ image: { dataUrl: file.name === 'reference.png' ? 'reference-photo' : 'room-photo', width: 1000, height: 800 }, tooSmall: false }) }));
async function setup() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const node = document.createElement('div'); document.body.append(node); const root=createRoot(node), start=vi.fn();
  await act(async () => root.render(<MemoryRouter><HomeStudioIntake onStartAnalysis={start} /></MemoryRouter>));
  const click=async (text: string) => { const button=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text)); expect(button).toBeDefined(); await act(async()=>button!.click()); };
  const upload=async (label: string, name: string) => { const input=node.querySelector(`input[aria-label="${label}"]`)!; Object.defineProperty(input,'files',{value:[new File(['x'],name,{type:'image/png'})],configurable:true}); await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true}))); };
  return { node, start, click, upload, close: async()=>{await act(async()=>root.unmount());node.remove();} };
}
it('offers two rooms, advances immediately, confirms photo and permits no note/reference', async()=>{
 const ui=await setup();try {
 expect(ui.node.querySelectorAll('.home-intake-rooms button')).toHaveLength(2);
 expect(ui.node.textContent).not.toContain('آشپزخانه');
 await ui.click('اتاق خواب');expect(ui.node.querySelectorAll('figure')).toHaveLength(2);
 await ui.upload('انتخاب عکس اتاق','room.png');expect(ui.start).not.toHaveBeenCalled();
 await ui.click('تأیید عکس');await ui.click('فعلاً نظری ندارم');await ui.click('شروع بررسی فضا');
 expect(ui.start).toHaveBeenCalledTimes(1);
 expect(ui.start.mock.calls[0][0]).toMatchObject({roomType:'bedroom',prefsUpdate:{room_type:'bedroom'},goals:[],image:{dataUrl:'room-photo'}});
 expect(ui.start.mock.calls[0][0].inspirationImage).toBeUndefined();
 }finally{await ui.close();}
});
it('keeps inspiration distinct from actual room photo and prevents duplicate starts',async()=>{
 const ui=await setup();try {
 await ui.click('پذیرایی و نشیمن');await ui.upload('انتخاب عکس اتاق','room.png');await ui.click('تأیید عکس');await ui.click('ادامه');
 await ui.upload('انتخاب عکس الهام','reference.png');await ui.click('شروع بررسی فضا');await ui.click('شروع بررسی فضا');
 expect(ui.start).toHaveBeenCalledTimes(1);
 expect(ui.start.mock.calls[0][0]).toMatchObject({image:{dataUrl:'room-photo'},inspirationImage:{dataUrl:'reference-photo'}});
 }finally{await ui.close();}
});
