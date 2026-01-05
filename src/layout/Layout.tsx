import { Outlet as RouterOutlet } from "react-router-dom";
import { AdminDashboard } from "../components/AdminDashboard";
import { BrandColors } from "../components/BrandColors";

/**
 * Layout - Main application layout wrapper
 *
 * Provides consistent styling and dev-only debug tools.
 * Debug components (AdminDashboard, BrandColors) only render in development.
 */
export function Layout() {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen antialiased selection:bg-brand-primary selection:text-content-inverse bg-surface-page text-content-primary">
      <RouterOutlet />

      {/* Dev-only debug overlays - excluded from production builds */}
      {isDev && (
        <>
          <AdminDashboard />
          <BrandColors />
        </>
      )}
    </div>
  );
}