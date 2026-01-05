import React, { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { ProductProvider } from "./ProductContext";
import { UploadProvider } from "./UploadContext";
import { StudioProvider } from "./StudioContext";
import { FeedbackProvider } from "./FeedbackContext";
import { SessionProvider } from "./SessionContext";

/**
 * AppProviders - Combines all context providers
 *
 * Provider order matters! Inner providers can access outer provider values.
 * Order: Session > Auth > Product > Upload > Studio > Feedback
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ProductProvider>
          <UploadProvider>
            <StudioProvider>
              <FeedbackProvider>
                {children}
              </FeedbackProvider>
            </StudioProvider>
          </UploadProvider>
        </ProductProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

// Re-export all hooks for convenient importing
export { useAuth } from "./AuthContext";
export { useProduct } from "./ProductContext";
export { useUpload } from "./UploadContext";
export { useStudio } from "./StudioContext";
export { useFeedback } from "./FeedbackContext";
export { useSession } from "./SessionContext";

// Re-export types
export type { User } from "./AuthContext";
export type { ProductVariant } from "./ProductContext";
export type { FeedbackRating, PendingAction } from "./FeedbackContext";
