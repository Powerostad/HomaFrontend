import { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { ProductProvider } from "./ProductContext";
import { UploadProvider } from "./UploadContext";
import { StudioProvider } from "./StudioContext";
import { FeedbackProvider } from "./FeedbackContext";
import { SessionProvider } from "./SessionContext";
import { ShopProvider } from "./ShopContext";
import { BasketProvider } from "./BasketContext";

/**
 * AppProviders - Combines all context providers
 *
 * Provider order matters! Inner providers can access outer provider values.
 * Order: Session > Auth > Basket > Shop > Product > Upload > Studio > Feedback
 *
 * BasketProvider sits below Auth (login dispatches an event the basket listens
 * for) and above Studio (Studio's collection UI reads the server basket).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <BasketProvider>
          <ShopProvider>
            <ProductProvider>
              <UploadProvider>
                <StudioProvider>
                  <FeedbackProvider>
                    {children}
                  </FeedbackProvider>
                </StudioProvider>
              </UploadProvider>
            </ProductProvider>
          </ShopProvider>
        </BasketProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

// Re-export all hooks for convenient importing
export { useAuth } from "./AuthContext";
export { useShop } from "./ShopContext";
export { useProduct } from "./ProductContext";
export { useUpload } from "./UploadContext";
export { useStudio } from "./StudioContext";
export { useFeedback } from "./FeedbackContext";
export { useSession } from "./SessionContext";
export { useBasket } from "./BasketContext";

// Re-export types
export type { User } from "./AuthContext";
export type { ProductVariant } from "./ProductContext";
export type { FeedbackRating, PendingAction } from "./FeedbackContext";
