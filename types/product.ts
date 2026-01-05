// Product data types for Instagram-sourced products

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  thumbnail: string;
  price?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  currency: string;
  seller: {
    name: string;
    verified: boolean;
  };
  brand?: string;
  category: string;
  variants?: {
    colors?: Array<{ name: string; hex: string; available: boolean }>;
    sizes?: Array<{ name: string; available: boolean }>;
  };
  selectedVariant?: {
    color?: string;
    size?: string;
  };
  status: "active" | "inactive" | "out_of_stock";
  images: string[];
  description?: string;
  features?: string[];
  rating?: number;
  originalPrice?: number;
  discountPercentage?: number;
  
  // Technical Details
  dimensions?: string;
  material?: string;
  maintenance?: string;
  origin?: string;
}

export interface UTMParams {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface EntryContext {
  productId: string;
  utm: UTMParams;
  seller?: string;
  timestamp: number;
}