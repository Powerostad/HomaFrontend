export interface StudioRecommendation {
  id: string;
  name: string;
  price: number;
  category: 'کف' | 'نور' | 'دیوار' | 'اکسسوری';
  image: string;
  store: string;
  status: 'none' | 'added' | 'liked' | 'hidden';
}

export interface StudioSession {
  id: string;
  createdAt: string;
  brief: {
    style: string;
    budget: string;
    constraints: string[];
  };
  recommendations: StudioRecommendation[];
  summary: string;
  isPinned?: boolean;
}

export interface StudioProject {
  id: string;
  name: string;
  createdAt: string;
  thumbnail?: string;
  sessions: StudioSession[];
  shoppingList: string[]; // IDs of products from sessions added to project list
}
