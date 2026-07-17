/**
 * Mock data for the Room Redesign flow UI.
 *
 * Persian copy is taken verbatim from the design spec (Design-frontend/).
 * Prices are stored in Rial (Toman × 10) so they render through the shared
 * formatPriceFromRial() helper, per project price convention. Image URLs are
 * stable Unsplash links — ImageWithFallback handles any that fail to load.
 *
 * Replaced by real backend chat API responses in a later step.
 */
import type {
  AnnotationPin,
  ChatMessage,
  ChatPlan,
  Chip,
  ChipGroup,
  ImpactItem,
  RedesignProduct,
  RoomVersion,
} from '../types';

// Local sample images (served from /public) — external CDNs are unreachable
// in this environment, so we reuse the app's own bundled room photos.
const ROOM_BEFORE = '/images/studio/preset-modern-living.webp';
const ROOM_AFTER = '/images/studio/preset-warm-living.webp';

// ── Phase 1: Analysis ───────────────────────────────────────────────
export const ANALYSIS_IMAGE = ROOM_BEFORE;

export const ANALYSIS_PINS: AnnotationPin[] = [
  { id: 'p1', label: 'نور خوب', status: 'good', x: 54, y: 34 },
  { id: 'p2', label: 'نیاز به گرما', status: 'warning', x: 26, y: 52 },
  { id: 'p3', label: 'نقطه تمرکز کم', status: 'bad', x: 74, y: 46 },
];

export const ANALYSIS_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'user', text: 'عکس اتاق رو فرستادم', imageUrl: ROOM_BEFORE },
  {
    id: 'm2',
    role: 'assistant',
    text: 'عکس رو بررسی کردم. فضا روشنه، اما کمی سرد و بدون نقطه تمرکز دیده می‌شه.',
  },
];

export const ANALYSIS_CHIP_GROUPS: ChipGroup[] = [
  {
    id: 'start',
    question: 'می‌خوای از کجا شروع کنیم؟',
    chips: [
      { id: 'buy', label: 'خرید آیتم مناسب', icon: 'bag' },
      { id: 'cheap', label: 'تغییر کم‌هزینه', icon: 'brush' },
      { id: 'layout', label: 'طراحی بهتر فضا', icon: 'grid' },
      { id: 'preview', label: 'پیش‌نمایش تصویری', icon: 'image' },
    ],
  },
  {
    id: 'feeling',
    question: 'چه حسی برای فضا می‌خوای؟',
    selectedId: 'cozy',
    chips: [
      { id: 'cozy', label: 'گرم و دنج', icon: 'heart' },
      { id: 'modern', label: 'مدرن و مینیمال', icon: 'sofa' },
      { id: 'bright', label: 'روشن و سبک', icon: 'leaf' },
      { id: 'formal', label: 'رسمی‌تر', icon: 'crown' },
    ],
  },
];

// ── Phase 2: Suggestions ────────────────────────────────────────────
export const SUGGESTION_IMAGE = ROOM_BEFORE;

export const SUGGESTION_PINS: AnnotationPin[] = [
  { id: 's1', label: 'پرده سبک‌تر', status: 'neutral', x: 58, y: 34 },
  { id: 's2', label: 'کوسن گرم‌تر', status: 'neutral', x: 30, y: 50 },
  { id: 's3', label: 'فرش گرم‌تر', status: 'neutral', x: 72, y: 56 },
];

export const SUGGESTION_FILTERS: ChipGroup = {
  id: 'filters',
  question: '',
  selectedId: 'eco',
  chips: [
    { id: 'buy', label: 'خرید آیتم مناسب', icon: 'bag' },
    { id: 'cozy', label: 'گرم و دنج', icon: 'heart' },
    { id: 'eco', label: 'اقتصادی', icon: 'coins' },
  ],
};

export const SUGGESTION_SUMMARY =
  'این ۳ تغییر بیشترین تأثیر را در ایجاد فضای گرم، دلنشین و اقتصادی خواهند داشت.';

export const IMPACT_ITEMS: ImpactItem[] = [
  { id: 'i1', rank: 1, title: 'پرده سبک‌تر و روشن‌تر', impact: 5, cost: 'low' },
  { id: 'i2', rank: 2, title: 'کوسن و شال مکمل', impact: 4, cost: 'low' },
  { id: 'i3', rank: 3, title: 'فرش گرم‌تر', impact: 5, cost: 'medium' },
];

export const SUGGESTION_PRODUCTS: RedesignProduct[] = [
  {
    id: 'pr1',
    name: 'پرده حریر لینن روشن',
    subtitle: 'سفید استخوانی',
    priceRial: 23_800_000,
    imageUrl: '/images/studio/preset-bright-bedroom.webp',
  },
  {
    id: 'pr2',
    name: 'کوسن بافت بوکله',
    subtitle: 'نخودی گرم',
    priceRial: 6_800_000,
    imageUrl: '/images/comparison/bedding/after.jpg',
  },
  {
    id: 'pr3',
    name: 'فرش وینتیج مدرن',
    subtitle: 'بژ ۲۳۰×۱۶۰',
    priceRial: 42_900_000,
    imageUrl: '/images/comparison/rug/after.jpg',
  },
  {
    id: 'pr4',
    name: 'آباژور ایستاده چوبی',
    subtitle: 'گرم',
    priceRial: 21_500_000,
    imageUrl: '/images/studio/preset-dining.webp',
  },
];

// ── Phase 3: Preview & Feedback ─────────────────────────────────────
export const PREVIEW_PINS: AnnotationPin[] = [
  { id: 'v1', label: 'فضا گرم‌تر شد', status: 'good', x: 68, y: 30 },
  { id: 'v2', label: 'نقطه تمرکز بهتر', status: 'good', x: 46, y: 44 },
  { id: 'v3', label: 'رنگ‌ها هماهنگ‌تر', status: 'good', x: 74, y: 56 },
];

export const PREVIEW_MESSAGE: ChatMessage = {
  id: 'pv1',
  role: 'assistant',
  text: 'چیدمان را گرم‌تر و صمیمی‌تر کردم. نورپردازی، بافت‌ها و ترکیب رنگ‌ها بهبود یافته است. نظرت چیه؟ دوست داری چه تغییری بعدش بدیم؟',
};

export const PREVIEW_QUICK_EDITS: ChipGroup = {
  id: 'quick',
  question: 'پیشنهادهای سریع برای ویرایش بعدی',
  chips: [
    { id: 'warmer', label: 'گرم‌ترش کن', icon: 'sun' },
    { id: 'declutter', label: 'خلوت‌ترش کن', icon: 'minimize' },
    { id: 'curtain', label: 'فقط پرده', icon: 'curtain' },
    { id: 'cheaper', label: 'اقتصادی‌تر', icon: 'tag' },
    { id: 'similar', label: 'محصولات مشابه', icon: 'bag' },
  ],
};

export const PREVIEW_PRODUCTS: RedesignProduct[] = [
  {
    id: 'sp1',
    name: 'آباژور ایستاده چوبی',
    subtitle: 'گرم',
    priceRial: 39_800_000,
    imageUrl: '/images/studio/preset-dining.webp',
  },
  {
    id: 'sp2',
    name: 'پرده لینن کرم',
    subtitle: 'کرم روشن',
    priceRial: 24_500_000,
    imageUrl: '/images/studio/preset-bright-bedroom.webp',
  },
];

export const ROOM_VERSIONS: RoomVersion[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `ver${n}`,
  index: n,
  imageUrl: ROOM_AFTER,
  thumbUrl: ROOM_AFTER,
  pins: PREVIEW_PINS,
}));

export const PREVIEW_IMAGE = ROOM_AFTER;

// ── Desktop workspace (lg+) ─────────────────────────────────────────
// Richer annotation pin cards (title + description), matching the desktop
// design. Coords are % of the image box (card anchor).
export const DESKTOP_PINS: AnnotationPin[] = [
  { id: 'd1', label: 'نور طبیعی عالی', status: 'good', x: 52, y: 20, description: 'پنجره بزرگ نور خوبی به فضا میده' },
  { id: 'd2', label: 'دیوار خالی', status: 'bad', x: 26, y: 38, description: 'نیاز به یک نقطه کانونی برای جذابیت بیشتر' },
  { id: 'd3', label: 'رنگ مبل و کوسن‌ها', status: 'bad', x: 22, y: 60, description: 'کمی خنثی و سرد به نظر می‌رسه' },
  { id: 'd4', label: 'گیاه طبیعی', status: 'good', x: 72, y: 52, description: 'انتخاب عالی برای طراوت فضا' },
  { id: 'd5', label: 'فرش کوچک', status: 'bad', x: 44, y: 78, description: 'ابعاد فرش متناسب با فضا نیست' },
];

// Ordered as a left-to-right workflow (RTL: تحلیل فضا read first): analysis →
// suggestions → preview. `products` keeps its id (the tab still shows product
// recommendations); only the label reads as the workflow step "پیشنهادها".
export const DESKTOP_TABS = [
  { id: 'analysis', label: 'تحلیل فضا' },
  { id: 'products', label: 'پیشنهادها' },
  { id: 'preview', label: 'پیش‌نمایش' },
] as const;

// Static quick-edit suggestions surfaced under هما's reply once a preview exists.
// Tapping one sends it as the next follow-up turn (common redesign requests).
export const DESKTOP_QUICK_EDITS: { id: string; label: string }[] = [
  { id: 'q-light', label: 'نور را طبیعی‌تر کن' },
  { id: 'q-rug', label: 'فرش را عوض کن' },
  { id: 'q-less', label: 'اکسسوری کمتر' },
  { id: 'q-warm', label: 'چیدمان را گرم‌تر کن' },
];

export const EXIT_LABEL = 'خروج از تحلیل';
export const CHAT_INPUT_PLACEHOLDER = 'پیام خود را بنویسید...';
export const ASSISTANT_TAGLINE = 'دستیار طراحی داخلی شما';

export const DESKTOP_MESSAGES: ChatMessage[] = [
  {
    id: 'dm1',
    role: 'assistant',
    time: '۱۰:۳۰',
    text: 'عکس اتاق نشیمن شما رو تحلیل کردم. نقاط قوت و ضعف اصلی رو مشخص کردم. از کدوم قسمت می‌خوای شروع کنیم؟',
  },
  {
    id: 'dm2',
    role: 'user',
    time: '۱۰:۳۲',
    text: 'می‌خوام فضای گرم‌تر و دنج‌تری داشته باشم. بودجه‌ام متوسطه.',
  },
  {
    id: 'dm3',
    role: 'assistant',
    time: '۱۰:۳۳',
    text: 'عالی! چند پیشنهاد برات دارم که فضای گرم‌تر و دنج‌تری ایجاد کنه.',
  },
];

export const DESKTOP_PLAN: ChatPlan = {
  id: 'plan',
  title: 'پیشنهاد می‌کنم این مسیر رو بریم:',
  items: [
    { icon: 'palette', label: 'تعیین سبک مورد علاقه' },
    { icon: 'coins', label: 'انتخاب بودجه و سطح تغییر' },
    { icon: 'bag', label: 'مشاهده پیشنهادها و محصولات' },
    { icon: 'eye', label: 'پیش‌نمایش تغییرات' },
  ],
};

// ── Basket Tab (سبد) — not in any design image; editorial-consistent ─
export const BASKET_PRODUCTS: RedesignProduct[] = SUGGESTION_PRODUCTS.slice(0, 3);

export const BASKET_COPY = {
  title: 'سبد خرید',
  subtitle: 'محصولات انتخاب‌شده از بازطراحی هما',
  emptyHeadline: 'سبد خرید خالیه',
  emptyBody: 'از تب محصولات، آیتم‌هایی که می‌پسندی رو اضافه کن.',
  emptyAction: 'دیدن پیشنهادها',
  totalLabel: 'جمع کل',
  checkoutCta: 'ادامه و پرداخت',
} as const;

// ── Intake (upload + need + optional category scope) ────────────────
export const REDESIGN_SCOPE_CHIPS: Chip[] = [
  { id: 'sofa', label: 'مبل', icon: 'sofa' },
  { id: 'rug', label: 'فرش', icon: 'grid' },
  { id: 'bedspread', label: 'روتختی', icon: 'image' },
  { id: 'curtain', label: 'پرده', icon: 'curtain' },
  { id: 'cushion', label: 'کوسن', icon: 'heart' },
  { id: 'lighting', label: 'نورپردازی', icon: 'sun' },
  { id: 'decor', label: 'دکوری', icon: 'leaf' },
];

export const INTAKE_WELCOME =
  'سلام! من دستیار طراحی داخلی هما هستم. یک عکس از اتاقت بفرست تا فضا رو تحلیل کنم و پیشنهاد بدم.';
export const INTAKE_HINT = 'می‌تونی توضیح بدی چه تغییری می‌خوای (اختیاری).';
export const INTAKE_SCOPE_TITLE = 'می‌خوای روی چه چیزی تمرکز کنم؟ (اختیاری)';
export const EMPTY_PRODUCTS_HINT = 'محصولی هنوز انتخاب نشده. اول تحلیل فضا رو ببین؛ هر وقت خواستی، از هما بخواه پیشنهاد محصول بده.';
export const EMPTY_PREVIEW_HINT = 'هنوز پیش‌نمایشی ساخته نشده. گفتگو رو ادامه بده.';
