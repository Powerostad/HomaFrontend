import { useSiteTranslation } from '@/i18n/siteCopy';
import { Suspense } from "react";
import { Navigate, BrowserRouter as Router, Route as RouterRoute, Routes as RouterRoutes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./layout/Layout";

// Import Pages directly instead of lazy to prevent "white screen" hydration issues in this environment
import { HomaLoader } from "./components/HomaLoader";
import { ScrollToTop } from "./components/ScrollToTop";
import { BasketPage } from "./pages/Basket";
import { CollaborationPage } from "./pages/Collaboration/Page";
import { ConfirmationPage } from "./pages/Confirmation";
import { ContactPage } from "./pages/Contact/Page";
import { ErrorPage } from "./pages/Error";
import { ExplorePage } from "./pages/Explore";
import { FAQPage } from "./pages/FAQ/Page";
import { GalleryPage } from "./pages/Gallery";
import { InformationPage } from "./pages/Information/Page";
import { PrecheckPage } from "./pages/Precheck";
import { ProcessingPage } from "./pages/Processing";
import { ProductDetailsPage } from "./pages/ProductDetails";
import { ProductFallbackPage } from "./pages/ProductFallback";
import { ProductLandingPage } from "./pages/ProductLanding/Page";
import { StorePage } from "./pages/Store";
import { StudioProgressPage } from "./pages/Studio/ProgressPage";
import { StudioProjectDetailsPage } from "./pages/Studio/ProjectDetailsPage";
import { StudioProjectsDashboard } from "./pages/Studio/ProjectsDashboard";
import { StudioResultPage } from "./pages/Studio/ResultPage";
import { StudioUploadPage } from "./pages/Studio/UploadPage";
import { UploadPage } from "./pages/Upload/Page";
import { VisualizationPage } from "./pages/Visualization";

// Try On Flow
import { TryOnProgressPage } from "./pages/TryOn/ProgressPage";
import { TryOnResultPage } from "./pages/TryOn/ResultPage";
import { TryOnUploadPage } from "./pages/TryOn/UploadPage";

// Room Redesign Flow (conversational recommendations - live chat backend)
import { RoomRedesignPage } from "./pages/RoomRedesign/RoomRedesignPage";

// Account & Gallery
import AccountGalleryDetailPage from "./pages/Account/GalleryDetailPage";
import AccountGalleryPage from "./pages/Account/GalleryPage";

// Shared (public)
import SharedPage from "./pages/Shared/SharedPage";


// Loading Component - Now using HOMA Loader
const PageLoader = () => <HomaLoader />;

export default function App() {
  const { siteText } = useSiteTranslation();
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppProvider>
          <Suspense fallback={<PageLoader />}>
            <RouterRoutes>
            <RouterRoute path="/" element={<Layout />}>
              <RouterRoute index element={<ProductLandingPage />} />
              <RouterRoute path="gallery" element={<GalleryPage />} />
              <RouterRoute path="explore" element={<ExplorePage />} />
              <RouterRoute path="shop" element={<ExplorePage />} /> {/* Alias for ExplorePage */}
              <RouterRoute path="upload" element={<UploadPage />} />
              <RouterRoute path="precheck" element={<PrecheckPage />} />
              <RouterRoute path="processing" element={<ProcessingPage />} />
              <RouterRoute path="confirmation" element={<ConfirmationPage />} />
              <RouterRoute path="result" element={<VisualizationPage />} />
              <RouterRoute path="error" element={<ErrorPage />} />
              <RouterRoute path="product-not-found" element={<ProductFallbackPage />} />
              <RouterRoute path="collaboration" element={<CollaborationPage />} />
              <RouterRoute path="store/:slug" element={<StorePage />} />
              <RouterRoute path="store/:slug/product/:productId" element={<ProductDetailsPage />} />
              <RouterRoute path="basket" element={<BasketPage />} />
              <RouterRoute path="contact" element={<ContactPage />} />
              <RouterRoute path="faq" element={<FAQPage />} />
              <RouterRoute path="support" element={<InformationPage page="support" />} />
              <RouterRoute path="privacy" element={<InformationPage page="privacy" />} />
              <RouterRoute path="terms" element={<InformationPage page="terms" />} />

              {/* Shared gallery items (public, no auth) */}
              <RouterRoute path="s/:token" element={<SharedPage />} />

              {/* Room Redesign Flow: /redesign is the entry point; each chat has a canonical path */}
              <RouterRoute path="redesign/:sessionId?" element={
                <ProtectedRoute fallback="modal">
                  <RoomRedesignPage />
                </ProtectedRoute>
              } />

              {/* Studio Flow (Complex/Dark) */}
              <RouterRoute path="studio" element={<Navigate to="/studio/upload" replace />} />
              <RouterRoute path="studio/start" element={<Navigate to="/studio/upload" replace />} />
              <RouterRoute path="studio/upload" element={<StudioUploadPage />} />
              <RouterRoute path="studio/progress" element={<StudioProgressPage />} />
              <RouterRoute path="studio/result/:jobId" element={<StudioResultPage />} />
              {/* Studio Projects - requires login */}
              <RouterRoute path="studio/projects" element={
                <ProtectedRoute fallback="modal">
                  <StudioProjectsDashboard />
                </ProtectedRoute>
              } />
              <RouterRoute path="studio/project/:projectId" element={
                <ProtectedRoute fallback="modal">
                  <StudioProjectDetailsPage />
                </ProtectedRoute>
              } />

              {/* Try On Flow (Simple/Light - Single Product) */}
              {/* New URL pattern: /try-on/:productId/upload|progress|result */}
              <RouterRoute path="try-on/:productId/upload" element={<TryOnUploadPage />} />
              <RouterRoute path="try-on/:productId/progress" element={<TryOnProgressPage />} />
              {/* Try-On result requires login - shows modal over blurred result */}
              <RouterRoute path="try-on/:productId/result" element={
                <ProtectedRoute fallback="modal">
                  <TryOnResultPage />
                </ProtectedRoute>
              } />
              {/* Backward compatibility: redirect old URLs to explore */}
              <RouterRoute path="try-on" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="try-on/upload" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="try-on/progress" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="try-on/result" element={<Navigate to="/explore" replace />} />

              {/* Account & User Space - Protected with modal */}
              <RouterRoute path="account/gallery" element={
                <ProtectedRoute fallback="modal">
                  <AccountGalleryPage />
                </ProtectedRoute>
              } />
              <RouterRoute path="account/gallery/:id" element={
                <ProtectedRoute fallback="modal">
                  <AccountGalleryDetailPage />
                </ProtectedRoute>
              } />
              <RouterRoute path="account/orders" element={
                <ProtectedRoute fallback="modal">
                  <div className="p-20 text-center">{siteText("صفحه سفارش‌ها (بزودی)")}</div>
                </ProtectedRoute>
              } />
              <RouterRoute path="account/settings" element={
                <ProtectedRoute fallback="modal">
                  <div className="p-20 text-center">{siteText("تنظیمات حساب (بزودی)")}</div>
                </ProtectedRoute>
              } />
            </RouterRoute>
          </RouterRoutes>
          </Suspense>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
