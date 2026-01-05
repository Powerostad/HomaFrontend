import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "../types/product";

/**
 * ProductVariant - selected color/size options
 */
export interface ProductVariant {
  color?: string;
  size?: string;
}

/**
 * ProductContext - manages product selection and catalog state
 */
interface ProductContextType {
  product: Product | null;
  setProduct: (product: Product | null) => void;
  allProducts: Product[];
  setAllProducts: (products: Product[]) => void;
  productVariant: ProductVariant;
  setProductVariant: (variant: ProductVariant) => void;
  clearProduct: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productVariant, setProductVariant] = useState<ProductVariant>({});

  const clearProduct = () => {
    setProduct(null);
    setProductVariant({});
  };

  return (
    <ProductContext.Provider
      value={{
        product,
        setProduct,
        allProducts,
        setAllProducts,
        productVariant,
        setProductVariant,
        clearProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}
