import type { Goal, HomaIntakePayload, RoomType } from './intakeTypes';

export type Audience = 'home' | 'host';
export type VisualRoom = 'living_room' | 'bedroom' | 'kitchen' | 'balcony';
export const ROOMS: { id: VisualRoom; label: string; hint: string; row: number }[] = [
  { id: 'living_room', label: 'پذیرایی و نشیمن', hint: 'جایی برای کنار هم بودن', row: 1 },
  { id: 'bedroom', label: 'اتاق خواب', hint: 'آرامش، نور و لایه‌های نرم', row: 0 },
  { id: 'kitchen', label: 'آشپزخانه', hint: 'کاربردی‌تر، مرتب‌تر، دلپذیرتر', row: 2 },
  { id: 'balcony', label: 'بالکن و تراس', hint: 'یک گوشهٔ دنج در هوای آزاد', row: 3 },
];
export const MOODS = [
  { id: 'quiet', name: 'مدرنِ آرام', description: 'خطوط ساده، رنگ‌های روشن و جزئیات کم', preference: 'مدرن آرام؛ رنگ‌های خنثی روشن، خطوط ساده و جزئیات کم', col: 0 },
  { id: 'natural', name: 'گرمای طبیعی', description: 'چوب، بافت‌های طبیعی و رنگ‌های خاکی', preference: 'طبیعی گرم؛ چوب، بافت طبیعی، رنگ‌های خاکی و نور ملایم', col: 1 },
  { id: 'classic', name: 'کلاسیکِ ملایم', description: 'فرم‌های آشنا با ترکیبی ظریف و متعادل', preference: 'کلاسیک ملایم؛ فرم‌های آشنا، چوب گرم و ترکیب متعادل بدون تزئینات سنگین', col: 2 },
  { id: 'urban', name: 'شهریِ گرم', description: 'چوب تیره، رنگ عمیق و جزئیات معاصر', preference: 'شهری گرم؛ چوب تیره، اکسنت رنگ عمیق و جزئیات معاصر', col: 3 },
] as const;
export const ROOM_STYLE_HINTS: Record<VisualRoom, string[]> = {
  bedroom: ['تخت روشن و فضایی خلوت', 'کتان، چوب و رنگ‌های گرم', 'تاج تخت ظریف و پارچه‌های نرم', 'تخت گرم با اکسنت عمیق'],
  living_room: ['مبل ساده و ترکیب روشن', 'بافت‌های گرم و چوب طبیعی', 'چیدمان متعادل و فرم‌های ظریف', 'مبل راحت و جزئیات تیره'],
  kitchen: ['سطوح روشن و نظم بصری', 'چوب، سفال و رنگ‌های خاکی', 'کابینت‌های قاب‌دار و جزئیات ظریف', 'ترکیب چوب و فلز تیره'],
  balcony: ['مبلمان سبک و جزئیات کم', 'گیاه، حصیر و بافت طبیعی', 'صندلی‌های ظریف و سبزینگی', 'نشیمن جمع‌وجور با جزئیات تیره'],
};
export const HOME_GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: 'warmer', label: 'گرم‌تر و هماهنگ‌تر', hint: 'رنگ و بافت در کنار هم' },
  { id: 'declutter', label: 'مرتب‌تر و کاربردی‌تر', hint: 'چیدمان بهتر با وسایل موجود' },
  { id: 'modernize', label: 'تازه‌تر و امروزی‌تر', hint: 'تغییرهایی که دیده می‌شوند' },
  { id: 'low_budget', label: 'تغییر مؤثر با هزینهٔ کمتر', hint: 'اولویت با اصلاحات ساده' },
];
export const HOST_GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: 'photo_appeal', label: 'جذاب‌تر در عکس آگهی', hint: 'نور، کادر و یک نقطهٔ شاخص' },
  { id: 'guest_comfort', label: 'راحتی بیشتر مهمان', hint: 'نشیمن، استراحت و مسیر حرکت' },
  { id: 'easy_cleaning', label: 'نظافت و نگهداری آسان‌تر', hint: 'انتخاب‌های ساده‌تر برای استفادهٔ مکرر' },
  { id: 'durable', label: 'وسایل بادوام و اقتصادی', hint: 'تعادل هزینه و استفادهٔ روزمره' },
];
export interface OnboardingChoices {
  audience: Audience; room: RoomType; goals: Goal[]; mood: string | null;
  budgetMode: 'unknown' | 'none' | 'limit'; budget: string; preserved: string; scope: 'refresh' | 'open';
}
export function budgetAmount(value: string): number | null {
  const normalized = value.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[,،٬\s]/g, '');
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 10 ** 12 ? amount : null;
}
export function buildOnboardingPayload(payload: HomaIntakePayload, choices: OnboardingChoices): HomaIntakePayload {
  const mood = MOODS.find(item => item.id === choices.mood);
  const goalOptions = choices.audience === 'host' ? HOST_GOALS : HOME_GOALS;
  const goals = choices.goals.filter(goal => goalOptions.some(option => option.id === goal));
  const explicitGoals = goalOptions.filter(goal => goals.includes(goal.id)).map(goal => goal.label);
  if (choices.audience === 'host') explicitGoals.unshift('فضا برای میزبانی اقامت کوتاه‌مدت استفاده می‌شود');
  if (choices.scope === 'refresh') explicitGoals.push('تازه‌سازی با حفظ مبلمان اصلی و بدون تغییرات ساختمانی');
  return { ...payload, roomType: choices.room, goals, prefsUpdate: {
    ...(choices.room !== 'not_sure' ? { room_type: choices.room } : {}),
    goals: explicitGoals,
    preserved_items: choices.preserved.split(/[,،\n]/).map(value => value.trim()).filter(Boolean).slice(0, 20).map(value => value.slice(0, 80)),
    ...(mood ? { style: [mood.preference] } : {}),
    budget_ceiling: choices.budgetMode === 'none' ? 0 : choices.budgetMode === 'limit' ? budgetAmount(choices.budget) : null,
  } };
}
export function initialChoices(search: string, host = false): OnboardingChoices {
  const params = new URLSearchParams(search);
  const room = ROOMS.find(item => item.id === params.get('room'))?.id || 'not_sure';
  return { audience: host ? 'host' : 'home', room, goals: [], mood: null,
    budgetMode: 'unknown', budget: '', preserved: '', scope: 'open' };
}
