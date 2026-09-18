import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  FileText,
  Heart,
  HelpCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store as StoreIcon,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { formatPriceFromRial } from "@/utils/formatters";
import { apiPost } from "@/utils/apiClient";
import { ARTICLES } from "@/seo/content";
import type {
  PublicPageData,
  PublicProduct,
  PublicShop,
  PublicVariant,
} from "@/seo/types";

type PublicPageProps = { data: PublicPageData };
type ProductPageProps = PublicPageProps & {
  /** Legacy generic commerce slot. Prefer the focused slots below. */
  renderCommerce?: (product: PublicProduct) => ReactNode;
  renderBasketCommerce?: (
    product: PublicProduct,
    variantId: number | null,
  ) => ReactNode;
  renderBuyCommerce?: (product: PublicProduct) => ReactNode;
  /** False during server render; client providers enable live commerce after hydration. */
  commerceReady?: boolean;
};

const productHref = (product: PublicProduct) =>
  `/store/${encodeURIComponent(product.shop_slug)}/product/${encodeURIComponent(product.unique_link)}`;
const tryOnHref = (product: PublicProduct) =>
  `/try-on/${encodeURIComponent(product.unique_link)}/upload`;
const isSafeExternalUrl = (url?: string | null) =>
  Boolean(url && /^https:\/\//i.test(url));

function formatDimension(value?: string | null): string {
  if (!value) return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString('fa-IR') : value;
}

/** Static, browser-free homepage content for the SSR public document. */
export function SeoHome() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface-page flex flex-col" dir="rtl">
      <main className="flex-grow pt-20 md:pt-32 pb-24 px-6 max-w-5xl mx-auto w-full">
        <div className="space-y-12 text-center">
          <header className="space-y-5">
            <p className="text-[11px] tracking-[0.2em] text-black/40">
              {t('seo.home.eyebrow', 'طراحی و انتخاب با هوش مصنوعی')}
            </p>
            <h1 className="text-[38px] md:text-[56px] font-light leading-tight text-black">
              {t('seo.home.title', 'دکوراسیون خانه با هوش مصنوعی')}
            </h1>
            <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
              {t('seo.home.description', 'با عکس اتاق خود ایده‌های دکوراسیون را بررسی کنید؛ یا یک محصول را انتخاب کنید و آن را پیش از خرید در فضای خود ببینید.')}
            </p>
          </header>
          <nav aria-label={t('seo.home.routes', 'از کجا شروع می‌کنید؟')} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <a href="/ai-interior-design" className="border border-black/10 px-6 py-5 text-[14px] font-medium hover:bg-black hover:text-white transition-colors">
              {t('seo.home.redesign', 'برای اتاقم ایده می‌خواهم')}
            </a>
            <a href="/virtual-product-preview" className="border border-black/10 px-6 py-5 text-[14px] font-medium hover:bg-black hover:text-white transition-colors">
              {t('seo.home.preview', 'می‌خواهم محصولی را امتحان کنم')}
            </a>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[13px]">
            <a href="/studio/upload" className="inline-flex h-12 items-center bg-black text-white px-6">
              {t('seo.home.start', 'طراحی با عکس اتاق')}
            </a>
            <a href="/explore" className="inline-flex h-12 items-center border border-black/15 px-6">
              {t('seo.home.browse', 'مشاهده فروشگاه‌ها')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function Breadcrumbs({ data }: PublicPageProps) {
  if (!data.breadcrumbs.length) return null;
  return (
    <nav
      className="h-[40px] md:h-[44px] flex items-center justify-between px-[var(--spacing-md)] md:px-[var(--spacing-2xl)] w-full max-w-[1440px] mx-auto overflow-x-auto no-scrollbar"
      dir="rtl"
      aria-label="مسیر صفحه"
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {data.breadcrumbs.map((item, index) => {
          const isLast = index === data.breadcrumbs.length - 1;
          return (
            <span className="contents" key={`${item.path}-${index}`}>
              {item.path && !isLast ? (
                <a
                  href={item.path}
                  className="text-[11px] md:text-[length:var(--text-caption-size)] font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                >
                  {item.name}
                </a>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={`text-[11px] md:text-[length:var(--text-caption-size)] ${isLast ? "font-[number:var(--font-weight-bold)] text-[var(--foreground)]/80" : "font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30"}`}
                >
                  {item.name}
                </span>
              )}
              {!isLast && (
                <span className="text-[10px] text-[var(--foreground)]/10 mx-0.5">
                  /
                </span>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}

function CatalogPagination({ data }: PublicPageProps) {
  const totalPages = Math.ceil(data.total / 20);
  if (totalPages < 2) return null;
  const href = (page: number) => {
    const query = new URLSearchParams(data.search || "");
    if (page === 1) query.delete("page");
    else query.set("page", String(page));
    const search = query.toString();
    return `${data.path}${search ? `?${search}` : ""}`;
  };
  return (
    <nav
      className="flex items-center justify-center gap-4 mt-12 mb-8"
      aria-label="صفحه‌بندی"
    >
      {data.page > 1 && (
        <a
          rel="prev"
          href={href(data.page - 1)}
          className="h-12 px-8 inline-flex items-center border border-black/10 hover:bg-black/5 text-[12px] font-bold tracking-widest"
        >
          صفحه قبل
        </a>
      )}
      <span className="text-[12px] text-black/40">
        صفحه {data.page} از {totalPages}
      </span>
      {data.page < totalPages && (
        <a
          rel="next"
          href={href(data.page + 1)}
          className="h-12 px-8 inline-flex items-center border border-black/10 hover:bg-black/5 text-[12px] font-bold tracking-widest"
        >
          صفحه بعد
        </a>
      )}
    </nav>
  );
}

function ShopTile({ shop }: { shop: PublicShop }) {
  return (
    <a
      href={`/store/${encodeURIComponent(shop.slug)}`}
      className="flex flex-col group cursor-pointer w-full"
    >
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02]">
        {shop.logo_url ? (
          <div className="w-full h-full flex items-center justify-center p-6 bg-black/[0.02]">
            <ImageWithFallback
              src={shop.logo_url}
              alt={shop.shop_name}
              className="max-w-full max-h-full object-contain grayscale-[0.1] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/[0.03]">
            <StoreIcon size={48} className="text-black/10" strokeWidth={1} />
          </div>
        )}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <div className="px-4 py-2 bg-white/90 backdrop-blur-md border border-black/5">
            <span className="text-[9px] font-bold text-black uppercase tracking-[0.2em]">
              مشاهده گالری
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col pt-4 px-0">
        <h2
          className="text-[14px] md:text-[16px] font-medium text-black/80 tracking-tight leading-none group-hover:text-black transition-colors"
          style={{ fontFamily: "var(--font-family-vazirmatn)" }}
        >
          {shop.shop_name}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
            {shop.product_count} محصول
          </span>
          <span className="w-1 h-1 rounded-full bg-black/10" />
          <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
            @{shop.slug}
          </span>
        </div>
      </div>
    </a>
  );
}

function ProductTile({ product }: { product: PublicProduct }) {
  const image = product.image_urls?.card || product.image_url;
  return (
    <a
      href={productHref(product)}
      className="flex flex-col group cursor-pointer w-full"
      dir="rtl"
    >
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02] transition-all duration-500">
        {image ? (
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/[0.03]">
            <StoreIcon size={36} className="text-black/10" />
          </div>
        )}
        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden md:block">
          <span className="flex items-center gap-2 h-10 px-4 rounded-none bg-white/95 backdrop-blur-md border border-black/5 text-black shadow-sm">
            <Sparkles size={12} className="opacity-60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
              امتحان
            </span>
          </span>
        </div>
      </div>
      <div className="flex flex-col pt-3 px-0">
        <h2
          className="text-[13px] md:text-[15px] font-medium text-black/70 line-clamp-1 leading-tight group-hover:text-black transition-colors"
          style={{ fontFamily: "var(--font-family-vazirmatn)" }}
        >
          {product.name}
        </h2>
        <div className="flex items-center gap-1.5 mt-2 text-black/30">
          <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-tight">
            {formatPriceFromRial(product.price, false)}
          </span>
          <span className="text-[10px] md:text-[11px] font-medium opacity-60">
            تومان
          </span>
        </div>
      </div>
    </a>
  );
}

export function SeoExplorePage({ data }: PublicPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  return (
    <div className="min-h-screen bg-white font-vazirmatn pb-32" dir="rtl">
      <Breadcrumbs data={data} />
      <header className="pt-6 pb-4 px-6 md:px-16 max-w-[1440px] mx-auto w-full flex flex-col">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1
                className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none"
                style={{ fontFamily: "var(--font-family-vazirmatn)" }}
              >
                فروشگاه‌های منتخب
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-[11px] font-bold text-black/20 tracking-[0.2em] uppercase">
                  Curated by HOMA Editorial
                </span>
              </div>
            </div>
            <p className="hidden md:block max-w-xs text-[13px] text-black/40 font-medium leading-relaxed text-start">
              مجموعه‌ای دست‌چین شده از برترین برندهای دکوراسیون داخلی، متناسب با
              استانداردهای زیبایی‌شناسی هُما.
            </p>
          </div>
          <div className="h-px w-full bg-black/[0.05]" />
        </div>
      </header>
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mt-10 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory("all")}
            aria-pressed={selectedCategory === "all"}
            className="h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border bg-black text-white border-black"
            style={{ fontFamily: "var(--font-family-vazirmatn)" }}
          >
            همه
          </button>
        </div>
      </div>
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        {data.shops.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[24px] md:gap-y-[32px]">
            {data.shops.map((shop) => (
              <ShopTile key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <EmptyCatalog kind="فروشگاهی" />
        )}
        {data.shops.length > 0 && (
          <div className="mt-24 mb-12 flex flex-col items-center text-center">
            <div className="w-8 h-[1px] bg-black/5 mb-6" />
            <p className="text-[11px] font-bold text-black/15 max-w-[280px] leading-relaxed">
              این لیست بر اساس سلیقه و فضاهای انتخابی شما به صورت هوشمند گردآوری
              شده است.
            </p>
          </div>
        )}
        <CatalogPagination data={data} />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

function EmptyCatalog({ kind }: { kind: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
        <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
      </div>
      <h2 className="text-[16px] font-medium text-black/80 mb-2">
        هنوز {kind} اضافه نشده
      </h2>
      <p className="text-[13px] text-black/40 max-w-xs">
        به زودی موارد جدیدی برای نمایش اضافه می‌شوند.
      </p>
    </div>
  );
}

export function SeoStorePage({ data }: PublicPageProps) {
  const shop = data.shop;
  if (!shop)
    return (
      <div className="min-h-screen bg-[#FDFDFB]" dir="rtl">
        <Breadcrumbs data={data} />
        <EmptyCatalog kind="فروشگاهی" />
      </div>
    );
  return (
    <div
      className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col"
      dir="rtl"
    >
      <Breadcrumbs data={data} />
      <header className="pt-6 pb-3 px-6 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white border border-black/5 overflow-hidden shrink-0 shadow-sm">
                {shop.logo_url ? (
                  <ImageWithFallback
                    src={shop.logo_url}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover scale-110"
                  />
                ) : (
                  <StoreIcon
                    size={32}
                    className="text-black/20"
                    strokeWidth={1}
                  />
                )}
              </div>
              <div className="space-y-1">
                <h1
                  className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none"
                  style={{ fontFamily: "var(--font-family-vazirmatn)" }}
                >
                  {shop.shop_name}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-black/[0.03] rounded-sm flex items-center gap-1.5 border border-black/[0.05]">
                    <Star
                      size={10}
                      className="fill-black text-black opacity-30"
                    />
                    <span className="text-[10px] font-bold text-black/40">
                      @{shop.slug}
                    </span>
                  </div>
                  <span className="text-[11px] text-black/30 font-medium uppercase tracking-widest">
                    {shop.product_count} محصول
                  </span>
                </div>
              </div>
            </div>
            <p className="hidden md:block text-[13px] text-black/40 font-medium leading-relaxed max-w-xs text-start">
              مجموعه‌ای از بهترین کالاهای {shop.shop_name} که توسط تیم طراحی
              هُما برای چیدمان‌های مدرن دست‌چین شده‌اند.
            </p>
          </div>
          <div className="h-px w-full bg-black/[0.05] mt-2" />
        </div>
      </header>
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-12 flex items-center justify-between mt-6">
        <button
          className="h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border bg-black text-white border-black"
          style={{ fontFamily: "var(--font-family-vazirmatn)" }}
        >
          همه
        </button>
      </div>
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        {data.products.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[18px] md:gap-y-[20px]">
            {data.products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyCatalog kind="محصولی" />
        )}
        <CatalogPagination data={data} />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

export function SeoGalleryPage({ data }: PublicPageProps) {
  return (
    <div
      className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col"
      dir="rtl"
    >
      <Breadcrumbs data={data} />
      <header className="pt-6 pb-4 px-6 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="space-y-4">
          <h1
            className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none"
            style={{ fontFamily: "var(--font-family-vazirmatn)" }}
          >
            گالری محصولات
          </h1>
          <p className="text-[13px] text-black/40 font-medium leading-relaxed max-w-xs">
            محصولات فروشگاه‌های هُما را انتخاب کنید و در فضای خود امتحان کنید.
          </p>
          <div className="h-px w-full bg-black/[0.05]" />
        </div>
      </header>
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full py-12 pb-32">
        {data.products.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[18px] md:gap-y-[20px]">
            {data.products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyCatalog kind="محصولی" />
        )}
        <CatalogPagination data={data} />
      </main>
    </div>
  );
}

export function SeoProductDetailsPage({
  data,
  renderCommerce,
  renderBasketCommerce,
  renderBuyCommerce,
  commerceReady = false,
}: ProductPageProps) {
  const product = data.product;
  const [activeImage, setActiveImage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () =>
      product?.variants?.find((variant) => variant.is_default)?.id ??
      product?.variants?.[0]?.id ??
      null,
  );
  if (!product)
    return (
      <div className="min-h-screen bg-[#FDFDFB]" dir="rtl">
        <Breadcrumbs data={data} />
        <EmptyCatalog kind="محصولی" />
      </div>
    );
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId,
  );
  const buyCommerce = commerceReady
    ? renderBuyCommerce?.(product) ?? renderCommerce?.(product)
    : undefined;
  const images = [
    product.image_urls?.detail || product.image_url,
    product.image_urls?.original,
  ].filter((image): image is string => Boolean(image));
  const currentImage = images[activeImage] || product.image_url;
  return (
    <div
      className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col"
      dir="rtl"
    >
      <Breadcrumbs data={data} />
      <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-0 lg:px-16 pt-0 lg:pt-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16">
          <div className="lg:col-span-7 flex flex-row-reverse gap-4">
            <div className="flex-1 relative aspect-square max-h-[70vh] overflow-hidden bg-black/[0.01]">
              {currentImage ? (
                <ImageWithFallback
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <StoreIcon className="text-black/10" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="hidden lg:flex flex-col gap-2 shrink-0">
                {images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setActiveImage(index)}
                    aria-label={`تصویر ${index + 1} محصول`}
                    className={`w-20 h-20 overflow-hidden border transition-all duration-300 ${activeImage === index ? "border-black" : "border-transparent opacity-40 hover:opacity-100"}`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-5 px-6 lg:px-0 mt-8 lg:mt-0">
            <div className="flex flex-col gap-6 lg:sticky lg:top-32">
              <div className="space-y-4">
                {product.category_display && (
                  <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold uppercase tracking-widest">
                    <span>{product.category_display}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-[22px] lg:text-[24px] font-bold text-black leading-tight tracking-wide">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] lg:text-[18px] font-bold text-black">
                      {(selectedVariant?.price ?? product.price) > 0
                        ? formatPriceFromRial(selectedVariant?.price ?? product.price)
                        : "قیمت اعلام نشده"}
                    </span>
                  </div>
                </div>
              </div>
              {product.description && (
                <div className="py-6 border-t border-black/[0.05]">
                  <p className="text-[13px] text-black/60 leading-relaxed font-medium">
                    {product.description}
                  </p>
                </div>
              )}
              {product.variants?.length ? (
                <VariantPicker
                  variants={product.variants}
                  selectedId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                />
              ) : null}
              {selectedVariant && (
                <div className="border-t border-black/[0.05] pt-5 text-[13px] text-black/60">
                  {[
                    ['عرض', selectedVariant.width_cm],
                    ['طول', selectedVariant.length_cm],
                    ['ارتفاع', selectedVariant.height_cm],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="flex items-center gap-2 py-1">
                      <span dir="ltr">{label}: {formatDimension(value)} سانتی‌متر</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-8 space-y-3">
                <div className="flex flex-col gap-3">
                  <a
                    href={tryOnHref(product)}
                    className="w-full h-14 rounded-none bg-black text-white hover:bg-black/90 text-[12px] lg:text-[14px] font-bold tracking-wide lg:tracking-[0.2em] transition-all flex items-center justify-center gap-2 lg:gap-3 shadow-2xl"
                  >
                    <Sparkles size={18} className="shrink-0" />
                    <span className="truncate">
                      امتحانش کن در فضای خودت (AI Try-On)
                    </span>
                  </a>
                  <div className="flex gap-2 w-full">
                    {commerceReady && renderBasketCommerce ? (
                      renderBasketCommerce(product, selectedVariant?.id ?? null)
                    ) : (
                      <a
                        href="/basket"
                        className="flex-1 h-12 flex items-center justify-center border border-black/10 hover:bg-black/5 transition-all text-black text-[13px] font-bold tracking-widest"
                      >
                        افزودن به سبد
                      </a>
                    )}
                    <button
                      type="button"
                      className="flex-1 h-12 flex items-center justify-center border border-black/10 hover:bg-black/5 transition-all text-black/60 font-bold text-[12px] gap-2"
                    >
                      <Heart size={18} strokeWidth={1} />
                      ذخیره برای بعد
                    </button>
                  </div>
                  {buyCommerce ??
                  (isSafeExternalUrl(product.link) ? (
                    <a
                      href={product.link!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-none border border-black/10 hover:bg-black/5 text-black text-[13px] font-bold tracking-widest mt-3 flex items-center justify-center"
                    >
                      خرید از {product.shop_name}
                    </a>
                  ) : null)}
                </div>
                {product.extra_details &&
                  Object.keys(product.extra_details).length > 0 && (
                    <div className="pt-6 border-t border-black/[0.05]">
                      <button
                        type="button"
                        onClick={() => setShowDetails((value) => !value)}
                        aria-expanded={showDetails}
                        className="flex items-center justify-between w-full text-[11px] font-bold text-black/60 uppercase tracking-widest hover:text-black transition-colors"
                      >
                        <span>جزئیات محصول</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showDetails && (
                        <table className="w-full mt-4 text-[13px]">
                          <tbody>
                            {Object.entries(product.extra_details).map(
                              ([key, value]) => (
                                <tr
                                  key={key}
                                  className="border-b border-black/[0.05]"
                                >
                                  <td className="py-3 text-black/40 font-medium w-1/3">
                                    {key}
                                  </td>
                                  <td className="py-3 text-black/80 font-medium">
                                    {Array.isArray(value)
                                      ? value.join("، ")
                                      : value}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-black/[0.02] z-[120] lg:hidden">
        <a
          href={tryOnHref(product)}
          className="w-full h-12 rounded-none bg-black text-white text-[13px] font-bold active:scale-[0.98] flex items-center justify-center"
        >
          امتحانش کن در فضای خودت
        </a>
      </div>
    </div>
  );
}

function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: PublicVariant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="space-y-3 py-6 border-t border-black/[0.05]">
      <h2 className="text-[11px] font-bold text-black/60 uppercase tracking-widest">
        گزینه‌های محصول
      </h2>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            type="button"
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            aria-pressed={selectedId === variant.id}
            className={`px-3 py-1.5 rounded-full border text-[13px] ${selectedId === variant.id ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-900"}`}
          >
            {variant.label_fa}
          </button>
        ))}
      </div>
    </div>
  );
}

const faqItems = [
  [
    "هما چیست؟",
    "هما یک پلتفرم هوشمند تجسم مبلمان است که با استفاده از هوش مصنوعی به شما کمک می‌کند قبل از خرید، محصولات را در فضای واقعی خانه‌تان ببینید.",
  ],
  [
    "قابلیت تجسم (Try-On) چگونه کار می‌کند؟",
    "یک عکس از اتاق خود آپلود می‌کنید و محصول مورد نظرتان را انتخاب می‌کنید تا هما آن را در فضای شما قرار دهد.",
  ],
  [
    "چه فرمت‌هایی برای تصاویر پشتیبانی می‌شود؟",
    "هما از JPG، JPEG و PNG پشتیبانی می‌کند. برای بهترین نتیجه از تصویر روشن و باکیفیت استفاده کنید.",
  ],
  [
    "آیا عکس اتاق من ذخیره می‌شود؟",
    "تصاویر برای پردازش استفاده می‌شوند و حریم خصوصی کاربران برای هُما اهمیت دارد.",
  ],
];

function InformationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col" dir="rtl">
      <main className="flex-grow pt-20 md:pt-32 pb-24 px-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

function SeoFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <InformationFrame>
      <div className="space-y-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 opacity-60" />
          </div>
          <h1 className="text-[32px] md:text-[42px] font-bold text-black leading-tight">
            سوالات متداول
          </h1>
          <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
            پاسخ سوالات رایج درباره هما و نحوه استفاده از آن را اینجا بیابید.
          </p>
        </div>
        <div className="bg-white border border-black/[0.03] rounded-[24px] p-6 md:p-10 shadow-sm">
          {faqItems.map(([question, answer], index) => (
            <div
              key={question}
              className="border-b border-black/[0.05] last:border-b-0"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                aria-expanded={openIndex === index}
                className="w-full py-6 flex items-center justify-between text-right gap-4"
              >
                <span className="font-medium text-[16px] md:text-[18px] text-black">
                  {question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 opacity-40 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === index && (
                <p className="pb-6 text-[14px] md:text-[15px] leading-relaxed text-black/60">
                  {answer}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="text-center pt-8">
          <p className="text-[14px] opacity-50 mb-4">سوال دیگری دارید؟</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-black border-b border-black/20 pb-1 hover:border-black transition-colors"
          >
            با ما تماس بگیرید
          </a>
        </div>
      </div>
    </InformationFrame>
  );
}

function SeoTerms() {
  const sections = ARTICLES["/terms"].sections;
  return (
    <InformationFrame>
      <div className="space-y-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 opacity-60" />
          </div>
          <h1 className="text-[32px] md:text-[42px] font-bold text-black leading-tight">
            قوانین و مقررات
          </h1>
          <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
            لطفاً قبل از استفاده از خدمات هما، این قوانین را به دقت مطالعه کنید.
          </p>
          <p className="text-[13px] opacity-40">آخرین به‌روزرسانی: دی ۱۴۰۴</p>
        </div>
        <div className="bg-white border border-black/[0.03] rounded-[24px] p-6 md:p-10 shadow-sm space-y-10">
          {sections.map((section, index) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-[18px] md:text-[20px] font-bold text-black border-r-4 border-black/10 pr-4">
                {index + 1}. {section.heading}
              </h2>
              <ul className="space-y-3 pr-4">
                {section.body.split("\n\n").map((body) => (
                  <li
                    key={body}
                    className="text-[14px] md:text-[15px] leading-relaxed text-black/60 flex gap-3"
                  >
                    <span className="text-black/20 shrink-0">•</span>
                    <span>{body}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </InformationFrame>
  );
}

function SeoContact({ data }: PublicPageProps) {
  const instagram =
    data.supportUrl &&
    /^https:\/\/www\.instagram\.com\/myhoma\.ir\/?$/i.test(data.supportUrl)
      ? data.supportUrl
      : null;
  return (
    <div
      className="min-h-screen bg-[#FDFDFB] flex flex-col font-vazirmatn"
      dir="rtl"
    >
      <main className="flex-grow pt-20 md:pt-32 pb-24 px-6 max-w-5xl mx-auto w-full">
        <div className="space-y-20 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-[42px] font-bold text-black leading-tight">
              مرکز پشتیبانی و اعتماد هُما
            </h1>
            <p className="text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
              ما اینجا هستیم تا تجربه‌ی طراحی و خرید شما را به آرام‌ترین شکل
              ممکن رقم بزنیم. هُما همراه شما در خلق خانه است.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-black/[0.03] p-10 flex flex-col items-center gap-4 group rounded-[32px] shadow-sm shadow-black/[0.02]"
              >
                <div className="w-14 h-14 rounded-full bg-black/[0.02] flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-500">
                  <Phone className="w-6 h-6" />
                </div>
                <h2 className="opacity-40 text-[12px] font-bold uppercase tracking-widest">
                  اینستاگرام هُما
                </h2>
                <p className="font-bold text-[20px] tracking-tight">
                  <bdi dir="ltr">myhoma.ir</bdi>
                </p>
              </a>
            ) : (
              <div className="bg-white border border-black/[0.03] p-10 flex flex-col items-center gap-4 rounded-[32px] shadow-sm shadow-black/[0.02]">
                <div className="w-14 h-14 rounded-full bg-black/[0.02] flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <h2 className="opacity-40 text-[12px] font-bold uppercase tracking-widest">
                  ارتباط با پشتیبانی هُما
                </h2>
                <p className="text-[14px] text-black/50 leading-relaxed">
                  در حال حاضر راه ارتباط مستقیم با پشتیبانی در این صفحه معرفی نشده است. برای راهنمای استفاده، پرسش‌های متداول را ببینید.
                </p>
              </div>
            )}
            <div className="bg-white border border-black/[0.03] p-10 flex flex-col items-center gap-4 rounded-[32px] shadow-sm shadow-black/[0.02]">
              <div className="w-14 h-14 rounded-full bg-black/[0.02] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="opacity-40 text-[12px] font-bold uppercase tracking-widest">
                راهنمای استفاده
              </h2>
              <a href="/faq" className="font-bold text-[20px] tracking-tight">
                پرسش‌های متداول
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SeoCollaboration() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await apiPost(
        "/partnerships/requests/",
        {
          name: fields.get("name"),
          shop_name: fields.get("shopName"),
          phone: fields.get("phone"),
          instagram_id: fields.get("instagramId"),
          website: fields.get("website"),
          product_type: fields.get("productType"),
          description: fields.get("description"),
        },
        { skipAuth: true },
      );
      setStatus(response.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };
  if (status === "success")
    return (
      <div
        className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="text-center space-y-4">
          <h1 className="text-[42px] font-light text-[#292b2d]">
            درخواست شما ثبت شد
          </h1>
          <p className="text-[#292b2d]/60">
            به زودی با شما در تماس خواهیم بود.
          </p>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col" dir="rtl">
      <main className="flex-grow flex flex-col md:flex-row relative z-10 pt-20">
        <div className="hidden md:block md:w-1/2 md:h-screen md:sticky md:top-0">
          <div className="w-full h-full p-6 md:p-12">
            <div className="relative w-full h-full overflow-hidden rounded-[2px]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="نمایشگاه دیجیتال هُما"
                className="w-full h-full object-cover grayscale-[0.1]"
              />
              <div className="absolute inset-0 bg-black/5" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center py-12 md:py-24 px-6 md:px-20 lg:px-32">
          <div className="max-w-xl w-full">
            <div className="mb-16 space-y-6">
              <h1
                className="text-[42px] md:text-[56px] font-light text-[#292b2d] leading-[1.1] tracking-tighter"
                style={{ fontFamily: "var(--font-family-vazirmatn)" }}
              >
                محصولات شما، <br /> در خانه‌ی مشتریان ما.
              </h1>
              <p className="text-[#292b2d]/60 text-[18px] leading-relaxed max-w-md">
                با پیوستن به اکوسیستم هُما، محصولات خود را به صورت هوشمند در
                فضاهای واقعی به نمایش بگذارید.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    ["name", "نام و نام خانوادگی", "مثلاً علی علوی"],
                    ["shopName", "نام فروشگاه / برند", "مثلاً مبلمان آریا"],
                  ].map(([name, label, placeholder]) => (
                    <label key={name} className="space-y-2">
                      <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                        {label}
                      </span>
                      <input
                        required
                        name={name}
                        placeholder={placeholder}
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all placeholder:text-[#757575]"
                      />
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="space-y-2">
                    <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                      شماره تماس
                    </span>
                    <input
                      required
                      type="tel"
                      dir="ltr"
                      name="phone"
                      placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                      className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d]"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                      آیدی اینستاگرام (اختیاری)
                    </span>
                    <input
                      name="instagramId"
                      dir="ltr"
                      placeholder="@homa_platform"
                      className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d]"
                    />
                  </label>
                </div>
                <label className="space-y-2 block">
                  <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                    آدرس وب‌سایت (اختیاری)
                  </span>
                  <input
                    name="website"
                    type="url"
                    dir="ltr"
                    placeholder="www.yourbrand.com"
                    className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d]"
                  />
                </label>
                <label className="space-y-2 block">
                  <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                    نوع محصولات
                  </span>
                  <select
                    required
                    defaultValue=""
                    name="productType"
                    className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d]"
                  >
                    <option value="" disabled>
                      انتخاب نوع محصولات...
                    </option>
                    <option value="furniture">مبلمان و راحتی</option>
                    <option value="lighting">روشنایی و لوستر</option>
                    <option value="rug">فرش و کفپوش</option>
                    <option value="decor">اکسسوری و دکوراتیو</option>
                    <option value="other">سایر موارد</option>
                  </select>
                </label>
                <label className="space-y-2 block">
                  <span className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2">
                    توضیحات تکمیلی
                  </span>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="درباره برند یا کاتالوگ محصولات خود توضیح دهید..."
                    className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] resize-none"
                  />
                </label>
              </div>
              {status === "error" && (
                <p role="alert" className="text-sm text-[#5D0D02]">
                  خطا در ثبت درخواست؛ لطفاً دوباره تلاش کنید.
                </p>
              )}
              <button
                disabled={status === "sending"}
                type="submit"
                className="w-full bg-[#292b2d] text-white h-[64px] rounded-[12px] text-[16px] font-medium tracking-[0.1em] hover:bg-black transition-all disabled:opacity-50"
              >
                {status === "sending" ? "در حال ثبت..." : "شروع همکاری رایگان"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function SeoAcquisition({ data }: PublicPageProps) {
  const article = ARTICLES[data.path];
  return (
    <InformationFrame>
      <article className="space-y-12">
        <header className="text-center space-y-6">
          <p className="text-[12px] font-bold tracking-widest text-black/40">
            {article.eyebrow}
          </p>
          <h1 className="text-[32px] md:text-[42px] font-bold text-black leading-tight">
            {article.title}
          </h1>
          <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
            {article.description}
          </p>
          {article.cta && (
            <a
              href={article.cta.href}
              className="inline-flex h-12 items-center bg-black text-white px-6 text-[13px] font-bold"
            >
              {article.cta.label}
            </a>
          )}
        </header>
        <div className="bg-white border border-black/[0.03] rounded-[24px] p-6 md:p-10 shadow-sm space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-[18px] md:text-[20px] font-bold text-black border-r-4 border-black/10 pr-4">
                {section.heading}
              </h2>
              <p className="whitespace-pre-line text-[14px] md:text-[15px] leading-relaxed text-black/60">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </InformationFrame>
  );
}

export function SeoInformationPage({ data }: PublicPageProps) {
  if (data.path === "/faq") return <SeoFaq />;
  if (data.path === "/terms") return <SeoTerms />;
  if (data.path === "/contact") return <SeoContact data={data} />;
  if (data.path === "/collaboration") return <SeoCollaboration />;
  return <SeoAcquisition data={data} />;
}
