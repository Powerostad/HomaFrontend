import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useSiteTranslation } from '@/i18n/siteCopy';

export const loadingAssets = {
  before: '/images/studio/loading-v5/before.webp',
  after: '/images/studio/loading-v5/after.webp',
  editorial: '/images/studio/loading-v5/editorial.webp',
};

/** Slow visual motion only. It has no connection to processing progress. */
export function SampleComparison({ active }: { active: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const manualUntil = useRef(0);
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || typeof window.matchMedia !== 'function') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const animate = (time: number) => {
      if (!motion.matches && !document.hidden && !dragging.current && time > manualUntil.current) {
        const wave = Math.sin(time / 1000 * Math.PI / 6);
        const next = 50 + 27 * Math.sign(wave) * Math.pow(Math.abs(wave), .88);
        // Keep React/ARIA updates for manual input; ambient motion stays local.
        area.current?.style.setProperty('--wipe', `${next}%`);
        area.current?.setAttribute('aria-valuenow', String(Math.round(next)));
      }
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    };
    resume();
    motion.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener('change', resume); document.removeEventListener('visibilitychange', resume); };
  }, [active]);
  const change = (value: number) => {
    manualUntil.current = performance.now() + 6500;
    const next = Math.max(12, Math.min(88, value));
    setPosition(next);
    area.current?.style.setProperty('--wipe', `${next}%`);
  };
  const pointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width) change((event.clientX - box.left) / box.width * 100);
  };
  return <div ref={area} className="homa-loading-compare" role="slider" tabIndex={active ? 0 : -1}
    aria-label={copy('مقایسهٔ قبل و بعد یک پروژهٔ نمونه؛ با کلیدهای جهت جابه‌جا کن')}
    aria-valuemin={12} aria-valuemax={88} aria-valuenow={Math.round(position)}
    aria-orientation="horizontal"
    style={{ '--wipe': `${position}%` } as CSSProperties}
    onPointerDown={event => { if (event.button > 0) return; origin.current = { x: event.clientX, y: event.clientY }; }}
    onPointerMove={event => {
      if (!dragging.current && origin.current) {
        const dx = Math.abs(event.clientX - origin.current.x), dy = Math.abs(event.clientY - origin.current.y);
        if (dy > 8 && dy >= dx) { origin.current = null; return; }
        if (dx > 8 && dx > dy * 1.2) { dragging.current = true; event.currentTarget.setPointerCapture?.(event.pointerId); }
      }
      if (dragging.current) { event.preventDefault(); pointer(event); }
    }}
    onPointerUp={() => { dragging.current = false; origin.current = null; manualUntil.current = performance.now() + 6500; }}
    onPointerCancel={() => { dragging.current = false; origin.current = null; }}
    onLostPointerCapture={() => { dragging.current = false; origin.current = null; }}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = Number(area.current?.getAttribute('aria-valuenow') || position);
      change(event.key === 'Home' ? 12 : event.key === 'End' ? 88 : current + (event.key === 'ArrowRight' ? 4 : -4));
    }}>
    <img src={loadingAssets.before} alt={copy('اتاق خواب نمونه، پیش از طراحی')} width={860} height={1530} draggable={false} />
    <div className="homa-loading-after"><img src={loadingAssets.after} alt={copy('همان اتاق خواب نمونه، پس از طراحی')} width={860} height={1292} draggable={false} /></div>
    <div className="homa-loading-image-shade" />
    <span className="homa-loading-tag homa-loading-before-label">{copy('قبل')}</span>
    <span className="homa-loading-tag homa-loading-after-label">{copy('بعد')}</span>
    <div className="homa-loading-seam" /><div className="homa-loading-handle" aria-hidden="true">‹ ›</div>
  </div>;
}
