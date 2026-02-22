/**
 * CompletionChecklist — "تکمیل پازل چیدمان"
 *
 * Shows AI-recommended items that are NOT available in Huma's store.
 * These are design completions the user should source externally.
 *
 * Display + selection only — the consultation CTA lives in
 * UnifiedConsultationCTA.tsx which aggregates both service items
 * and sourcing items into a single request.
 *
 * Golden rule: these items NEVER enter the price calculation or invoice.
 *
 * Uses CSS transitions only (no motion). All styling via CSS variables.
 * Fonts: Vazirmatn.
 */
import { useState } from 'react';
import {
  Sparkles,
  Check,
  Plus,
  Puzzle,
  ChevronDown,
  Search,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { toLocalizedDigits } from '@/utils/formatters';
import type { CompletionChecklistItem } from './types';

const FONT = 'var(--font-family-vazirmatn)';

/* ═══════════════════════════════════════════════
   Exported Component
   ═══════════════════════════════════════════════ */

interface CompletionChecklistProps {
  items: CompletionChecklistItem[];
  checkedIds: Set<number>;
  onToggleItem: (id: number) => void;
}

export function CompletionChecklist({
  items,
  checkedIds,
  onToggleItem,
}: CompletionChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!items || items.length === 0) return null;

  const selectedCount = items.filter(item => checkedIds.has(item.id)).length;

  return (
    <section
      aria-label="تکمیل پازل چیدمان"
      style={{
        fontFamily: FONT,
        marginTop: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      {/* ── Section Divider ── */}
      <div
        style={{
          width: '100%',
          height: '1px',
          background: 'var(--editorial-hairline)',
          marginBottom: 'var(--spacing-lg)',
        }}
      />

      {/* ── Section Header ── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between cursor-pointer transition-all duration-200"
        style={{
          background: 'none',
          border: 'none',
          padding: '0',
          marginBottom: isExpanded ? 'var(--spacing-xs)' : '0',
        }}
        aria-expanded={isExpanded}
        aria-controls="completion-checklist-content"
      >
        <div className="flex flex-col" style={{ gap: '4px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <Puzzle
              size={14}
              strokeWidth={1.5}
              style={{ color: 'var(--editorial-accent)', opacity: 0.8 }}
            />
            <h3
              style={{
                fontSize: 'var(--text-h4-size)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
                color: 'var(--editorial-charcoal)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              تکمیل پازل چیدمان
            </h3>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              lineHeight: 1.6,
              textAlign: 'start',
            }}
          >
            موارد پیشنهادی هوش مصنوعی — انتخاب کنید، ما مشاوره تهیه می‌دیم
          </span>
        </div>

        <div className="flex items-center" style={{ gap: '8px' }}>
          {selectedCount > 0 && (
            <span
              className="tabular-nums"
              style={{
                fontSize: '10px',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
                color: 'var(--editorial-accent)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(154,140,116,0.1)',
              }}
            >
              {toLocalizedDigits(selectedCount)}/{toLocalizedDigits(items.length)}
            </span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="transition-transform duration-300"
            style={{
              color: 'var(--editorial-taupe)',
              opacity: 0.5,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* ── Content ── */}
      <div
        id="completion-checklist-content"
        style={{
          height: isExpanded ? 'auto' : 0,
          overflow: 'hidden',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Info note */}
        <div
          className="flex items-start"
          style={{
            gap: '10px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(154,140,116,0.05)',
            border: '1px solid rgba(154,140,116,0.12)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <Sparkles
            size={14}
            strokeWidth={1.5}
            style={{
              color: 'var(--editorial-accent)',
              marginTop: '2px',
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            این موارد در تصویر طراحی شما دیده می‌شن اما در انبار هُما موجود نیستن.
            موارد مورد نظرتون رو انتخاب کنید تا تیم ما برای تهیه‌شون مشاوره بده.
          </p>
        </div>

        {/* ── List Items ── */}
        <div className="flex flex-col" style={{ gap: '0' }}>
          {items.map((item, idx) => {
            const isSelected = checkedIds.has(item.id);

            return (
              <div
                key={item.id}
                className="flex items-start transition-all duration-200"
                style={{
                  padding: '14px 0',
                  borderBottom:
                    idx < items.length - 1
                      ? '1px solid var(--editorial-hairline)'
                      : 'none',
                  gap: 'var(--spacing-sm)',
                }}
              >
                {/* Circular image crop */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected
                      ? '2px solid var(--editorial-accent)'
                      : '1px solid var(--editorial-hairline)',
                    background: 'var(--editorial-product-bg)',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div
                  className="flex flex-col"
                  style={{ flex: 1, minWidth: 0, gap: '6px' }}
                >
                  {/* Name */}
                  <span
                    style={{
                      fontSize: 'var(--text-caption-size)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: FONT,
                      color: 'var(--editorial-charcoal)',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.name}
                  </span>

                  {/* Category badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      fontSize: '9px',
                      fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT,
                      color: 'var(--editorial-accent)',
                      padding: '1px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(154,140,116,0.2)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.category}
                  </span>

                  {/* AI Reasoning */}
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT,
                      color: 'var(--editorial-taupe)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {item.aiReasoning}
                  </p>

                  {/* Selection toggle + Search */}
                  <div className="flex items-center" style={{ gap: '8px', marginTop: '2px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItem(item.id);
                      }}
                      className="flex items-center gap-1.5 cursor-pointer transition-all duration-200"
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected
                          ? 'var(--editorial-charcoal)'
                          : 'var(--editorial-product-bg)',
                        border: isSelected
                          ? '1px solid var(--editorial-charcoal)'
                          : '1px solid var(--editorial-hairline)',
                        color: isSelected
                          ? '#FFFFFF'
                          : 'var(--editorial-charcoal)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontFamily: FONT,
                        letterSpacing: '0.02em',
                      }}
                      aria-label={
                        isSelected
                          ? `حذف ${item.name} از انتخاب`
                          : `انتخاب ${item.name} برای مشاوره`
                      }
                      aria-pressed={isSelected}
                    >
                      {isSelected ? (
                        <Check size={11} strokeWidth={2.5} />
                      ) : (
                        <Plus size={11} strokeWidth={2} />
                      )}
                      {isSelected ? 'انتخاب شد' : 'می‌خوام تهیه کنم'}
                    </button>

                    {/* Web search button */}
                    {item.webSearchQuery && (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(item.webSearchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 cursor-pointer transition-all duration-200"
                        style={{
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'transparent',
                          border: '1px solid var(--editorial-hairline)',
                          color: 'var(--editorial-taupe)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-regular)',
                          fontFamily: FONT,
                          textDecoration: 'none',
                          letterSpacing: '0.02em',
                        }}
                        aria-label={`جست‌وجوی ${item.name} در وب`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--editorial-accent)';
                          e.currentTarget.style.color = 'var(--editorial-charcoal)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--editorial-hairline)';
                          e.currentTarget.style.color = 'var(--editorial-taupe)';
                        }}
                      >
                        <Search size={11} strokeWidth={1.8} />
                        جست‌وجو
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
