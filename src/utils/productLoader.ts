import type { Product, UTMParams, EntryContext } from "../types/product";
const rugImage1 = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";
const rugImage2 = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

// Mock product database
const mockProducts: Record<string, Product> = {
  "prod_rug_21902": {
    id: "prod_rug_21902",
    name: "قالی دستباف قشقایی شیراز",
    nameEn: "Qashqai Handwoven Rug Shiraz",
    thumbnail: rugImage1,
    price: 45000000,
    currency: "تومان",
    seller: {
      name: "گالری فرش ایرانی",
      verified: true
    },
    brand: "قشقایی اصیل",
    category: "rug",
    variants: {
      colors: [
        { name: "قرمز سنتی", hex: "#8B2635", available: true },
      ],
      sizes: [
        { name: "۲×۳ متر", available: true },
        { name: "۳×۴ متر", available: true }
      ]
    },
    selectedVariant: {
      color: "قرمز سنتی",
      size: "۲×۳ متر"
    },
    status: "active",
    images: [
      rugImage1,
      rugImage2
    ],
    description: "قالی دستباف اصیل قشقایی از شیراز با رنگ‌های طبیعی و نقوش سنتی. هنر دست‌بافت اصیل ایرانی با کیفیت بی‌نظیر.",
    features: [
      "رنگ‌های طبیعی گیاهی",
      "بافت دست با پشم طبیعی",
      "نقش‌های سنتی قشقایی",
      "شناسه محصول: 21902",
      "ساخت شیراز - ایران"
    ]
  },
  "prod_chair_01": {
    id: "prod_chair_01",
    name: "صندلی راحتی مدرن",
    nameEn: "Modern Comfort Chair",
    thumbnail: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400",
    price: 2500000,
    currency: "تومان",
    seller: {
      name: "فروشگاه مبل آسمان",
      verified: true
    },
    brand: "Nordic Home",
    category: "furniture",
    variants: {
      colors: [
        { name: "خاکستری", hex: "#808080", available: true },
        { name: "آبی", hex: "#4A90E2", available: true },
        { name: "کرم", hex: "#F5F5DC", available: false }
      ],
      sizes: [
        { name: "تک‌نفره", available: true },
        { name: "دونفره", available: true }
      ]
    },
    selectedVariant: {
      color: "خاکستری",
      size: "تک‌نفره"
    },
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      "https://images.unsplash.com/photo-1760716478125-aa948e99ef85?w=800"
    ],
    description: "صندلی راحتی با طراحی مدرن و پارچه با کیفیت بالا. مناسب برای اتاق نشیمن و فضاهای مدرن.",
    features: [
      "پارچه ضد لک و قابل شستشو",
      "فوم با کیفیت بالا",
      "پایه فلزی مقاوم",
      "گارانتی ۲ ساله"
    ]
  },
  "prod_lamp_02": {
    id: "prod_lamp_02",
    name: "چراغ ایستاده مینیمال",
    thumbnail: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
    priceRange: {
      min: 800000,
      max: 1200000
    },
    currency: "تومان",
    seller: {
      name: "نورسازه",
      verified: false
    },
    category: "lighting",
    variants: {
      colors: [
        { name: "مشکی", hex: "#000000", available: true },
        { name: "سفید", hex: "#FFFFFF", available: true },
        { name: "طلایی", hex: "#FFD700", available: true }
      ]
    },
    selectedVariant: {
      color: "مشکی"
    },
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
      "https://images.unsplash.com/photo-1652228409861-4d93c9f0dfad?w=800"
    ],
    description: "چراغ ایستاده با طراحی مینیمال و نور قابل تنظیم.",
    features: [
      "نور LED کم‌مصرف",
      "قابلیت تنظیم شدت نور",
      "طراحی مدرن",
      "مصرف برق کم"
    ]
  },
  "prod_table_03": {
    id: "prod_table_03",
    name: "میز جلو مبلی چوبی",
    nameEn: "Wooden Coffee Table",
    thumbnail: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400",
    price: 3200000,
    currency: "تومان",
    seller: {
      name: "مبل آسمان",
      verified: true
    },
    brand: "Nordic Home",
    category: "furniture",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800",
      "https://images.unsplash.com/photo-1637176706497-1179d9861e16?w=800"
    ],
    description: "میز جلو مبلی با چوب طبیعی و طراحی مدرن",
    features: [
      "چوب بلوط طبیعی",
      "پایه فلزی ضد خش",
      "مقاوم در برابر رطوبت"
    ]
  },
  "prod_sofa_04": {
    id: "prod_sofa_04",
    name: "کاناپه راحتی سه نفره",
    nameEn: "3-Seater Comfort Sofa",
    thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    price: 8500000,
    currency: "تومان",
    seller: {
      name: "مبل آسمان",
      verified: true
    },
    brand: "Nordic Home",
    category: "furniture",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      "https://images.unsplash.com/photo-1762803841262-99261e8ff08a?w=800",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800"
    ],
    description: "کاناپه راحتی با فوم طبی و پارچه ضد لک",
    features: [
      "فوم طبی با کیفیت بالا",
      "پارچه ضد لک و قابل شستشو",
      "گارانتی ۳ سال"
    ]
  },
  "prod_pendant_05": {
    id: "prod_pendant_05",
    name: "لوستر آویز مدرن",
    nameEn: "Modern Pendant Light",
    thumbnail: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400",
    price: 1850000,
    currency: "تومان",
    seller: {
      name: "نورسازه",
      verified: false
    },
    category: "lighting",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800",
      "https://images.unsplash.com/photo-1561382781-76dd6a2ce0b6?w=800"
    ],
    description: "لوستر آویز با طراحی منحصر به فرد",
    features: [
      "LED کم‌مصرف",
      "قابل تنظیم ارتفاع",
      "نصب آسان"
    ]
  },
  "prod_rug_06": {
    id: "prod_rug_06",
    name: "فرش ماشینی طرح کلاسیک",
    nameEn: "Machine-Made Classic Rug",
    thumbnail: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
    priceRange: {
      min: 2500000,
      max: 5000000
    },
    currency: "تومان",
    seller: {
      name: "گالری فرش ایرانی",
      verified: true
    },
    category: "rug",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800",
      "https://images.unsplash.com/photo-1727024418120-77e4e204d09f?w=800"
    ],
    description: "فرش ماشینی با طرح‌های کلاسیک ایرانی",
    features: [
      "رنگ‌های ثابت",
      "بافت تراکم بالا",
      "مناسب برای سالن پذیرایی"
    ]
  },
  "prod_desk_lamp_07": {
    id: "prod_desk_lamp_07",
    name: "چراغ مطالعه رومیزی",
    nameEn: "Desk Study Lamp",
    thumbnail: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400",
    price: 650000,
    currency: "تومان",
    seller: {
      name: "نورسازه",
      verified: false
    },
    category: "lighting",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800",
      "https://images.unsplash.com/photo-1700627565641-bd6b7890befd?w=800"
    ],
    description: "چراغ مطالعه با نور قابل تنظیم",
    features: [
      "سه حالت نوری",
      "بازوی قابل تنظیم",
      "LED کم‌مصرف"
    ]
  },
  "prod_bookshelf_08": {
    id: "prod_bookshelf_08",
    name: "قفسه کتاب چوبی مدرن",
    nameEn: "Modern Wooden Bookshelf",
    thumbnail: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400",
    price: 4500000,
    currency: "تومان",
    seller: {
      name: "مبل آسمان",
      verified: true
    },
    category: "furniture",
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
      "https://images.unsplash.com/photo-1756302637887-1c00e98fd0cc?w=800"
    ],
    description: "قفسه کتاب با طراحی مینیمال و کاربردی",
    features: [
      "۵ طبقه",
      "چوب MDF با روکش ملامینه",
      "نصب آسان"
    ]
  }
};

const suggestedProductsMap: Record<string, Product[]> = {
  "rug": [
    mockProducts["prod_rug_21902"],
    mockProducts["prod_chair_01"]
  ],
  "furniture": [
    mockProducts["prod_chair_01"],
    mockProducts["prod_lamp_02"]
  ],
  "lighting": [
    mockProducts["prod_lamp_02"]
  ]
};

/**
 * Parse URL parameters to extract product ID and UTM data
 */
export function parseEntryParams(url: string): EntryContext | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    const productId = params.get('productId');
    if (!productId) return null;

    const utm: UTMParams = {
      source: params.get('utm_source') || 'direct',
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      content: params.get('utm_content') || undefined,
      term: params.get('utm_term') || undefined
    };

    return {
      productId,
      utm,
      seller: params.get('seller') || undefined,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error parsing entry params:', error);
    return null;
  }
}

/**
 * Fetch product metadata by ID
 * In production, this would be an API call
 */
export async function fetchProduct(productId: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockProducts[productId] || null;
}

/**
 * Get all available products
 * In production, this would be an API call with pagination
 */
export async function fetchAllProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return Object.values(mockProducts).filter(p => p.status === 'active');
}

/**
 * Get suggested products based on category or product ID
 */
export function getSuggestedProducts(category: string, limit: number = 3): Product[] {
  const suggestions = suggestedProductsMap[category] || Object.values(mockProducts);
  return suggestions.slice(0, limit);
}

/**
 * Validate product availability
 */
export function validateProduct(product: Product): {
  isValid: boolean;
  reason?: "not_found" | "inactive" | "out_of_stock";
} {
  if (!product) {
    return { isValid: false, reason: "not_found" };
  }

  if (product.status === "inactive") {
    return { isValid: false, reason: "inactive" };
  }

  if (product.status === "out_of_stock") {
    return { isValid: false, reason: "out_of_stock" };
  }

  return { isValid: true };
}

/**
 * Get product by ID - unified function that works with both mock data and API
 * Used for restoring product from URL params or sessionStorage
 *
 * @param productId - The product ID (could be mock ID like prod_18 or backend unique_link)
 */
export async function getProductById(productId: string): Promise<Product | null> {
  // First try mock products (for local development/testing)
  if (mockProducts[productId]) {
    return mockProducts[productId];
  }

  // TODO: Add API call to fetch product by unique_link from backend
  // For now, try to find in mock products by unique_link-like IDs
  // In production, this should call: GET /products/{unique_link}/

  // Try fetching from API if it looks like a backend ID (UUID format or unique_link)
  try {
    // Check if this might be a backend unique_link (not a prod_* ID)
    if (!productId.startsWith('prod_')) {
      // Try API call - this would need to be implemented based on your API
      // For now, return null and let the caller handle it
      console.log('[productLoader] Unknown product ID format:', productId);
    }
  } catch (error) {
    console.error('[productLoader] Failed to fetch product:', error);
  }

  return null;
}