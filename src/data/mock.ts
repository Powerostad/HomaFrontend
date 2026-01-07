import { Product } from '../types/product';

export interface DecorExample {
  id: string;
  image: string;
  beforeImage?: string; // Added beforeImage
  title?: string;
  productCount: number;
  hasBeforeAfter?: boolean;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  address?: string;
  phone?: string;
  categories: string[];
  products: Product[];
  rating: number;
  productCount: number;
  matchScore?: number;
  decorExamples?: DecorExample[];
}

const DECOR_EXAMPLES_STORE_1: DecorExample[] = [
  {
    id: 'd1',
    image: 'https://images.unsplash.com/photo-1617596225496-1d9da33a144b?auto=format&fit=crop&q=80&w=1000',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000',
    title: 'نشیمن مینیمال طوسی',
    productCount: 2,
    hasBeforeAfter: true
  },
  {
    id: 'd2',
    image: 'https://images.unsplash.com/photo-1762803841262-99261e8ff08a?auto=format&fit=crop&q=80&w=1000',
    beforeImage: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=1000',
    title: 'فضای کار خانگی مدرن',
    productCount: 3,
    hasBeforeAfter: true
  },
  {
    id: 'd3',
    image: 'https://images.unsplash.com/photo-1693382464215-2b9d3ad53086?auto=format&fit=crop&q=80&w=1000',
    beforeImage: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=1000',
    title: 'گوشه دنج ناهارخوری',
    productCount: 1,
    hasBeforeAfter: true
  }
];

const PRODUCTS_STORE_1: Product[] = [
  {
    id: 'p1',
    name: 'مبل راحتی مدرن مدل سهند',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1761330439616-63639775af7a?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1761330439616-63639775af7a?auto=format&fit=crop&q=80&w=1000'],
    price: 12564390,
    originalPrice: 15700000,
    discountPercentage: 20,
    currency: 'تومان',
    rating: 4.3,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'مبل راحتی با طراحی مینیمال و پارچه نانو ضد لک',
    variants: {
      colors: [{ name: 'فیلی', hex: '#808080', available: true }, { name: 'یشمی', hex: '#006400', available: true }],
      sizes: [{ name: 'تک نفره', available: true }, { name: 'سه نفره', available: true }]
    }
  },
  {
    id: 'p2',
    name: 'صندلی غذاخوری چوبی راش',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1686162812607-35fb53ef562f?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1686162812607-35fb53ef562f?auto=format&fit=crop&q=80&w=1000'],
    price: 4500000,
    originalPrice: 5000000,
    discountPercentage: 10,
    currency: 'تومان',
    rating: 4.7,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'صندلی چوبی ساخته شده از چوب راش گرجستان',
    variants: {
      colors: [{ name: 'قهوه‌ای', hex: '#8B4513', available: true }],
      sizes: [{ name: 'استاندارد', available: true }]
    }
  },
  {
    id: 'p10',
    name: 'میز عسلی مدرن مدل گرد',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1760072513442-9872656c1b07?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1760072513442-9872656c1b07?auto=format&fit=crop&q=80&w=1000'],
    price: 2800000,
    currency: 'تومان',
    rating: 4.5,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'میز عسلی با پایه فلزی و صفحه سنگی'
  },
  {
    id: 'p11',
    name: 'پوف راحتی بافتنی',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1000'],
    price: 1200000,
    originalPrice: 1500000,
    discountPercentage: 20,
    currency: 'تومان',
    rating: 4.8,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'پوف راحتی با بافت دست‌ساز پنبه‌ای'
  },
  {
    id: 'p12',
    name: 'کتابخانه چوبی دیواری',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=1000'],
    price: 6700000,
    currency: 'تومان',
    rating: 4.4,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'کتابخانه ۵ طبقه از چوب روسی'
  },
  {
    id: 'p13',
    name: 'میز جلو مبلی مینیمال',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&q=80&w=1000'],
    price: 8900000,
    currency: 'تومان',
    rating: 4.9,
    seller: { name: 'گالری مبلمان کلاسیک', verified: true },
    status: 'active',
    description: 'میز جلو مبلی با طراحی ارگانیک و چوب گردو'
  }
];

const PRODUCTS_STORE_2: Product[] = [
  {
    id: 'p3',
    name: 'فرش دستباف تبریز طرح افشان',
    category: 'Carpet',
    thumbnail: 'https://images.unsplash.com/photo-1660394585016-508f949df960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwY2FycGV0fGVufDF8fHx8MTc2Njk1MDYyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    images: ['https://images.unsplash.com/photo-1660394585016-508f949df960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwY2FycGV0fGVufDF8fHx8MTc2Njk1MDYyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
    price: 85000000,
    currency: 'تومان',
    rating: 4.9,
    seller: { name: 'فرش ابریشم', verified: true },
    status: 'active',
    description: 'فرش ۶ متری تمام ابریشم با طرح افشان'
  }
];

const PRODUCTS_STORE_3: Product[] = [
  {
    id: 'p4',
    name: 'لوستر کریستال مدرن',
    category: 'Lighting',
    thumbnail: 'https://images.unsplash.com/photo-1634219959143-9a028a4934cc?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1634219959143-9a028a4934cc?auto=format&fit=crop&q=80&w=1000'],
    price: 12000000,
    currency: 'تومان',
    seller: { name: 'نور و روشنایی', verified: true },
    status: 'active',
    description: 'لوستر ۱۲ شاخه با کریستال‌های اتریشی'
  }
];

const PRODUCTS_STORE_4: Product[] = [
  {
    id: 'p5',
    name: 'آینه دکوراتیو هندسی',
    category: 'Accessories',
    thumbnail: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1000'],
    price: 3200000,
    currency: 'تومان',
    rating: 4.6,
    seller: { name: 'خانه مدرن', verified: true },
    status: 'active',
    description: 'آینه چند تکه با قاب برنجی'
  }
];

const PRODUCTS_STORE_5: Product[] = [
  {
    id: 'p6',
    name: 'تابلو نقاشی انتزاعی',
    category: 'Art',
    thumbnail: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1000'],
    price: 15000000,
    currency: 'تومان',
    rating: 4.8,
    seller: { name: 'استودیو هنر', verified: true },
    status: 'active',
    description: 'رنگ روغن روی بوم، ابعاد ۱۰۰ در ۱۰۰'
  }
];

const PRODUCTS_STORE_6: Product[] = [
  {
    id: 'p7',
    name: 'سرویس غذاخوری سرامیکی',
    category: 'Kitchen',
    thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=1000'],
    price: 7800000,
    currency: 'تومان',
    rating: 4.7,
    seller: { name: 'آشپزخانه مینیمال', verified: true },
    status: 'active',
    description: 'سرویس ۲۴ پارچه دست‌ساز'
  }
];

const PRODUCTS_STORE_7: Product[] = [
  {
    id: 'p8',
    name: 'آباژور رومیزی سنگی',
    category: 'Lighting',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000'],
    price: 5400000,
    currency: 'تومان',
    rating: 4.5,
    seller: { name: 'نور و سنگ', verified: true },
    status: 'active',
    description: 'آباژور با پایه مرمر طبیعی'
  }
];

const PRODUCTS_STORE_8: Product[] = [
  {
    id: 'p9',
    name: 'کاناپه سه نفره مخمل',
    category: 'Furniture',
    thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1000'],
    price: 42000000,
    currency: 'تومان',
    rating: 4.9,
    seller: { name: 'مبلمان مخمل', verified: true },
    status: 'active',
    description: 'کاناپه با پارچه مخمل ترک و پایه‌های چوبی'
  }
];

export const MOCK_STORES: Store[] = [
  {
    id: 's1',
    name: 'گالری مبلمان کلاسیک',
    slug: 'classic-furniture',
    description: 'تلفیقی از هنر مدرن و کلاسیک در طراحی مبلمان خانگی',
    logo: 'https://ui-avatars.com/api/?name=CF&background=random',
    coverImage: 'https://images.unsplash.com/photo-1670302689961-a5aa5a0d3795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBzdG9yZSUyMGludGVyaW9yfGVufDF8fHx8MTc2Njg3NTk0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    categories: ['مبلمان', 'دکوراسیون'],
    products: PRODUCTS_STORE_1,
    rating: 4.8,
    productCount: 124,
    matchScore: 87,
    decorExamples: DECOR_EXAMPLES_STORE_1
  },
  {
    id: 's2',
    name: 'فرش ابریشم',
    slug: 'silk-carpet',
    description: 'کلکسیونی از نفیس‌ترین فرش‌های دستباف تبریز و قم',
    logo: 'https://ui-avatars.com/api/?name=SC&background=random',
    coverImage: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=1000',
    categories: ['فرش', 'تابلو فرش'],
    products: PRODUCTS_STORE_2,
    rating: 4.9,
    productCount: 86,
    matchScore: 92
  },
  {
    id: 's3',
    name: 'نور و روشنایی',
    slug: 'light-store',
    description: 'طراحی نوری فضای شما با جدیدترین متدهای روز دنیا',
    logo: 'https://ui-avatars.com/api/?name=LS&background=random',
    coverImage: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&q=80&w=1000',
    categories: ['نورپردازی', 'لوستر'],
    products: PRODUCTS_STORE_3,
    rating: 4.5,
    productCount: 203,
    matchScore: 74
  },
  {
    id: 's4',
    name: 'خانه مدرن',
    slug: 'modern-home',
    description: 'اکسسوری‌های خاص برای خانه‌هایی با سبک زندگی مدرن',
    logo: 'https://ui-avatars.com/api/?name=MH&background=random',
    coverImage: 'https://images.unsplash.com/photo-1616489953149-8f6f69324021?auto=format&fit=crop&q=80&w=1000',
    categories: ['اکسسوری', 'تزئینات'],
    products: PRODUCTS_STORE_4,
    rating: 4.6,
    productCount: 45,
    matchScore: 81
  },
  {
    id: 's5',
    name: 'استودیو هنر',
    slug: 'art-studio',
    description: 'آثار هنری برگزیده از هنرمندان معاصر ایران',
    logo: 'https://ui-avatars.com/api/?name=AS&background=random',
    coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1000',
    categories: ['هنر', 'نقاشی'],
    products: PRODUCTS_STORE_5,
    rating: 4.8,
    productCount: 32,
    matchScore: 89
  },
  {
    id: 's6',
    name: 'آشپزخانه مینیمال',
    slug: 'minimal-kitchen',
    description: 'سادگی و کارایی در قلب تپنده خانه شما',
    logo: 'https://ui-avatars.com/api/?name=MK&background=random',
    coverImage: 'https://images.unsplash.com/photo-1556911220-e15224bbafb0?auto=format&fit=crop&q=80&w=1000',
    categories: ['آشپزخانه', 'ظروف'],
    products: PRODUCTS_STORE_6,
    rating: 4.7,
    productCount: 112,
    matchScore: 78
  },
  {
    id: 's7',
    name: 'نور و سنگ',
    slug: 'light-and-stone',
    description: 'تلفیقی از متریال‌های طبیعی و تکنولوژی نورپردازی',
    logo: 'https://ui-avatars.com/api/?name=LS&background=random',
    coverImage: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1000',
    categories: ['نورپردازی', 'سنگ طبیعی'],
    products: PRODUCTS_STORE_7,
    rating: 4.5,
    productCount: 56,
    matchScore: 72
  },
  {
    id: 's8',
    name: 'مبلمان مخمل',
    slug: 'velvet-furniture',
    description: 'تجربه راحتی و لطافت با بهترین پارچه‌های مخمل',
    logo: 'https://ui-avatars.com/api/?name=VF&background=random',
    coverImage: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1000',
    categories: ['مبلمان', 'راحتی'],
    products: PRODUCTS_STORE_8,
    rating: 4.9,
    productCount: 74,
    matchScore: 95
  }
];