# 📋 HOMA Platform - Development Guidelines

راهنمای جامع توسعه و استایل‌گذاری پلتفرم HOMA

---

## 🎨 Style System

### رنگ‌های اصلی سیستم (از globals.css)

```css
/* HOMA Brand Colors */
--accent: #E31E24;                    /* قرمز اصلی HOMA */
--accent-foreground: #ffffff;         /* متن روی accent */
--accent-light: #F5E6D3;              /* بژ/کرم ثانویه */
--accent-light-foreground: #1a1a1a;   /* متن روی accent-light */

/* System Colors */
--background: rgba(242, 242, 247, 1.00);     /* پس‌زمینه اصلی */
--foreground: rgba(0, 0, 0, 1.00);           /* متن اصلی */
--card: rgba(255, 255, 255, 1.00);           /* پس‌زمینه کارت */
--card-foreground: rgba(0, 0, 0, 1.00);      /* متن روی کارت */
--primary: rgba(0, 136, 255, 1.00);          /* آبی اصلی */
--primary-foreground: rgba(255, 255, 255, 1.00);
--secondary: rgba(120, 120, 128, 0.16);      /* خاکستری ثانویه */
--secondary-foreground: rgba(0, 0, 0, 1.00);
--muted: rgba(118, 118, 128, 0.12);          /* رنگ کم‌رنگ */
--muted-foreground: rgba(60, 60, 67, 0.60);
--destructive: rgba(255, 56, 60, 1.00);      /* قرمز خطر */
--destructive-foreground: rgba(255, 255, 255, 1.00);
--border: rgba(230, 230, 230, 1.00);         /* رنگ حاشیه */
--input-background: rgba(255, 255, 255, 1.00);
--ring: rgba(0, 136, 255, 1.00);             /* رنگ focus */

/* Feedback Colors */
--feedback-good: #00312D;
--feedback-neutral: #FC6F20;
--feedback-bad: #5D0D02;
--feedback-bg: #FEE8D0;

/* Custom Colors */
--old-flax: #dff370;
--jet-black: #292b2d;
```

### استفاده در کامپوننت‌ها

```tsx
// ✅ درست - استفاده از Tailwind classes با HOMA colors
<button className="bg-accent text-accent-foreground px-6 py-3 rounded-lg">
  دکمه اصلی (قرمز)
</button>

<div className="bg-accent-light text-accent-light-foreground p-4 rounded-lg">
  محتوا (بژ/کرم)
</div>

// ✅ درست - استفاده از CSS variables
<button style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
  دکمه با CSS Variable
</button>

// ❌ اشتباه - رنگ‌های دستی hard-coded
<button className="bg-red-500">دکمه</button>
<button style={{ backgroundColor: '#E31E24' }}>دکمه</button>
```

---

## 📝 Typography

### فونت‌های سیستم (از globals.css)

```css
/* فونت اصلی - Vazirmatn (فارسی/انگلیسی) */
--font-family-vazirmatn: 'Vazirmatn', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

/* فونت سیستمی SF Pro (Apple) */
--font-family-sf-pro: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
```

### سایزها و وزن‌ها (از CSS Variables)

```css
/* Typography Sizes */
--text-h1-size: 34px;
--text-h2-size: 22px;
--text-h3-size: 20px;
--text-h4-size: 17px;
--text-p-size: 17px;
--text-label-size: 15px;
--text-caption-size: 12px;

/* Font Weights */
--font-weight-bold: 700;
--font-weight-semibold: 600;
--font-weight-regular: 400;
```

### استفاده در کامپوننت‌ها

```tsx
// ✅ درست - استفاده از تگ‌های HTML (CSS Variables خودکار اعمال می‌شود)
<h1>عنوان اصلی</h1>          // 34px, weight: 700
<h2>عنوان دوم</h2>            // 22px, weight: 700
<h3>عنوان سوم</h3>            // 20px, weight: 600
<h4>عنوان چهارم</h4>          // 17px, weight: 600
<p>پاراگراف</p>               // 17px, weight: 400
<label>برچسب</label>          // 15px, weight: 400
<div className="caption">متن کوچک</div>  // 12px

// ❌ اشتباه - استفاده از Tailwind font classes (CSS Variables را override می‌کند)
<h1 className="text-2xl font-bold">عنوان</h1>
<p className="text-base">متن</p>

// ✅ استثنا - فقط برای تغییرات خاص و موردی
<p className="text-lg font-semibold">متن با استایل خاص</p>
```

**قانون مهم:** از Tailwind font classes استفاده نکنید مگر برای تغییرات خاص. همیشه بگذارید typography از CSS Variables اعمال شود.

---

## 🧩 Component Classes

### دکمه‌ها

```tsx
// Primary Button
<button className="btn-primary px-6 py-3 rounded-lg">
  ذخیره
</button>

// Secondary Button
<button className="btn-secondary px-6 py-3 rounded-lg">
  انصراف
</button>

// با افکت hover
<button className="btn-primary hover-lift">
  دکمه با انیمیشن
</button>
```

### کارت‌ها

```tsx
// Interactive Card
<div className="card-interactive">
  محتوای کارت
</div>

// Simple Card
<div className="bg-card border border-border rounded-lg p-6">
  کارت ساده
</div>
```

### Input‌ها

```tsx
// Primary Input
<input 
  type="text"
  className="input-primary" 
  placeholder="متن خود را وارد کنید"
/>

// با label
<div className="space-y-2">
  <label htmlFor="name" className="block text-sm">نام</label>
  <input id="name" className="input-primary" />
</div>
```

### Badge‌ها

```tsx
<span className="badge-accent">جدید</span>
<span className="badge-success">موفق</span>
<span className="badge-warning">در انتظار</span>
```

### Progress Bar

```tsx
<div className="progress-bar">
  <div 
    className="progress-fill" 
    style={{ width: '60%' }} 
  />
</div>
```

---

## ✨ Animations & Transitions

### Transitions

```tsx
// ✅ درست - Tailwind built-in
<div className="transition-all duration-300">
  محتوا
</div>

// سایر گزینه‌ها
<div className="transition-all duration-150">     // سریع
<div className="transition-all duration-500">     // کند
<div className="transition-transform duration-300"> // فقط transform
<div className="transition-opacity duration-300">  // فقط opacity

// ❌ اشتباه - کلاس‌های قدیمی
<div className="transition-smooth">  // این دیگه کار نمی‌کنه
```

### Entrance Animations

```tsx
// Fade in
<div className="animate-fade-in">
  محتوا از پایین ظاهر می‌شه
</div>

// Pulse (برای loading)
<div className="animate-pulse-soft">
  در حال بارگذاری...
</div>
```

### Hover Effects

```tsx
<div className="hover-lift">
  بلند می‌شه در hover
</div>

<img className="hover-scale" />
// یا از Tailwind:
<img className="hover:scale-105 transition-transform duration-300" />
```

---

## 🎯 Border Radius System

### Border Radius Variables (از globals.css)

```css
--radius: 26px;              /* پیش‌فرض */
--radius-button: 100px;      /* دکمه‌ها (pill) */
--radius-card: 20px;         /* کارت‌ها */
--radius-full: 9999px;       /* کاملاً گرد */
```

### استفاده در Tailwind

```tsx
// استفاده از radius classes که به CSS Variables متصل هستند
<div className="rounded-lg">    // var(--radius)
<div className="rounded-md">    // var(--radius-card)
<button className="rounded-full"> // var(--radius-button)
```

---

## 📏 Spacing System

### 8-Point Spacing System (از globals.css)

```css
--spacing-xs: 8px;
--spacing-sm: 16px;
--spacing-md: 24px;
--spacing-lg: 32px;
--spacing-xl: 48px;
--spacing-2xl: 64px;
```

### استفاده در کامپوننت‌ها

```tsx
// ✅ استفاده از Tailwind classes (که به spacing system متصل هستند)
<div className="p-4">     // 16px
<div className="m-6">     // 24px
<div className="gap-8">   // 32px

// ✅ استفاده مستقیم از CSS Variables
<div style={{ padding: 'var(--spacing-md)' }}>
  محتوا
</div>
```

---

## 🌓 Dark Mode Support

### Dark Mode Variables

```tsx
// Dark mode به صورت خودکار از CSS Variables استفاده می‌کند
// برای فعال‌سازی dark mode، کلاس "dark" به root اضافه کنید

<html className="dark">
  {/* تمام رنگ‌ها به صورت خودکار تغییر می‌کنند */}
</html>
```

---

## 🎨 Elevation System

### Shadow Variables (از globals.css)

```css
--elevation-sm: 0px 1px 3px rgba(0, 0, 0, 0.08);
--elevation-md: 0px 4px 12px rgba(0, 0, 0, 0.10);
--elevation-lg: 0px 8px 24px rgba(0, 0, 0, 0.12);
```

### استفاده

```tsx
<div style={{ boxShadow: 'var(--elevation-md)' }}>
  کارت با سایه
</div>
```

---

## 📱 Responsive Design

### Breakpoints

```
sm:  640px   (موبایل بزرگ)
md:  768px   (تبلت)
lg:  1024px  (لپ‌تاپ)
xl:  1280px  (دسکتاپ)
2xl: 1536px  (دسکتاپ بزرگ)
```

### Mobile-First Approach

```tsx
// ✅ درست - mobile first
<div className="
  px-4 sm:px-6 md:px-8 lg:px-12
  text-sm sm:text-base md:text-lg
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
  محتوای ریسپانسیو
</div>

// ❌ اشتباه - desktop first
<div className="px-12 md:px-8 sm:px-4">
```

---

## 🌐 RTL Support

### قوانین RTL

```tsx
// ✅ درست - استفاده از start/end
<div className="text-start">       // راست در RTL
<div className="ml-auto">          // margin-left (درست)
<div className="mr-4">             // margin-right (درست)

// Flexbox
<div className="flex justify-start items-center gap-4">

// ❌ اشتباه - left/right مطلق
<div className="text-left">        // همیشه چپ (نامناسب)
<div className="float-right">      // مشکل در RTL
```

### Icons در RTL

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ✅ درست
<button>
  <ChevronRight className="w-5 h-5" />
  <span>بعدی</span>
</button>

<button>
  <span>قبلی</span>
  <ChevronLeft className="w-5 h-5" />
</button>
```

---

## ♿ Accessibility

### Keyboard Navigation

```tsx
// ✅ همیشه keyboard accessible باشید
<button 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  دکمه
</button>

// استفاده از native elements
<button> نه <div onClick={...}>
```

### Screen Readers

```tsx
// Labels برای inputs
<label htmlFor="email">ایمیل</label>
<input id="email" type="email" />

// Alt text برای images
<img src="..." alt="توضیح دقیق تصویر" />

// aria-label برای icon buttons
<button aria-label="بستن">
  <X className="w-5 h-5" />
</button>

// Screen reader only text
<span className="sr-only">متن فقط برای screen reader</span>
```

### Focus Management

```tsx
// Focus visible
<button className="focus:outline-none focus-ring">
  دکمه
</button>

// Focus trap در modals
import { Dialog } from './components/ui/dialog';

<Dialog>
  <DialogContent>
    {/* Focus به صورت خودکار trap می‌شه */}
  </DialogContent>
</Dialog>
```

---

## 🧪 Testing Guidelines

### Component Testing

```tsx
// مثال component
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card-interactive">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <button className="btn-primary">
        خرید
      </button>
    </div>
  );
}

// نکات تست:
// ✅ تست accessibility
// ✅ تست RTL
// ✅ تست responsive
// ✅ تست keyboard navigation
```

### استفاده از Test Helpers

```tsx
// در Console:
homaTest.simulateCompleteFlow()
homaTest.simulateMultipleUsers(5)
homaTest.showCurrentStats()
```

---

## 📊 Analytics & Tracking

### ثبت Events

```tsx
import { trackEvent } from '../utils/analytics';

// در component
function handleUpload() {
  trackEvent('upload_started', {
    productId: product.id,
    source: 'camera'
  });
  
  // عملیات آپلود...
  
  trackEvent('upload_completed', {
    productId: product.id,
    fileSize: file.size,
    duration: uploadTime
  });
}
```

### KPI Metrics

```tsx
// Events اصلی برای tracking:
- page_view
- product_view
- upload_started / completed / failed
- precheck_pass / fail
- visualization_view
- purchase_click
- share_click
- feedback_submitted
- retry_attempt
```

---

## 🔧 Performance Best Practices

### Images

```tsx
// ✅ استفاده از ImageWithFallback
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback 
  src={imageUrl}
  alt="توضیح"
  className="w-full h-auto"
  loading="lazy"
/>

// ❌ استفاده مستقیم از img
<img src={imageUrl} />
```

### Lazy Loading

```tsx
// Dynamic imports برای components سنگین
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

<Suspense fallback={<div>در حال بارگذاری...</div>}>
  <AdminDashboard />
</Suspense>
```

### Memoization

```tsx
// استفاده از useMemo برای محاسبات سنگین
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// استفاده از useCallback برای functions
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

---

## 🗂️ File Organization

### Component Structure

```tsx
// MyComponent.tsx

import React, { useState } from 'react';
import { Button } from './ui/button';
import { trackEvent } from '../utils/analytics';

interface MyComponentProps {
  title: string;
  onComplete: () => void;
}

export function MyComponent({ title, onComplete }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  const handleAction = () => {
    trackEvent('action_performed');
    onComplete();
  };
  
  return (
    <div className="card-interactive">
      <h2>{title}</h2>
      <Button onClick={handleAction} className="btn-primary">
        انجام
      </Button>
    </div>
  );
}
```

### Import Order

```tsx
// 1. React و libraries خارجی
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

// 2. UI Components
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

// 3. Custom Components
import { ProductCard } from './components/ProductCard';

// 4. Utils و helpers
import { trackEvent } from './utils/analytics';
import { formatPrice } from './utils/helpers';

// 5. Types
import type { Product } from './types/product';

// 6. Styles (فقط اگه نیاز باشه)
import './custom-styles.css';
```

---

## 🚫 Common Mistakes

### ❌ استفاده از Classes اشتباه

```tsx
// ❌ اشتباه
<div className="transition-smooth">
<div className="transition-fast">
<h1 className="text-2xl font-bold">

// ✅ درست
<div className="transition-all duration-300">
<div className="transition-all duration-150">
<h1>عنوان</h1>
```

### ❌ رنگ‌های دستی

```tsx
// ❌ اشتباه
<button style={{ backgroundColor: '#E31E24' }}>
<div className="bg-red-500">

// ✅ درست
<button className="bg-accent">
<div className="bg-accent">
```

### ❌ نادیده گرفتن RTL

```tsx
// ❌ اشتباه
<div className="text-left ml-4">

// ✅ درست
<div className="text-start mr-4">
```

### ❌ فراموش کردن Accessibility

```tsx
// ❌ اشتباه
<div onClick={handleClick}>کلیک کنید</div>
<img src="..." />
<button><X /></button>

// ✅ درست
<button onClick={handleClick}>کلیک کنید</button>
<img src="..." alt="توضیح" />
<button aria-label="بستن"><X /></button>
```

---

## ✅ Checklist قبل از Commit

### UI/UX
- [ ] رنگ‌های برند HOMA استفاده شده
- [ ] Typography صحیح (بدون text-* classes اضافی)
- [ ] Responsive در همه breakpoints
- [ ] RTL صحیح کار می‌کنه
- [ ] Animations ملایم و مناسب

### Accessibility
- [ ] Keyboard navigation کار می‌کنه
- [ ] Screen reader friendly
- [ ] Focus states واضح هستند
- [ ] Alt text برای images

### Performance
- [ ] Images lazy load می‌شن
- [ ] بدون کد غیرضروری
- [ ] Memoization در جای مناسب

### Code Quality
- [ ] TypeScript errors نداره
- [ ] Console warnings نداره
- [ ] Import order صحیح
- [ ] Components قابل استفاده مجدد

### Analytics
- [ ] Events مهم track می‌شن
- [ ] KPIs ثبت می‌شن

---

## 📚 منابع

- **README.md**: راهنمای اصلی پروژه
- **SETUP.md**: راهنمای راه‌اندازی
- **styles/globals.css**: تمام CSS variables و classes
- **Admin Dashboard**: `Shift + Ctrl + K`
- **Brand Colors**: `Shift + Ctrl + B`

---

## 🤝 Contributing

برای اضافه کردن features جدید:

1. از style guide پیروی کنید
2. RTL و accessibility را فراموش نکنید
3. Analytics events اضافه کنید
4. Document کنید
5. Test کنید

---

**این Guidelines رو همیشه رعایت کنید تا کد consistent و maintainable بمونه!** ✨