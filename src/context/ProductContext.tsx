import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
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
 *
 * IMPORTANT: Uses a ref alongside state for the selected product to handle
 * the race condition between setProduct and navigation. The ref
 * is updated synchronously so it's available immediately after setting.
 */
interface ProductContextType {
  product: Product | null;
  setProduct: (product: Product | null) => void;
  /**
   * Get the product synchronously - useful when navigating immediately after setting
   */
  getProduct: () => Product | null;
  allProducts: Product[];
  setAllProducts: (products: Product[]) => void;
  productVariant: ProductVariant;
  setProductVariant: (variant: ProductVariant) => void;
  clearProduct: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  // Product selection - use both state (for reactivity) and ref (for sync access)
  const [product, setProductState] = useState<Product | null>(null);
  const productRef = useRef<Product | null>(null);

  // Sync setter that updates both ref and state
  const setProduct = useCallback((p: Product | null) => {
    productRef.current = p;  // Sync - available immediately
    setProductState(p);       // Async - triggers re-render
  }, []);

  // Sync getter for immediate access
  const getProduct = useCallback(() => productRef.current, []);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productVariant, setProductVariant] = useState<ProductVariant>({});

  const clearProduct = () => {
    productRef.current = null;
    setProductState(null);
    setProductVariant({});
  };

  return (
    <ProductContext.Provider
      value={{
        product,
        setProduct,
        getProduct,
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
