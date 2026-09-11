import type { PublicShop, PublicProduct, PublicVariant } from "../seo/types";
import type { Shop } from "../types/shop";
import type { APIProduct, ProductVariant } from "../types/apiProduct";

/**
 * Convert SEO PublicShop to frontend Shop type.
 * Used when passing server-rendered data to original page components.
 */
export function publicShopToShop(publicShop: PublicShop): Shop {
  return {
    id: String(publicShop.id),
    name: publicShop.shop_name,
    username: publicShop.slug,
    logoUrl: publicShop.logo_url,
    website: publicShop.website ?? null,
    productCount: publicShop.product_count,
    isPromoted: false,
    createdAt: publicShop.updated_at ?? "",
  };
}

/**
 * Convert SEO PublicVariant to frontend ProductVariant type.
 */
function publicVariantToProductVariant(v: PublicVariant): ProductVariant {
  return {
    id: v.id,
    widthCm: v.width_cm ?? null,
    lengthCm: v.length_cm ?? null,
    heightCm: v.height_cm ?? null,
    shape: "",
    labelFa: v.label_fa,
    price: v.price,
    isDefault: v.is_default,
  };
}

/**
 * Convert SEO PublicProduct to frontend APIProduct type.
 * Used when passing server-rendered data to original page components.
 */
export function publicProductToAPIProduct(publicProduct: PublicProduct): APIProduct {
  const variants = publicProduct.variants?.map(publicVariantToProductVariant);
  return {
    id: String(publicProduct.id),
    name: publicProduct.name,
    category: publicProduct.category ?? "",
    categoryDisplay: publicProduct.category_display ?? "",
    price: publicProduct.price,
    imageUrl: publicProduct.image_url ?? "",
    imageUrls: publicProduct.image_urls
      ? {
          card: publicProduct.image_urls.card ?? null,
          detail: publicProduct.image_urls.detail ?? null,
          original: publicProduct.image_urls.original ?? null,
        }
      : undefined,
    imagePath: "",
    uniqueLink: publicProduct.unique_link,
    shopName: publicProduct.shop_name,
    shopSlug: publicProduct.shop_slug,
    description: publicProduct.description,
    externalLink: publicProduct.link ?? undefined,
    extraDetails: publicProduct.extra_details,
    variants,
    availableSizes: variants?.map((v) => String(v.id)),
    availableSizesDisplay: variants?.map((v) => v.labelFa),
    isPromoted: false,
    createdAt: publicProduct.updated_at,
  };
}
