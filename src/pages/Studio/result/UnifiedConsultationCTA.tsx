/**
 * UnifiedConsultationCTA - Form for consultation request
 *
 * Shows which service items (custom_order/architectural) need consultation.
 * Form: full name, phone (LTR), message (optional).
 * Submits via submitConsultationRequest() from studioService.
 * Loading, success, error states.
 * Uses react-hook-form + Zod for validation.
 *
 * i18n keys from studio.result.v2.consultation.*
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Phone,
  Send,
  CheckCircle,
  Wrench,
  Puzzle,
  Wallet,
  Check,
} from 'lucide-react';
import { toLocalizedDigits } from '@/utils/formatters';
import { submitConsultationRequest } from '@/services/studioService';
import type { CategoryGroup } from './types';

interface UnifiedConsultationCTAProps {
  /** Enhancement/structural service items (painting, ceiling, etc.) */
  serviceItems: CategoryGroup[];
  /** Which service items the user has accepted */
  acceptedServiceIds: Set<number>;
  /** Checklist items not available in store */
  checklistItems: CategoryGroup[];
  /** Which checklist items the user has checked */
  checkedChecklistIds: Set<number>;
  /** Session ID for submitting the request */
  sessionId?: string;
}

const consultationSchema = z.object({
  fullName: z.string().min(1, 'نام الزامی است'),
  phone: z
    .string()
    .min(1, 'شماره تماس الزامی است')
    .regex(/^(09\d{9}|\+989\d{9})$/, 'شماره تماس معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'),
  message: z.string().optional(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

export function UnifiedConsultationCTA({
  serviceItems,
  acceptedServiceIds,
  checklistItems,
  checkedChecklistIds,
  sessionId,
}: UnifiedConsultationCTAProps) {
  const { t } = useTranslation();
  const [showSheet, setShowSheet] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedServices = useMemo(
    () => serviceItems.filter((g) => acceptedServiceIds.has(g.itemId)),
    [serviceItems, acceptedServiceIds],
  );

  const selectedChecklist = useMemo(
    () => checklistItems.filter((item) => checkedChecklistIds.has(item.itemId)),
    [checklistItems, checkedChecklistIds],
  );

  const totalSelected = selectedServices.length + selectedChecklist.length;
  const hasSelected = totalSelected > 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: { fullName: '', phone: '', message: '' },
  });

  // Reset form when sheet opens
  useEffect(() => {
    if (showSheet) {
      reset();
      setSubmitted(false);
      setSubmitting(false);
      setSubmitError(null);
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [showSheet, reset]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (showSheet) {
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
  }, [showSheet]);

  // Escape key to close
  useEffect(() => {
    if (!showSheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSheet]);

  // Drag to dismiss
  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
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
    if (delta > 120) setShowSheet(false);
    sheetRef.current.style.transform = '';
  }, []);

  const onSubmit = async (data: ConsultationForm) => {
    if (!sessionId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitConsultationRequest(sessionId, {
        fullName: data.fullName,
        phone: data.phone.replace(/[\s\-]/g, ''),
        message: data.message || '',
        selectedItemIds: [
          ...selectedServices.map((s) => s.itemId),
          ...selectedChecklist.map((c) => c.itemId),
        ],
      });
      setSubmitted(true);
    } catch {
      setSubmitError(t('studio.result.v2.consultation.error', 'خطا در ثبت درخواست. لطفا دوباره تلاش کنید.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if no items at all
  if (serviceItems.length === 0 && checklistItems.length === 0) return null;

  const inputClasses =
    'w-full h-11 px-3.5 rounded-lg border border-border-subtle bg-surface-default text-sm text-content-primary outline-none transition-colors duration-200 focus:border-brand-primary';

  return (
    <div
      className="flex flex-col gap-3 mt-3 mb-8 p-4 rounded-xl bg-surface-default"
      style={{
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-sm)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Phone size={13} strokeWidth={1.5} className="text-brand-primary opacity-70" />
          <h3 className="text-base font-semibold text-content-primary leading-snug m-0">
            {t('studio.result.v2.consultation.title', 'درخواست مشاوره')}
          </h3>
        </div>
        <p className="text-xs text-content-muted leading-7 m-0">
          {t('studio.result.v2.consultation.subtitle', 'خدمات اجرایی و موارد تکمیلی انتخابی\u200Cتون رو یکجا درخواست مشاوره بدید')}
        </p>
      </div>

      {/* Selected services */}
      {selectedServices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">
            <Wrench size={9} strokeWidth={2} className="inline mr-1 align-middle" />
            {t('studio.result.v2.consultation.services', 'خدمات اجرایی')}
          </span>
          {selectedServices.map((item) => (
            <div
              key={`svc-${item.itemId}`}
              className="flex items-center justify-between px-3 py-2 rounded-full"
              style={{ background: 'rgba(0,49,45,0.04)', border: '1px solid rgba(0,49,45,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <Check size={12} strokeWidth={2.5} style={{ color: 'var(--color-feedback-good)' }} />
                <span className="text-xs font-semibold text-content-primary">{item.categoryDisplay}</span>
              </div>
              {item.actionEstimate && (
                <span className="flex items-center gap-1 tabular-nums text-[11px] text-content-muted">
                  <Wallet size={9} strokeWidth={1.5} />
                  ~ {toLocalizedDigits(item.actionEstimate)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected checklist items */}
      {selectedChecklist.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">
            <Puzzle size={9} strokeWidth={2} className="inline mr-1 align-middle" />
            {t('studio.result.v2.consultation.completionItems', 'موارد تکمیلی')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedChecklist.map((item) => (
              <span
                key={`src-${item.itemId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-content-primary"
                style={{ background: 'rgba(154,140,116,0.06)', border: '1px solid rgba(154,140,116,0.15)' }}
              >
                <Check size={9} strokeWidth={2.5} className="text-content-secondary" />
                {item.categoryDisplay}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={() => setShowSheet(true)}
        disabled={!hasSelected}
        className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
        style={{
          height: 'var(--btn-dark-h-mobile, 48px)',
          borderRadius: 'var(--radius-lg, 8px)',
          background: hasSelected ? 'var(--content-primary)' : 'var(--surface-elevated)',
          border: 'none',
          color: hasSelected ? 'var(--surface-page)' : 'var(--content-muted)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          opacity: hasSelected ? 1 : 0.6,
          pointerEvents: hasSelected ? 'auto' : 'none',
        }}
        aria-label={t('studio.result.v2.consultation.requestBtn', 'درخواست مشاوره برای موارد انتخابی')}
      >
        <Phone size={14} strokeWidth={2} />
        {t('studio.result.v2.consultation.request', 'درخواست مشاوره')}
        {hasSelected && (
          <span className="tabular-nums text-[11px] opacity-70">({toLocalizedDigits(totalSelected)})</span>
        )}
      </button>

      {!hasSelected && (
        <span className="text-[11px] text-content-muted text-center">
          {t('studio.result.v2.consultation.selectFirst', 'ابتدا خدمات اجرایی یا موارد تکمیلی مورد نظر خود را انتخاب کنید')}
        </span>
      )}

      {/* Bottom sheet form */}
      {showSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-modal transition-opacity duration-300"
            style={{ background: 'rgba(0,0,0,0.18)' }}
            onClick={() => setShowSheet(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-modal flex flex-col transition-transform duration-300"
            style={{
              background: 'var(--surface-default)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.08)',
              transform: 'translateY(0)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('studio.result.v2.consultation.title', 'درخواست مشاوره')}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5">
              <div className="w-7 h-[3px] rounded-full bg-content-primary opacity-10" />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: '80vh' }}>
              {submitted ? (
                /* Success state */
                <div className="flex flex-col items-center text-center px-6 py-10 transition-opacity duration-400">
                  <CheckCircle size={56} strokeWidth={1.5} style={{ color: 'var(--color-feedback-good)' }} />
                  <h3 className="text-xl font-semibold text-content-primary mt-4 m-0">
                    {t('studio.result.v2.consultation.success', 'درخواست شما ثبت شد')}
                  </h3>
                  <p className="text-sm text-content-muted mt-2 leading-7">
                    {t('studio.result.v2.consultation.successDetail', 'تیم مشاوره هُما به\u200Cزودی با شما تماس خواهد گرفت')}
                  </p>
                </div>
              ) : (
                /* Form state */
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col px-6 pt-4"
                >
                  <h3 className="text-base font-semibold text-content-primary m-0">
                    {t('studio.result.v2.consultation.title', 'درخواست مشاوره')}
                  </h3>
                  <p className="text-xs text-content-muted mt-1.5 leading-relaxed">
                    {t('studio.result.v2.consultation.formDescription', 'اطلاعات تماس خود را وارد کنید تا تیم ما با شما تماس بگیرد')}
                  </p>

                  {/* Form fields */}
                  <div className="flex flex-col gap-3 mt-4">
                    {/* Full name */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="consultation-name" className="text-xs font-semibold text-content-primary">
                        {t('studio.result.v2.consultation.name', 'نام شما')}
                      </label>
                      <input
                        {...register('fullName')}
                        ref={(e) => {
                          register('fullName').ref(e);
                          (nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                        }}
                        id="consultation-name"
                        type="text"
                        placeholder={t('studio.result.v2.consultation.namePlaceholder', 'مثال: علی محمدی')}
                        className={inputClasses}
                        autoComplete="name"
                      />
                      {errors.fullName && (
                        <span className="text-[11px] text-red-500 pr-1">{errors.fullName.message}</span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="consultation-phone" className="text-xs font-semibold text-content-primary">
                        {t('studio.result.v2.consultation.phone', 'شماره تماس')}
                        <span className="text-red-500 mr-0.5">*</span>
                      </label>
                      <input
                        {...register('phone')}
                        id="consultation-phone"
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        placeholder="09123456789"
                        className={inputClasses}
                        style={{ textAlign: 'left' }}
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <span className="text-[11px] text-red-500 pr-1">{errors.phone.message}</span>
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="consultation-message" className="text-xs font-semibold text-content-primary">
                        {t('studio.result.v2.consultation.message', 'توضیحات')}
                        <span className="text-content-muted mr-1 text-[11px] font-normal">
                          ({t('studio.result.v2.consultation.optional', 'اختیاری')})
                        </span>
                      </label>
                      <textarea
                        {...register('message')}
                        id="consultation-message"
                        placeholder={t('studio.result.v2.consultation.messagePlaceholder', 'مثلا: ترجیحا صبح\u200Cها تماس بگیرید...')}
                        rows={3}
                        className={`${inputClasses} h-auto py-3 resize-none leading-7`}
                      />
                    </div>
                  </div>

                  {/* Submit error */}
                  {submitError && (
                    <p className="text-[11px] text-red-500 mt-2">{submitError}</p>
                  )}

                  <div className="h-3" />
                </form>
              )}
            </div>

            {/* Sticky CTA */}
            <div
              className="px-6 pt-3 pb-6"
              style={{
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {submitted ? (
                <button
                  onClick={() => setShowSheet(false)}
                  className="w-full flex items-center justify-center cursor-pointer"
                  style={{
                    height: 'var(--btn-dark-h-mobile, 48px)',
                    borderRadius: 'var(--radius-lg, 8px)',
                    background: 'var(--content-primary)',
                    border: 'none',
                    color: 'var(--surface-page)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('studio.result.v2.consultation.close', 'بستن')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowSheet(false)}
                    className="w-full flex items-center justify-center cursor-pointer mb-2"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '6px 0',
                      fontSize: '12px',
                      color: 'var(--content-muted)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {t('common.cancel', 'انصراف')}
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      height: 'var(--btn-dark-h-mobile, 48px)',
                      borderRadius: 'var(--radius-lg, 8px)',
                      background: 'var(--content-primary)',
                      border: 'none',
                      color: 'var(--surface-page)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      opacity: submitting ? 0.5 : 1,
                      pointerEvents: submitting ? 'none' : 'auto',
                    }}
                  >
                    {submitting ? (
                      <div
                        className="animate-spin"
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid transparent',
                          borderTopColor: 'var(--surface-page)',
                          borderRadius: '50%',
                        }}
                      />
                    ) : (
                      <Send size={14} strokeWidth={2} />
                    )}
                    {submitting
                      ? t('studio.result.v2.consultation.submitting', 'در حال ثبت...')
                      : `${t('studio.result.v2.consultation.submit', 'ثبت درخواست مشاوره')} (${toLocalizedDigits(totalSelected)})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
