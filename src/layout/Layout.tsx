import { Outlet as RouterOutlet } from "react-router-dom";
import { Toaster } from "../components/ui/sonner";
import { BrandColors } from "../components/BrandColors";
import { BasketSheet } from "../components/basket/BasketSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";

/**
 * Layout - Main application layout wrapper
 *
 * Provides consistent styling and dev-only debug tools.
 * Debug components (BrandColors) only render in development.
 */
export function Layout() {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen antialiased selection:bg-brand-primary selection:text-content-inverse bg-surface-page text-content-primary">
      <RouterOutlet />
      <Toaster position="top-center" dir="rtl" richColors />

      {/* Global slide-over basket — opens from the header bag icon anywhere.
          Isolated in an ErrorBoundary so a basket render failure can never
          take down the whole app; fallback={null} just hides the sheet. */}
      <ErrorBoundary fallback={null}>
        <BasketSheet />
      </ErrorBoundary>

      {/* Dev-only debug overlays - excluded from production builds */}
      {isDev && <BrandColors />}
    </div>
  );
}