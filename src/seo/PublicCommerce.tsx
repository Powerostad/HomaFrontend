import { AddToBasketButton } from "../components/basket/AddToBasketButton";
import { BuyButton } from "../components/BuyButton";
import type { PublicProduct } from "./types";

/** Browser-only product controls, loaded after the public document hydrates. */
export function PublicBasketCommerce({ product, variantId }: { product: PublicProduct; variantId: number | null }) {
  return <AddToBasketButton productUniqueLink={product.unique_link} variantId={variantId} sourceContext="product_page" variant="outline" size="lg" className="flex-1 h-12 rounded-none border-black/10 text-black hover:bg-black/5 text-[13px] font-bold tracking-widest" />;
}

export function PublicBuyCommerce({ product }: { product: PublicProduct }) {
  return <BuyButton productId={product.unique_link} sourceContext="product_page" shopName={product.shop_name} variant="outline" size="lg" className="w-full h-12 rounded-none border-black/10 text-black hover:bg-black/5 text-[13px] font-bold tracking-widest mt-3" />;
}
