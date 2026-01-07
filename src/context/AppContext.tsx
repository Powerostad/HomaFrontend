import { createContext, useContext, useCallback, type ReactNode } from "react";
import { Product } from "../types/product";
import { StudioProject } from "../types/studio";

// Import new contexts
import { AppProviders, useAuth, useProduct, useUpload, useStudio, useFeedback, useSession } from "./AppProviders";

/**
 * DEPRECATED: AppContext is now a facade over the new split contexts.
 *
 * For new code, use the specific hooks:
 * - useAuth() for user/login state
 * - useProduct() for product selection
 * - useUpload() for file upload state
 * - useStudio() for studio mode/projects
 * - useFeedback() for user feedback
 * - useSession() for session tracking
 *
 * This facade is maintained for backwards compatibility during migration.
 */

// Legacy interface for backwards compatibility
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
  trackKPI: (event: string, metadata?: Record<string, unknown>) => void;
  studioMode: 'recommend' | 'tryon' | null;
  setStudioMode: (mode: 'recommend' | 'tryon' | null) => void;
  pendingAction: "save" | "tryAnother" | "backToStore" | null;
  setPendingAction: (action: "save" | "tryAnother" | "backToStore" | null) => void;
  userFeedback: "satisfied" | "neutral" | "dissatisfied" | null;
  setUserFeedback: (feedback: "satisfied" | "neutral" | "dissatisfied" | null) => void;
  hasFeedbackForCurrentImage: boolean;
  setHasFeedbackForCurrentImage: (has: boolean) => void;
  user: { id: string; name: string; phone?: string } | null;
  setUser: (user: { id: string; name: string; phone?: string } | null) => void;
  isLoggedIn: boolean;
  studioProjects: StudioProject[];
  addStudioProject: (project: StudioProject) => void;
  updateStudioProject: (id: string, project: Partial<StudioProject>) => void;
  deleteStudioProject: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider - Facade wrapper that provides backwards compatibility
 * Wraps children with all new providers and exposes legacy interface
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <AppContextBridge>
        {children}
      </AppContextBridge>
    </AppProviders>
  );
}

/**
 * Bridge component that combines all new contexts into legacy interface
 */
function AppContextBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const productCtx = useProduct();
  const upload = useUpload();
  const studio = useStudio();
  const feedback = useFeedback();
  const session = useSession();

  // Create legacy-compatible value
  const value: AppContextType = {
    // Product
    product: productCtx.product,
    setProduct: productCtx.setProduct,
    allProducts: productCtx.allProducts,
    setAllProducts: productCtx.setAllProducts,
    productVariant: productCtx.productVariant,
    setProductVariant: productCtx.setProductVariant,

    // Upload
    selectedFile: upload.selectedFile,
    setSelectedFile: upload.setSelectedFile,
    visualizedImageUrl: upload.visualizedImageUrl,
    setVisualizedImageUrl: upload.setVisualizedImageUrl,
    uploadStartTime: upload.uploadStartTime,
    setUploadStartTime: upload.setUploadStartTime,

    // Session
    sessionId: session.sessionId,
    errorType: session.errorType,
    setErrorType: session.setErrorType,
    placementSuccess: session.placementSuccess,
    setPlacementSuccess: session.setPlacementSuccess,
    trackKPI: session.trackKPI,

    // Studio
    studioMode: studio.studioMode,
    setStudioMode: studio.setStudioMode,
    studioProjects: studio.studioProjects,
    addStudioProject: studio.addStudioProject,
    updateStudioProject: studio.updateStudioProject,
    deleteStudioProject: studio.deleteStudioProject,

    // Feedback
    pendingAction: feedback.pendingAction,
    setPendingAction: feedback.setPendingAction,
    userFeedback: feedback.userFeedback,
    setUserFeedback: feedback.setUserFeedback,
    hasFeedbackForCurrentImage: feedback.hasFeedbackForCurrentImage,
    setHasFeedbackForCurrentImage: feedback.setHasFeedbackForCurrentImage,

    // Auth - with backwards-compatible setUser shim
    user: auth.user,
    setUser: useCallback((userData: { id: string; name: string; phone?: string } | null) => {
      console.warn('[AppContext] setUser is deprecated. Use useAuth().login(user, tokens) instead.');
      if (userData) {
        // Create placeholder tokens for backwards compatibility
        // This won't work with real backend - use proper login flow
        auth.login(userData, {
          access: `placeholder_${userData.id}`,
          refresh: `placeholder_refresh_${userData.id}`,
        });
      } else {
        auth.logout();
      }
    }, [auth]),
    isLoggedIn: auth.isLoggedIn,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * @deprecated Use specific hooks instead:
 * - useAuth() for user/login
 * - useProduct() for products
 * - useUpload() for file upload
 * - useStudio() for studio
 * - useFeedback() for feedback
 * - useSession() for session/tracking
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
