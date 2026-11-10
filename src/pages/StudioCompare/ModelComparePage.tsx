import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/utils/apiClient';
import { loadChatSession, loadSessionDiagnostics, loadStudioPerformance, refreshSessionExpenses, streamChatTurn,
  type SessionPayload, type SessionDiagnosticsReport, type StudioPerformanceReport } from '../RoomRedesign/services/redesignChatService';

const models=['gpt-6.1-sol','gemini-3.8-flash'] as const;
type Model=typeof models[number];
type Arm={id?:string;stage?:string;error?:string;session?:SessionPayload;diagnostics?:SessionDiagnosticsReport;performance?:StudioPerformanceReport};
const storage='homa.local.model-compare.v1';
function saved():Partial<Record<Model,Arm>> {
  try{return JSON.parse(localStorage.getItem(storage)||'{}');}catch{return {};}
}

export default function ModelComparePage(){
  const [arms,setArms]=useState<Partial<Record<Model,Arm>>>(saved);
  const [image,setImage]=useState('');const [brief,setBrief]=useState('');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const locked=useRef(false);const controllers=useRef<AbortController[]>([]);
  const patch=(model:Model,value:Partial<Arm>)=>setArms(old=>({...old,[model]:{...old[model],...value}}));
  async function read(model:Model,id:string){
    const [session,diagnostics,performance]=await Promise.allSettled([loadChatSession(id),loadSessionDiagnostics(id),loadStudioPerformance(id)]);
    const value:Partial<Arm>={};
    if(session.status==='fulfilled'&&session.value.success&&session.value.data)value.session=session.value.data as SessionPayload;
    if(diagnostics.status==='fulfilled'&&diagnostics.value.success)value.diagnostics=diagnostics.value.data;
    if(performance.status==='fulfilled'&&performance.value.success)value.performance=performance.value.data;
    setArms(old=>old[model]?.id===id?{...old,[model]:{...old[model],...value}}:old);
    return !!value.session?.operations?.length&&!value.session.operations.some(o=>o.status==='running');
  }
  const ids=models.map(m=>arms[m]?.id||'').join('|');
  useEffect(()=>{
    localStorage.setItem(storage,JSON.stringify(Object.fromEntries(models.filter(m=>arms[m]?.id).map(m=>[m,{id:arms[m]!.id}]))));
    if(!ids.replace(/\|/g,''))return;
    const pairs=models.flatMap(m=>arms[m]?.id?[[m,arms[m]!.id!] as const]:[]);
    const poll=async()=>{const done=await Promise.all(pairs.map(([m,id])=>read(m,id)));if(done.every(Boolean))clearInterval(timer);};
    const timer=setInterval(()=>void poll(),6000);
    void poll();
    return ()=>clearInterval(timer);
    // Session IDs define polling; reading updates must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ids]);
  useEffect(()=>()=>controllers.current.forEach(c=>c.abort()),[]);
  async function run(){
    if(locked.current||!image)return;
    locked.current=true;setBusy(true);setMessage('');
    try{
      const created=await Promise.all(models.map(async model=>{
        const result=await apiPost<{session_id:string}>('/recommendations/chat/sessions/',{comparison_design_model:model,search_version:'studio-search-v1',prompt_split:'server-split-v1'});
        if(!result.success||!result.data)throw new Error(result.error||'ایجاد جلسه ناموفق بود.');
        return {model,id:result.data.session_id};
      }));
      setArms(Object.fromEntries(created.map(x=>[x.model,{id:x.id,stage:'در حال شروع'}])));
      await Promise.all(created.map(async ({model,id})=>{
        const controller=new AbortController();controllers.current.push(controller);
        try{
          await streamChatTurn({sessionId:id,text:brief,images:[image],prefsUpdate:{room_type:'accommodation_room'},idempotencyKey:crypto.randomUUID()},
            {onStage:e=>patch(model,{stage:e.label_fa}),onError:error=>patch(model,{error}),onConnectionLost:()=>patch(model,{error:'ارتباط قطع شد؛ نتیجهٔ ذخیره‌شده را دوباره بخوان. اجرای خودکار تکرار نمی‌شود.'})},controller.signal);
        }catch{patch(model,{error:'اتصال کامل نشد؛ نتیجه را از جلسهٔ ذخیره‌شده بررسی کن.'});}
        finally{await read(model,id);}
      }));
    }catch(error){setMessage(error instanceof Error?error.message:'شروع مقایسه ناموفق بود.');}
    finally{locked.current=false;setBusy(false);}
  }
  const running=busy||models.some(m=>arms[m]?.session?.operations?.some(o=>o.status==='running'));
  return <div dir="rtl"><Header/><main style={{maxWidth:1400,margin:'auto',padding:24}}>
    <h1>مقایسهٔ مدل طراحی: Sol 6.1 و Gemini 3.8</h1>
    <p>عکس، درخواست، پرامپت، کاتالوگ و جست‌وجو یکسان‌اند. فقط مدل طراحی فرق دارد؛ تطبیق بصری برای هر دو Gemini 3.8 و تصویرساز هر دو gpt-image-2.5-sunburst است.</p>
    <p>هر اجرا شامل دو مسیر طراحی و دو تولید تصویر با هزینه است. این مقایسهٔ کیفی است؛ یک نمونه برای اعلام برتری قطعی کافی نیست.</p>
    <p>فعلاً درخواست خالی در مسیر اقامتگاه با هدف «تبدیل اتاق خواب به فضایی الهام‌گرفته از هتل پنج‌ستاره، با روتختی شیک، تاج تخت شاخص و نور گرم چندلایه» اجرا می‌شود. برای هدف متفاوت، درخواست خودت را بنویس.</p>
    <label>عکس مشترک اتاق <input type="file" accept="image/jpeg,image/png,image/webp" disabled={running} onChange={e=>{
      const file=e.target.files?.[0];if(!file)return;if(file.size>8*1024*1024){setMessage('عکس حداکثر ۸ مگابایت باشد.');return;}
      const reader=new FileReader();reader.onload=()=>setImage(String(reader.result));reader.readAsDataURL(file);
    }}/></label>
    {image&&<img src={image} alt="عکس مشترک ورودی" style={{display:'block',maxHeight:300,maxWidth:'100%',marginBlock:16}}/>}
    <label style={{display:'block'}}>درخواست مشترک<textarea aria-label="درخواست مشترک" value={brief} disabled={running} maxLength={4000} onChange={e=>setBrief(e.target.value)} style={{display:'block',width:'100%',minHeight:95,marginBlock:12}}/></label>
    <Button disabled={!image||running} onClick={()=>void run()}>اجرای هر دو مدل + تولید هر دو تصویر</Button>
    {message&&<p role="alert">{message}</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:24,marginTop:24}}>
      {models.map(model=>{
        const arm=arms[model];const plan=arm?.session?.current_execution;
        const cost=arm?.diagnostics?.expenses;
        const version=arm?.session?.versions?.[arm.session.versions.length-1];
        return <section key={model} style={{border:'1px solid #ddd',borderRadius:12,padding:20,minWidth:0}}>
          <h2 dir="ltr">{model}</h2><p>{arm?.session?.operations?.some(o=>o.status==='running')?arm.stage||'در حال پردازش':arm?.id?'خروجی ذخیره‌شده':'هنوز اجرا نشده'}</p>
          {arm?.error&&<p role="alert">{arm.error}</p>}
          {version?.image_status==='pending'&&<p role="status">در حال تولید تصویر این شاخه…</p>}
          {version?.image_status==='failed'&&<p role="alert">تولید تصویر این شاخه کامل نشد؛ گزارش جلسه را بررسی کن.</p>}
          {version?.image_status==='not_requested'&&<p>این اجرای قدیمی بدون تصویر بوده است؛ تست جدید، تصویر هم تولید می‌کند.</p>}
          {version?.image_url&&!version.image_pending&&<img src={version.image_url} alt={`تصویر نهایی طراحی ${model}`} style={{display:'block',width:'100%',height:'auto',marginBlock:16}}/>}
          {Object.entries(plan?.studio_documents||{}).map(([id,d])=><p key={id} style={{whiteSpace:'pre-wrap'}}>{d.design_narrative}</p>)}
          {(plan?.purchases||[]).map(item=><article key={item.item_id} style={{borderTop:'1px solid #ddd',paddingBlock:12}}>
            {item.product?.image_url&&<img src={item.product.image_url} alt={item.product.name} style={{height:120,width:120,objectFit:'contain'}}/>}
            <b>{item.product?.name||item.mother_product?.product_name_generic||item.category}</b>
            <p>{item.product?item.product.price_toman!=null?`${item.product.price_toman.toLocaleString('fa-IR')} تومان`:'قیمت نامشخص':'تصویرسازی مفهومی؛ محصول منطبق تأیید نشده'}</p>
          </article>)}
          {arm?.id&&<><p>هزینهٔ ثبت‌شده: {cost?.known_paid_toman??'نامشخص'} تومان · {cost?.known_usd??'نامشخص'} USD</p>
            <p>متن: {cost?.text_usd??'نامشخص'} USD · تصویر: {cost?.image_usd??'نامشخص'} USD</p>
            <p>زمان ثبت‌شده: {arm.performance?.summary?.trace_elapsed_timestamp_ms!=null?`${Math.round(arm.performance.summary.trace_elapsed_timestamp_ms/1000)} ثانیه`:'نامشخص'}</p>
            <Button variant="outline" onClick={()=>void read(model,arm.id!)}>خواندن دوبارهٔ نتیجه</Button>{' '}
            <Button variant="outline" disabled={running} onClick={()=>void refreshSessionExpenses(arm.id!).then(()=>read(model,arm.id!))}>دریافت رسید هزینه</Button>
            <p><Link to={`/studio/chat/${arm.id}`}>بازکردن جلسه و گزارش کامل</Link></p>
            <details><summary>خروجی، گزارش مدل و زمان</summary><pre dir="auto" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify({plan,diagnostics:arm.diagnostics,performance:arm.performance},null,2)}</pre></details>
          </>}
        </section>;
      })}
    </div>
  </main></div>;
}
