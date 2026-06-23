/**
 * Scroll-driven mobile sheet (Apple-Maps-card pattern).
 *
 * ONE native scroll container — no drag gestures, no nested scroll. The room
 * photo is a sticky layer sized to its OWN height (full-width, natural aspect);
 * the sheet (real page content) flows right under it and scrolls up over it.
 * So at rest the whole photo shows edge-to-edge with no crop and no dead space,
 * and the sheet starts exactly at the photo's bottom edge. This means:
 *  - scroll from anywhere, including over the photo (it's in the scroll flow);
 *  - momentum/rubber-band are native and never jitter;
 *  - scrolling to the very top brings the photo fully back (collapse).
 *
 * The consumer renders its own sticky nav + sticky-bottom input inside `children`.
 */
import { RD } from '../theme';
import { ChevronUp } from 'lucide-react';

export interface MobileSheetProps {
  /** Focus layer (room photo + pins + header). Sizes itself to the photo height. */
  focus: React.ReactNode;
  /** Sheet content (nav, panels, input). */
  children: React.ReactNode;
  /** The single scroll container ref (for programmatic scroll-to-top). */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Show the pull-up hint chip above the content. */
  showHint?: boolean;
}

export function MobileSheet({ focus, children, scrollRef, showHint = false }: MobileSheetProps) {
  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      {/* Sticky photo — sized to its own height; stays pinned behind as the sheet
          scrolls up over it. */}
      <div className="sticky top-0 z-0">{focus}</div>

      {/* Sheet flows directly under the photo (no gap, no letterbox). */}
      <div
        className="relative z-10 rounded-t-[28px] min-h-[100dvh] -mt-7"
        style={{ backgroundColor: RD.sheet, boxShadow: RD.sheetShadow }}
      >
        {/* Drag handle + pull-up hint (scroll does the work; this is the affordance). */}
        <div className="flex flex-col items-center gap-1 pt-2.5 pb-1.5">
          <span className="w-10 h-1 rounded-full" style={{ backgroundColor: RD.handle }} />
          {showHint && (
            <span
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: RD.inkSoft, fontFamily: 'Vazirmatn' }}
            >
              <ChevronUp size={12} strokeWidth={2.25} />
              جزئیات
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
