import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/utils/apiClient';

const STORAGE_KEY = 'homa.accommodation-test.initial-prompt.v1';
export function InitialPromptEditor({ value, onChange }: { value: string | null; onChange: (value: string) => void }) {
  const initialValue = useRef(value);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    apiGet<{ prompt: string; version: string }>('/recommendations/chat/image-first/initial-prompt/', undefined, { skipAuth: true, signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (!result.success || !result.data) throw new Error('prompt_unavailable');
      setDefaultPrompt(result.data.prompt);
      if (initialValue.current === null) {
        let saved: string | null = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be disabled. */ }
        onChange(saved?.trim() && saved.length <= 20000 ? saved : result.data.prompt);
      }
      setStatus('ready');
    }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt, onChange]);
  return <details className="studio-onboarding-tips studio-prompt-editor" open>
    <summary>پرامپت تصویر اول</summary>
    <p className="studio-subtle">این متن همراه عکس، عیناً به تصویرساز ارسال می‌شود؛ قالب و انتخاب‌های مراحل دیگر دوباره به آن اضافه نمی‌شوند.</p>
    {status === 'loading' && <p role="status">در حال دریافت پرامپت فعلی…</p>}
    {status === 'error' && <p role="alert">دریافت پرامپت انجام نشد. <button type="button" onClick={() => setAttempt(x => x + 1)}>تلاش دوباره</button></p>}
    {value !== null && <div className="studio-final-note"><label htmlFor="initial-image-prompt">متن کامل پرامپت تصویر اول</label><textarea id="initial-image-prompt" dir="auto" rows={12} maxLength={20000} value={value} onChange={event => { onChange(event.target.value); setMessage(''); }} /></div>}
    <div className="flex flex-wrap gap-4 mt-4">
      <button type="button" className="studio-inline-option" disabled={!value?.trim()} onClick={() => { try { localStorage.setItem(STORAGE_KEY, value!); setMessage('برای طراحی‌های بعدی روی همین مرورگر ذخیره شد.'); } catch { setMessage('مرورگر اجازهٔ ذخیره‌سازی نمی‌دهد؛ متن این طراحی حفظ شده است.'); } }}>ذخیره برای طراحی‌های بعدی</button>
      <button type="button" className="studio-inline-option" disabled={!defaultPrompt} onClick={() => { onChange(defaultPrompt); try { localStorage.removeItem(STORAGE_KEY); } catch { /* Keep the current draft editable. */ } setMessage('پرامپت پیش‌فرض فعلی برگشت.'); }}>بازگشت به پیش‌فرض</button>
    </div>
    {message && <p role="status" className="studio-subtle">{message}</p>}
  </details>;
}
