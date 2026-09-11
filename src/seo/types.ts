export type PageKind = 'home' | 'explore' | 'gallery' | 'store' | 'product' | 'article' | 'not-found' | 'unavailable' | 'private';
export interface PublicShop { id: number; shop_name: string; slug: string; logo_url: string | null; website?: string | null; product_count: number; updated_at?: string; }
export interface PublicVariant { id: number; label_fa: string; price: number | null; is_default: boolean; width_cm?: string | null; length_cm?: string | null; height_cm?: string | null; }
export interface PublicProduct { id: number; name: string; unique_link: string; shop_slug: string; shop_name: string; price: number; description?: string; category?: string; category_display?: string; image_url?: string; image_urls?: { card?: string; detail?: string; original?: string }; link?: string | null; extra_details?: Record<string, string | string[]> | null; variants?: PublicVariant[]; updated_at?: string; }
export interface SeoMetadata { title: string; description: string; canonical: string; robots: string; image: string; type: 'website' | 'product' | 'article'; jsonLd: Record<string, unknown>[]; }
export interface Breadcrumb { name: string; path: string; }
export interface PublicPageData { kind: PageKind; path: string; search?: string; page: number; total: number; products: PublicProduct[]; shops: PublicShop[]; shop?: PublicShop; product?: PublicProduct; breadcrumbs: Breadcrumb[]; seo: SeoMetadata; status: number; apiBase: string; supportUrl?: string; }
export interface ArticleSection { heading: string; body: string; }
export interface ArticleContent { title: string; description: string; eyebrow: string; sections: ArticleSection[]; cta?: { label: string; href: string }; examples?: boolean; }
