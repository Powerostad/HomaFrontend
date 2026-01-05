import { Outlet as RouterOutlet } from "react-router-dom";
import { AdminDashboard } from "../components/AdminDashboard";
import { BrandColors } from "../components/BrandColors";
import { ProductDetailsModal } from "../components/ProductDetailsModal";
import { TermsModal } from "../components/TermsModal";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export function Layout() {
  const { product } = useApp();
  const [showTerms, setShowTerms] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Note: The logic to toggle these modals might need to be exposed via Context if they are triggered from deep within pages.
  // For now, we'll keep the placeholders as per original App.tsx structure, but since the trigger buttons are inside pages,
  // we might need to move the state to Context or handle it locally in pages if the modals are page-specific.
  // However, AdminDashboard and BrandColors are global overlays.

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]">
      <RouterOutlet />
      
      {/* Global Overlays */}
      <AdminDashboard />
      <BrandColors />
      
      {/* We can keep these global if needed, but typically they are better placed near their triggers or managed via global UI state */}
      {/* For the purpose of this refactor, I will assume specific pages will render these modals or we add global UI state later. */}
    </div>
  );
}