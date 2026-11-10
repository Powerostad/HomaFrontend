// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect,it,vi } from 'vitest';
import ModelComparePage from './ModelComparePage';
import { apiPost } from '@/utils/apiClient';
import { loadChatSession,streamChatTurn } from '../RoomRedesign/services/redesignChatService';
vi.mock('@/components/Header',()=>({Header:()=> <header>HOMA</header>}));
vi.mock('@/utils/apiClient',()=>({apiPost:vi.fn()}));
vi.mock('../RoomRedesign/services/redesignChatService',()=>({loadChatSession:vi.fn(),loadSessionDiagnostics:vi.fn(async()=>({success:false})),
  loadStudioPerformance:vi.fn(async()=>({success:false})),refreshSessionExpenses:vi.fn(),streamChatTurn:vi.fn(async()=>({ok:true}))}));

it('starts exactly two sessions with the same photo/brief and distinct pinned design models',async()=>{
  localStorage.clear();vi.clearAllMocks();
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  let n=0;vi.mocked(apiPost).mockImplementation(async()=>({success:true,data:{session_id:`session-${++n}`}}));
  vi.mocked(loadChatSession).mockResolvedValue({success:true,data:{session_id:'saved',status:'active',title:'',turns:[],operations:[{kind:'text_turn',status:'succeeded'},{kind:'render',status:'succeeded'}],
    versions:[{version_id:'v1',image_url:'https://offline.invalid/result.png',image_status:'ready',image_pending:false}]}});
  vi.stubGlobal('FileReader',class{result='data:image/png;base64,cGhvdG8=';onload?:()=>void;readAsDataURL(){this.onload?.();}});
  const el=document.createElement('div');document.body.append(el);const root=createRoot(el);
  try{
    await act(async()=>root.render(<MemoryRouter><ModelComparePage/></MemoryRouter>));
    const input=el.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input,'files',{value:[new File(['photo'],'room.png',{type:'image/png'})]});
    await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
    const start=[...el.querySelectorAll('button')].find(b=>b.textContent?.includes('اجرای هر دو مدل'))!;
    await act(async()=>{start.click();start.click();});
    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(vi.mocked(apiPost).mock.calls.map(c=>(c[1] as {comparison_design_model:string}).comparison_design_model)).toEqual(['gpt-6.1-sol','gemini-3.8-flash']);
    expect(streamChatTurn).toHaveBeenCalledTimes(2);
    const turns=vi.mocked(streamChatTurn).mock.calls.map(c=>c[0]);
    expect(turns[0].images).toEqual(turns[1].images);
    expect(turns[0].text).toBe(turns[1].text);
    expect(turns[0].prefsUpdate).toEqual({room_type:'accommodation_room'});
    expect(turns[0].idempotencyKey).not.toBe(turns[1].idempotencyKey);
    expect(el.textContent).toContain('تولید هر دو تصویر');
    expect(el.querySelectorAll('img[alt^="تصویر نهایی طراحی"]')).toHaveLength(2);
  }finally{await act(async()=>root.unmount());el.remove();vi.unstubAllGlobals();localStorage.clear();}
});
