/**
 * UnifiedConsultationCTA — Single consultation request for ALL non-purchasable items
 *
 * Aggregates two sources into ONE consultation request:
 *   1. Service items (painting, ceiling, etc.) — from enhancement/structural tiers
 *   2. Sourcing items (checklist) — AI suggestions not in Huma's inventory
 *
 * One CTA, one form sheet, one localStorage record.
 *
 * Uses CSS transitions only (no motion). All styling via CSS variables.
 * Fonts: Vazirmatn.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Phone,
  Check,
  Wallet,
  Send,
  CheckCircle,
  Puzzle,
  Wrench,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { toLocalizedDigits } from '@/utils/formatters';
import type { CategoryGroup } from './types';
import type { CompletionChecklistItem } from './types';

const FONT = 'var(--font-family-vazirmatn)';

/* ─── localStorage helper ─── */
const CONSULTATION_KEY = 'homa:consultation-requests';

interface ConsultationRequest {
  id: string;
  timestamp: string;
  name: string;
  phone: string;
  notes: string;
  serviceItems: {
    type: string;
    category: string;
    estimate: string;
  }[];
  sourcingItems: {
    name: string;
    category: string;
  }[];
}

function saveConsultationRequest(request: ConsultationRequest): void {
  try {
    const raw = localStorage.getItem(CONSULTATION_KEY);
    const existing: ConsultationRequest[] = raw ? JSON.parse(raw) : [];
    existing.unshift(request);
    localStorage.setItem(CONSULTATION_KEY, JSON.stringify(existing));
  } catch {
    /* silently fail */
  }
}

/* ═══════════════════════════════════════════════
   Exported Component
   ═══════════════════════════════════════════════ */

interface UnifiedConsultationCTAProps {
  /** Enhancement/structural service items (painting, ceiling, etc.) */
  serviceItems: CategoryGroup[];
  /** Which service items the user has accepted */
  acceptedServiceIds: Set<number>;
  /** Checklist items not available in Huma's store */
  sourcingItems: CompletionChecklistItem[];
  /** Which sourcing items the user has checked */
  checkedSourcingIds: Set<number>;
}

export function UnifiedConsultationCTA({
  serviceItems,
  acceptedServiceIds,
  sourcingItems,
  checkedSourcingIds,
}: UnifiedConsultationCTAProps) {
  const [showSheet, setShowSheet] = useState(false);

  const selectedServices = useMemo(
    () => serviceItems.filter(g => acceptedServiceIds.has(g.itemId)),
    [serviceItems, acceptedServiceIds],
  );

  const selectedSourcing = useMemo(
    () => sourcingItems.filter(item => checkedSourcingIds.has(item.id)),
    [sourcingItems, checkedSourcingIds],
  );

  const totalSelected = selectedServices.length + selectedSourcing.length;
  const hasSelected = totalSelected > 0;

  // Don't render if there are no items in either source at all
  if (serviceItems.length === 0 && sourcingItems.length === 0) return null;

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: FONT,
        marginTop: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-xl)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface)',
        border: '1px solid var(--editorial-hairline)',
        boxShadow: 'var(--elevation-sm)',
        gap: 'var(--spacing-sm)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col" style={{ gap: '4px' }}>
        <div className="flex items-center" style={{ gap: '6px' }}>
          <Phone
            size={13}
            strokeWidth={1.5}
            style={{ color: 'var(--editorial-accent)', opacity: 0.7 }}
          />
          <h3
            style={{
              fontSize: 'var(--text-h4-size)',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            درخواست مشاوره
          </h3>
        </div>
        <p
          style={{
            fontSize: 'var(--text-caption-size)',
            fontWeight: 'var(--font-weight-regular)',
            fontFamily: FONT,
            color: 'var(--editorial-taupe)',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          خدمات اجرایی و موارد تکمیلی انتخابی‌تون رو یکجا درخواست مشاوره بدید
        </p>
      </div>

      {/* Selected services summary */}
      {selectedServices.length > 0 && (
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Wrench size={9} strokeWidth={2} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
            خدمات اجرایی
          </span>
          {selectedServices.map(item => (
            <div
              key={`svc-${item.itemId}`}
              className="flex items-center justify-between"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0,49,45,0.04)',
                border: '1px solid rgba(0,49,45,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <Check size={12} strokeWidth={2.5} style={{ color: 'var(--feedback-good)' }} />
                <span
                  style={{
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontFamily: FONT,
                    color: 'var(--editorial-charcoal)',
                  }}
                >
                  {item.categoryDisplay}
                </span>
              </div>
              {item.designRationaleFa && (
                <span
                  className="flex items-center gap-1 tabular-nums"
                  style={{
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-regular)',
                    fontFamily: FONT,
                    color: 'var(--editorial-taupe)',
                  }}
                >
                  <Wallet size={9} strokeWidth={1.5} />
                  {item.designRationaleFa}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected sourcing items summary */}
      {selectedSourcing.length > 0 && (
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Puzzle size={9} strokeWidth={2} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
            موارد تکمیلی
          </span>
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {selectedSourcing.map(item => (
              <span
                key={`src-${item.id}`}
                className="inline-flex items-center gap-1"
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(154,140,116,0.06)',
                  border: '1px solid rgba(154,140,116,0.15)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  fontFamily: FONT,
                  color: 'var(--editorial-charcoal)',
                }}
              >
                <Check size={9} strokeWidth={2.5} style={{ color: 'var(--editorial-accent)' }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Single CTA Button */}
      <button
        onClick={() => setShowSheet(true)}
        disabled={!hasSelected}
        className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
        style={{
          height: 'var(--btn-dark-h-mobile)',
          borderRadius: 'var(--btn-dark-radius)',
          background: hasSelected ? 'var(--editorial-charcoal)' : 'var(--muted)',
          border: 'none',
          color: hasSelected ? 'var(--surface)' : 'var(--editorial-taupe)',
          fontSize: 'var(--text-caption-size)',
          fontWeight: 'var(--font-weight-semibold)',
          fontFamily: FONT,
          letterSpacing: '0.02em',
          opacity: hasSelected ? 1 : 0.6,
          pointerEvents: hasSelected ? 'auto' : 'none',
        }}
        aria-label="درخواست مشاوره برای موارد انتخابی"
      >
        <Phone size={14} strokeWidth={2} />
        درخواست مشاوره
        {hasSelected && (
          <span
            className="tabular-nums"
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              opacity: 0.7,
            }}
          >
            ({toLocalizedDigits(totalSelected)})
          </span>
        )}
      </button>

      {!hasSelected && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 'var(--font-weight-regular)',
            fontFamily: FONT,
            color: 'var(--editorial-taupe)',
            textAlign: 'center',
          }}
        >
          ابتدا خدمات اجرایی یا موارد تکمیلی مورد نظر خود را انتخاب کنید
        </span>
      )}

      {/* Unified Consultation Sheet */}
      <UnifiedConsultationSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        selectedServices={selectedServices}
        selectedSourcing={selectedSourcing}
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════
   Unified Consultation Sheet
   — Uses CSS transitions only (no motion)
   ═══════════════════════════════════════════════ */
function UnifiedConsultationSheet({
  isOpen,
  onClose,
  selectedServices,
  selectedSourcing,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedServices: CategoryGroup[];
  selectedSourcing: CompletionChecklistItem[];
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const totalItems = selectedServices.length + selectedSourcing.length;

  /* Reset form when sheet opens */
  useEffect(() => {
    if (isOpen) {
      setFormName(''); setFormPhone(''); setFormNotes('');
      setSubmitted(false); setSubmitting(false); setPhoneError('');
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.dispatchEvent(new CustomEvent('homa:sheet-toggle', { detail: { open: true } }));
    } else {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('homa:sheet-toggle', { detail: { open: false } }));
    }
    return () => {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('homa:sheet-toggle', { detail: { open: false } }));
    };
  }, [isOpen]);

  /* Close on Esc */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* Drag-to-dismiss */
  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY; dragging.current = true;
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) sheetRef.current.style.transform = `translateY(${delta}px)`;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return;
    dragging.current = false;
    const delta = e.changedTouches[0].clientY - dragStartY.current;
    if (delta > 120) onClose();
    sheetRef.current.style.transform = '';
  }, [onClose]);

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s-]/g, '');
    return /^(09\d{9}|\+989\d{9})$/.test(cleaned);
  };

  const handleSubmit = useCallback(() => {
    if (!formPhone.trim()) { setPhoneError('شماره تماس الزامی است'); return; }
    if (!validatePhone(formPhone)) { setPhoneError('شماره تماس معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'); return; }
    setPhoneError(''); setSubmitting(true);

    setTimeout(() => {
      const request: ConsultationRequest = {
        id: `con-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        name: formName.trim(),
        phone: formPhone.trim(),
        notes: formNotes.trim(),
        serviceItems: selectedServices.map(item => ({
          type: item.actionType || 'اقدام پیشنهادی',
          category: item.actionType || item.categoryDisplay,
          estimate: item.designRationaleFa || ''
        })),
        sourcingItems: selectedSourcing.map(item => ({
          name: item.name,
          category: item.category,
        })),
      };
      saveConsultationRequest(request);
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  }, [formName, formPhone, formNotes, selectedServices, selectedSourcing]);

  const canSubmit = formPhone.trim().length > 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '44px', padding: '0 14px',
    borderRadius: 'var(--btn-dark-radius)',
    border: '1px solid var(--editorial-hairline)',
    background: 'var(--input-background)',
    fontSize: 'var(--text-label-size)',
    fontWeight: 'var(--font-weight-regular)',
    fontFamily: FONT,
    color: 'var(--editorial-charcoal)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-caption-size)',
    fontWeight: 'var(--font-weight-semibold)',
    fontFamily: FONT,
    color: 'var(--editorial-charcoal)',
    letterSpacing: '0.02em',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.18)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-fixed flex flex-col transition-transform duration-300"
        style={{
          background: 'var(--surface)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.08)',
          fontFamily: FONT,
          transform: 'translateY(0)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="درخواست مشاوره"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 0' }}>
          <div style={{
            width: '28px', height: '3px', borderRadius: 'var(--radius-full)',
            background: 'var(--editorial-charcoal)', opacity: 0.12,
          }} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: '80vh' }}>
          {submitted ? (
            /* ── Success state ── */
            <div
              className="flex flex-col items-center transition-opacity duration-400"
              style={{
                padding: 'var(--spacing-xl) var(--spacing-lg)',
                textAlign: 'center',
                opacity: 1,
              }}
            >
              <div className="transition-transform duration-300" style={{ transform: 'scale(1)' }}>
                <CheckCircle size={56} strokeWidth={1.5} style={{ color: 'var(--feedback-good)' }} />
              </div>
              <h3 style={{
                fontSize: 'var(--text-h3-size)', fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT, color: 'var(--editorial-charcoal)',
                margin: 0, marginTop: 'var(--spacing-md)',
              }}>
                درخواست شما ثبت شد
              </h3>
              <p style={{
                fontSize: 'var(--text-label-size)', fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT, color: 'var(--editorial-taupe)',
                marginTop: 'var(--spacing-xs)', lineHeight: 1.7,
              }}>
                تیم مشاوره هُما به‌زودی با شما تماس خواهد گرفت
              </p>
              <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: 'var(--spacing-sm)' }}>
                {selectedServices.map(item => (
                  <span
                    key={`svc-${item.itemId}`}
                    className="inline-flex items-center gap-1"
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-full)',
                      background: 'var(--muted)',
                      fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT, color: 'var(--editorial-taupe)',
                    }}
                  >
                    <Wrench size={9} strokeWidth={2} />
                    {item.categoryDisplay}
                  </span>
                ))}
                {selectedSourcing.map(item => (
                  <span
                    key={`src-${item.id}`}
                    className="inline-flex items-center gap-1"
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-full)',
                      background: 'var(--muted)',
                      fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT, color: 'var(--editorial-taupe)',
                    }}
                  >
                    <Puzzle size={9} strokeWidth={2} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <div
              className="flex flex-col transition-opacity duration-300"
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg) 0',
                opacity: 1,
              }}
            >
              <h3 style={{
                fontSize: 'var(--text-h4-size)', fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT, color: 'var(--editorial-charcoal)',
                margin: 0, letterSpacing: '0.01em',
              }}>
                درخواست مشاوره
              </h3>
              <p style={{
                fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT, color: 'var(--editorial-taupe)',
                marginTop: '6px', lineHeight: 1.6,
              }}>
                اطلاعات تماس خود را وارد کنید تا تیم ما با شما تماس بگیرد
              </p>

              {/* ── Selected items grouped by type ── */}
              <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>

                {/* Services */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-col" style={{ gap: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: FONT, color: 'var(--editorial-taupe)',
                      letterSpacing: '0.06em',
                    }}>
                      خدمات اجرایی
                    </span>
                    {selectedServices.map(item => (
                      <div
                        key={`svc-${item.itemId}`}
                        className="flex items-center justify-between"
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--btn-dark-radius)',
                          background: 'var(--muted)',
                        }}
                      >
                        <span style={{
                          fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)',
                          fontFamily: FONT, color: 'var(--editorial-charcoal)',
                        }}>
                          {item.categoryDisplay}
                          <span style={{
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--editorial-taupe)',
                            marginRight: '4px',
                          }}>
                            · {item.actionType || 'اقدام پیشنهادی'}
                          </span>
                        </span>
                        {item.designRationaleFa && (
                          <span className="flex items-center gap-1" style={{
                            fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
                            fontFamily: FONT, color: 'var(--editorial-taupe)',
                          }}>
                            <Wallet size={10} strokeWidth={1.5} />
                            {item.designRationaleFa}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sourcing items */}
                {selectedSourcing.length > 0 && (
                  <div className="flex flex-col" style={{ gap: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: FONT, color: 'var(--editorial-taupe)',
                      letterSpacing: '0.06em',
                    }}>
                      موارد تکمیلی
                    </span>
                    {selectedSourcing.map(item => (
                      <div
                        key={`src-${item.id}`}
                        className="flex items-center"
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--btn-dark-radius)',
                          background: 'var(--muted)',
                          gap: '10px',
                        }}
                      >
                        <div
                          className="shrink-0 overflow-hidden"
                          style={{
                            width: '28px', height: '28px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--editorial-hairline)',
                          }}
                        >
                          <ImageWithFallback
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <span style={{
                          fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)',
                          fontFamily: FONT, color: 'var(--editorial-charcoal)',
                          flex: 1,
                        }}>
                          {item.name}
                          <span style={{
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--editorial-taupe)',
                            marginRight: '4px',
                          }}>
                            · {item.category}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="flex flex-col" style={{ gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <div className="flex flex-col" style={{ gap: '6px' }}>
                  <label htmlFor="unified-req-name" style={labelStyle}>نام شما</label>
                  <input
                    ref={nameInputRef}
                    id="unified-req-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    style={inputStyle}
                    autoComplete="name"
                  />
                </div>

                <div className="flex flex-col" style={{ gap: '6px' }}>
                  <label htmlFor="unified-req-phone" style={labelStyle}>
                    شماره تماس
                    <span style={{ color: 'var(--destructive)', marginRight: '2px' }}>*</span>
                  </label>
                  <input
                    id="unified-req-phone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={formPhone}
                    onChange={(e) => { setFormPhone(e.target.value); if (phoneError) setPhoneError(''); }}
                    placeholder="09123456789"
                    style={{
                      ...inputStyle,
                      textAlign: 'left' as const,
                      borderColor: phoneError ? 'var(--destructive)' : undefined,
                    }}
                    autoComplete="tel"
                  />
                  {phoneError && (
                    <span style={{
                      fontSize: '11px', fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT, color: 'var(--destructive)', paddingRight: '4px',
                    }}>
                      {phoneError}
                    </span>
                  )}
                </div>

                <div className="flex flex-col" style={{ gap: '6px' }}>
                  <label htmlFor="unified-req-notes" style={labelStyle}>
                    توضیحات
                    <span style={{
                      fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-taupe)',
                      marginRight: '4px', fontSize: '11px',
                    }}>(اختیاری)</span>
                  </label>
                  <textarea
                    id="unified-req-notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="مثلاً: ترجیحاً صبح‌ها تماس بگیرید..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      height: 'auto',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      resize: 'none' as const,
                      lineHeight: 1.7,
                    }}
                  />
                </div>
              </div>

              <div style={{ height: 'var(--spacing-sm)' }} />
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          paddingBottom: 'max(var(--spacing-lg), env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--editorial-hairline)',
        }}>
          {submitted ? (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center cursor-pointer"
              style={{
                height: 'var(--btn-dark-h-mobile)',
                borderRadius: 'var(--btn-dark-radius)',
                background: 'var(--editorial-charcoal)',
                border: 'none',
                color: 'var(--surface)',
                fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT, letterSpacing: '0.04em',
              }}
              aria-label="بستن"
            >
              بستن
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center cursor-pointer"
                style={{
                  background: 'transparent', border: 'none',
                  padding: '6px 0', marginBottom: '8px',
                  fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
                  fontFamily: FONT, color: 'var(--editorial-taupe)', letterSpacing: '0.03em',
                }}
                aria-label="انصراف"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  height: 'var(--btn-dark-h-mobile)',
                  borderRadius: 'var(--btn-dark-radius)',
                  background: 'var(--editorial-charcoal)',
                  border: 'none',
                  color: 'var(--surface)',
                  fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: FONT, letterSpacing: '0.04em',
                  opacity: (!canSubmit || submitting) ? 0.5 : 1,
                  pointerEvents: (!canSubmit || submitting) ? 'none' : 'auto',
                }}
                aria-label="ثبت درخواست"
              >
                {submitting ? (
                  <div
                    className="animate-spin"
                    style={{
                      width: 14, height: 14,
                      border: '2px solid transparent', borderTopColor: 'var(--surface)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                ) : (
                  <Send size={14} strokeWidth={2} />
                )}
                {submitting ? 'در حال ثبت...' : `ثبت درخواست مشاوره (${toLocalizedDigits(totalItems)})`}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
