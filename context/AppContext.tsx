import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../types/product";
import { StudioProject } from "../types/studio";
import { trackEvent as trackAnalytics } from "../utils/analytics";

// Define the shape of the context
interface AppContextType {
  product: Product | null;
  setProduct: (product: Product | null) => void;
  allProducts: Product[];
  setAllProducts: (products: Product[]) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  visualizedImageUrl: string;
  setVisualizedImageUrl: (url: string) => void;
  sessionId: string;
  productVariant: { color?: string; size?: string };
  setProductVariant: (variant: { color?: string; size?: string }) => void;
  uploadStartTime: number;
  setUploadStartTime: (time: number) => void;
  errorType: string;
  setErrorType: (type: string) => void;
  placementSuccess: boolean;
  setPlacementSuccess: (success: boolean) => void;
  trackKPI: (event: string, metadata?: Record<string, any>) => void;
  
  // Studio Flow
  studioMode: 'recommend' | 'tryon' | null;
  setStudioMode: (mode: 'recommend' | 'tryon' | null) => void;

  // Feedback & Actions
  pendingAction: "save" | "tryAnother" | "backToStore" | null;
  setPendingAction: (action: "save" | "tryAnother" | "backToStore" | null) => void;
  userFeedback: "satisfied" | "neutral" | "dissatisfied" | null;
  setUserFeedback: (feedback: "satisfied" | "neutral" | "dissatisfied" | null) => void;
  hasFeedbackForCurrentImage: boolean;
  setHasFeedbackForCurrentImage: (has: boolean) => void;
  user: any | null;
  setUser: (user: any | null) => void;
  isLoggedIn: boolean;

  // Studio Projects
  studioProjects: StudioProject[];
  addStudioProject: (project: StudioProject) => void;
  updateStudioProject: (id: string, project: Partial<StudioProject>) => void;
  deleteStudioProject: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visualizedImageUrl, setVisualizedImageUrl] = useState<string>("");
  const [productVariant, setProductVariant] = useState<{ color?: string; size?: string }>({});
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [errorType, setErrorType] = useState<string>("network");
  const [placementSuccess, setPlacementSuccess] = useState<boolean>(true);
  
  // Studio Flow
  const [studioMode, setStudioMode] = useState<'recommend' | 'tryon' | null>(null);

  // Feedback State
  const [pendingAction, setPendingAction] = useState<"save" | "tryAnother" | "backToStore" | null>(null);
  const [userFeedback, setUserFeedback] = useState<"satisfied" | "neutral" | "dissatisfied" | null>(null);
  const [hasFeedbackForCurrentImage, setHasFeedbackForCurrentImage] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);

  // Studio Projects State
  const [studioProjects, setStudioProjects] = useState<StudioProject[]>([]);

  // Load from LocalStorage if needed, or initialize with mock data
  useEffect(() => {
    const savedProjects = localStorage.getItem("studioProjects");
    if (savedProjects) {
      setStudioProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save to LocalStorage whenever projects change
  useEffect(() => {
    if (studioProjects.length > 0) {
      localStorage.setItem("studioProjects", JSON.stringify(studioProjects));
    }
  }, [studioProjects]);

  const addStudioProject = (project: StudioProject) => {
    setStudioProjects(prev => [project, ...prev]);
  };

  const updateStudioProject = (id: string, updates: Partial<StudioProject>) => {
    setStudioProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteStudioProject = (id: string) => {
    setStudioProjects(prev => prev.filter(p => p.id !== id));
  };

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // In a real app, we'd verify the token and fetch user data
      setUser({ id: "stored_user", name: "کاربر هُما" });
    }
  }, []);

  // Session ID is constant per session
  const [sessionId] = useState<string>(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const trackKPI = (event: string, metadata?: Record<string, any>) => {
    const eventData = {
      timestamp: new Date().toISOString(),
      productId: product?.id,
      productName: product?.name,
      sessionId,
      ...metadata,
    };
    console.log(`[KPI] ${event}`, eventData);
    trackAnalytics(event, eventData);
  };

  return (
    <AppContext.Provider
      value={{
        product,
        setProduct,
        allProducts,
        setAllProducts,
        selectedFile,
        setSelectedFile,
        visualizedImageUrl,
        setVisualizedImageUrl,
        sessionId,
        productVariant,
        setProductVariant,
        uploadStartTime,
        setUploadStartTime,
        errorType,
        setErrorType,
        placementSuccess,
        setPlacementSuccess,
        trackKPI,
        studioMode,
        setStudioMode,
        pendingAction,
        setPendingAction,
        userFeedback,
        setUserFeedback,
        hasFeedbackForCurrentImage,
        setHasFeedbackForCurrentImage,
        user,
        setUser,
        isLoggedIn: !!user,
        studioProjects,
        addStudioProject,
        updateStudioProject,
        deleteStudioProject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}