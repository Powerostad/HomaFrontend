/**
 * Persian copy for the intake flow — single source of truth.
 *
 * The Room Redesign flow uses inlined Persian constants (see data/mockData.ts)
 * rather than i18n keys; this module follows that local convention so all
 * intake strings live in one typed object.
 */
export const INTAKE_COPY = {
  brand: 'هما',

  // Accessible labels (icon-only buttons / image alt) — kept here so all
  // visible AND assistive-tech text lives in one place.
  a11y: {
    pickPhoto: 'انتخاب عکس از دوربین یا گالری',
    back: 'بازگشت',
    photoAlt: 'تصویر فضا',
  },

  // ── Screen 1: Photo intake ──────────────────────────────────────────
  photo: {
    title: 'از فضات یه عکس بگیر',
    subtitle: 'هما با همین عکس، فضا رو تحلیل می‌کنه و پیشنهاد تغییر می‌ده.',
    primaryCta: 'عکس بگیر یا انتخاب کن',
    secondaryCta: 'راهنمای عکس خوب',
    tips: ['نور طبیعی بهتره', 'از گوشه اتاق عکس بگیر', 'کل فضا داخل کادر باشه'],
  },

  // ── Photo guidance bottom sheet ─────────────────────────────────────
  tips: {
    title: 'چطور عکس بهتری بگیری؟',
    items: [
      '۱. از گوشه اتاق عکس بگیر تا عمق فضا مشخص باشه.',
      '۲. تا جای ممکن کل اتاق یا بخش اصلی فضا داخل کادر باشه.',
      '۳. عکس رو در نور روز یا با نور کافی بگیر.',
      '۴. دوربین رو خیلی نزدیک به وسایل نگیر.',
      '۵. عکس تار، خیلی تاریک یا بیش از حد زوم‌شده نباشه.',
    ],
    examplesTitle: 'نمونه‌ها',
    goodExample: 'خوب: عکس باز از گوشه اتاق',
    badExampleClose: 'بد: عکس نزدیک از یک وسیله',
    badExampleDark: 'بد: عکس تاریک یا تار',
    dismiss: 'متوجه شدم',
  },

  // ── Screen 2: Photo review + optional context ───────────────────────
  review: {
    title: 'تحلیل فضا',
    photoLabel: 'عکس فضا',
    changePhoto: 'تغییر عکس',
    roomTypeLabel: 'این فضا کجاست؟',
    roomTypeHelper: 'اگه مطمئن نیستی، گزینه «مطمئن نیستم» رو بزن.',
    goalsLabel: 'دوست داری نتیجه بیشتر روی چی تمرکز کنه؟',
    goalsHelper: 'اختیاریه. می‌تونی چندتا انتخاب کنی.',
    noteLabel: 'چیزی هست که دوست داری درباره این فضا بگی؟',
    notePlaceholder: 'مثلاً: می‌خوام گرم‌تر بشه، پرده رو دوست ندارم، بودجه‌م محدوده...',
    noteHelper: 'اختیاریه. اگه چیزی ننویسی، هما خودش از روی عکس شروع می‌کنه.',
    submitCta: 'تحلیل فضا رو شروع کن',
  },

  // ── Screen 3: Analysis loading ──────────────────────────────────────
  // The live status text comes from the backend `stage` events; this is only the
  // neutral fallback shown before the first stage arrives (session creation).
  loading: {
    preparing: 'در حال آماده‌سازی تحلیل…',
  },

  // ── Bad photo warning ───────────────────────────────────────────────
  badPhoto: {
    title: 'این عکس برای تحلیل دقیق مناسب نیست',
    body: 'بهتره عکس واضح‌تر، روشن‌تر و از زاویه بازتر بگیری تا پیشنهادها دقیق‌تر بشن.',
    retry: 'عکس جدید بگیر',
    continueAnyway: 'با همین عکس ادامه بده',
  },

  // ── Errors ──────────────────────────────────────────────────────────
  errors: {
    loadImage: 'خطا در بارگذاری تصویر',
    invalidPhoto: 'این فایل یک تصویر معتبر نیست. لطفاً عکس دیگه‌ای انتخاب کن.',
    noPhoto: 'لطفاً ابتدا عکس فضا رو انتخاب کن',
    uploadFailedTitle: 'آپلود عکس انجام نشد',
    uploadFailedBody: 'اتصال اینترنت یا حجم عکس رو بررسی کن و دوباره تلاش کن.',
    uploadRetry: 'تلاش دوباره',
    analysisFailedTitle: 'تحلیل فضا انجام نشد',
    analysisFailedBody: 'مشکلی پیش اومد. دوباره امتحان کن.',
    analysisRetry: 'شروع دوباره تحلیل',
  },
} as const;
