/**
 * CompletionChecklist - Shows items where matchedProducts.length === 0
 *
 * Checkbox list with item category + description.
 * Each item has a "Search Web" link (opens Google search).
 * Uses completionChecklistItems from the hook.
 *
 * i18n keys from studio.result.v2.checklist.*
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Puzzle, ChevronDown, Check, Plus, Search, Sparkles } from 'lucide-react';
import { toLocalizedDigits } from '@/utils/formatters';
import type { CategoryGroup } from './types';

interface CompletionChecklistProps {
  items: CategoryGroup[];
  checkedIds: Set<number>;
  onToggleItem: (itemId: number) => void;
}

export function CompletionChecklist({
  items,
  checkedIds,
  onToggleItem,
}: CompletionChecklistProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!items || items.length === 0) return null;

  const selectedCount = items.filter((item) => checkedIds.has(item.itemId)).length;

  return (
    <section aria-label={t('studio.result.v2.checklist.title', 'تکمیل پازل چیدمان')} className="mt-6 mb-4">
      {/* Divider */}
      <div className="w-full h-px bg-border-subtle mb-6" />

      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between cursor-pointer transition-all duration-200"
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: isExpanded ? '8px' : 0 }}
        aria-expanded={isExpanded}
        aria-controls="completion-checklist-content"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Puzzle size={14} strokeWidth={1.5} className="text-brand-primary opacity-80" />
            <h3 className="text-base font-semibold text-content-primary leading-snug m-0">
              {t('studio.result.v2.checklist.title', 'تکمیل پازل چیدمان')}
            </h3>
          </div>
          <span className="text-[11px] text-content-muted leading-relaxed text-start">
            {t('studio.result.v2.checklist.subtitle', 'موارد پیشنهادی هوش مصنوعی \u2014 انتخاب کنید، ما مشاوره تهیه می\u200Cدیم')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span
              className="tabular-nums text-[10px] font-semibold px-2 rounded-full"
              style={{ background: 'rgba(154,140,116,0.1)', color: 'var(--content-secondary)' }}
            >
              {toLocalizedDigits(selectedCount)}/{toLocalizedDigits(items.length)}
            </span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="transition-transform duration-300 text-content-muted opacity-50"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Content */}
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
          className="flex items-start gap-2.5 p-3 rounded-xl mb-4"
          style={{
            background: 'rgba(154,140,116,0.05)',
            border: '1px solid rgba(154,140,116,0.12)',
          }}
        >
          <Sparkles size={14} strokeWidth={1.5} className="text-brand-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-content-muted leading-7 m-0">
            {t('studio.result.v2.checklist.info', 'این موارد در تصویر طراحی شما دیده می\u200Cشن اما در انبار هُما موجود نیستن. موارد مورد نظرتون رو انتخاب کنید تا تیم ما برای تهیه\u200Cشون مشاوره بده.')}
          </p>
        </div>

        {/* List */}
        <div className="flex flex-col">
          {items.map((item, idx) => {
            const isSelected = checkedIds.has(item.itemId);
            const searchQuery = `${item.categoryDisplay} ${item.designStrategy || item.fitReasoningFa}`;

            return (
              <div
                key={item.itemId}
                className="flex items-start transition-all duration-200"
                style={{
                  padding: '14px 0',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  gap: 'var(--spacing-sm, 12px)',
                }}
              >
                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                  {/* Category display name */}
                  <span className="text-xs font-semibold text-content-primary leading-snug">
                    {item.categoryDisplay}
                  </span>

                  {/* Category badge */}
                  <span
                    className="inline-flex self-start text-[9px] px-2 rounded-full"
                    style={{
                      border: '1px solid rgba(154,140,116,0.2)',
                      color: 'var(--content-secondary)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.actionStatus === 'architectural'
                      ? t('studio.result.v2.checklist.architectural', 'تغییرات ساختاری')
                      : t('studio.result.v2.checklist.customOrder', 'سفارش اختصاصی')}
                  </span>

                  {/* AI reasoning */}
                  {item.fitReasoningFa && (
                    <p className="text-[11px] text-content-muted leading-7 m-0">
                      {item.fitReasoningFa}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItem(item.itemId);
                      }}
                      className="flex items-center gap-1.5 cursor-pointer transition-all duration-200"
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--content-primary)' : 'var(--surface-elevated)',
                        border: isSelected ? '1px solid var(--content-primary)' : '1px solid var(--border-subtle)',
                        color: isSelected ? '#FFFFFF' : 'var(--content-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected
                          ? t('studio.result.v2.checklist.deselect', 'حذف {{name}} از انتخاب', { name: item.categoryDisplay })
                          : t('studio.result.v2.checklist.select', 'انتخاب {{name}} برای مشاوره', { name: item.categoryDisplay })
                      }
                    >
                      {isSelected ? <Check size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2} />}
                      {isSelected
                        ? t('studio.result.v2.checklist.selected', 'انتخاب شد')
                        : t('studio.result.v2.checklist.wantIt', 'می\u200Cخوام تهیه کنم')}
                    </button>

                    {/* Web search */}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 cursor-pointer transition-all duration-200 no-underline"
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--content-muted)',
                        fontSize: '11px',
                        letterSpacing: '0.02em',
                      }}
                      aria-label={t('studio.result.v2.checklist.searchWeb', 'جست\u200Cوجوی {{name}} در وب', { name: item.categoryDisplay })}
                    >
                      <Search size={11} strokeWidth={1.8} />
                      {t('studio.result.v2.checklist.search', 'جست\u200Cوجو')}
                    </a>
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
