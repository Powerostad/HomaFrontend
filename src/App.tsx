const BlogPage = lazy(() => import("./blog/BlogPage").then(m => ({ default: m.BlogPage })));
import { useSiteTranslation } from '@/i18n/siteCopy';
import { lazy, Suspense } from "react";
import { Navigate, BrowserRouter as Router, Route as RouterRoute, Routes as RouterRoutes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./layout/Layout";

// Keep the existing loading boundary while loading page code only when its route is used.
import { HomaLoader } from "./components/HomaLoader";
import { ScrollToTop } from "./components/ScrollToTop";
const BasketPage = lazy(() => import("./pages/Basket").then(m => ({ default: m.BasketPage })));
const CollaborationPage = lazy(() => import("./pages/Collaboration/Page").then(m => ({ default: m.CollaborationPage })));
const ConfirmationPage = lazy(() => import("./pages/Confirmation").then(m => ({ default: m.ConfirmationPage })));
const ContactPage = lazy(() => import("./pages/Contact/Page").then(m => ({ default: m.ContactPage })));
const ErrorPage = lazy(() => import("./pages/Error").then(m => ({ default: m.ErrorPage })));

const FAQPage = lazy(() => import("./pages/FAQ/Page").then(m => ({ default: m.FAQPage })));

import { InformationPage } from "./pages/Information/Page";
const PrecheckPage = lazy(() => import("./pages/Precheck").then(m => ({ default: m.PrecheckPage })));
const ProcessingPage = lazy(() => import("./pages/Processing").then(m => ({ default: m.ProcessingPage })));

const ProductFallbackPage = lazy(() => import("./pages/ProductFallback").then(m => ({ default: m.ProductFallbackPage })));
import { HostsLandingPage } from './pages/ProductLanding/HostsPage';
import { ProductLandingPage } from "./pages/ProductLanding/Page";
import { PublicShowcase } from "./pages/Explore/PublicShowcase";
const StudioProgressPage = lazy(() => import("./pages/Studio/ProgressPage").then(m => ({ default: m.StudioProgressPage })));
const StudioProjectDetailsPage = lazy(() => import("./pages/Studio/ProjectDetailsPage").then(m => ({ default: m.StudioProjectDetailsPage })));
const StudioProjectsDashboard = lazy(() => import("./pages/Studio/ProjectsDashboard").then(m => ({ default: m.StudioProjectsDashboard })));
const StudioResultPage = lazy(() => import("./pages/Studio/ResultPage").then(m => ({ default: m.StudioResultPage })));
const StudioUploadPage = lazy(() => import("./pages/Studio/UploadPage").then(m => ({ default: m.StudioUploadPage })));
const UploadPage = lazy(() => import("./pages/Upload/Page").then(m => ({ default: m.UploadPage })));
const VisualizationPage = lazy(() => import("./pages/Visualization").then(m => ({ default: m.VisualizationPage })));

// Try On Flow
const TryOnProgressPage = lazy(() => import("./pages/TryOn/ProgressPage").then(m => ({ default: m.TryOnProgressPage })));
const TryOnResultPage = lazy(() => import("./pages/TryOn/ResultPage").then(m => ({ default: m.TryOnResultPage })));
const TryOnUploadPage = lazy(() => import("./pages/TryOn/UploadPage").then(m => ({ default: m.TryOnUploadPage })));

// Room Redesign Flow (conversational recommendations - live chat backend)
const RoomRedesignPage = lazy(() => import("./pages/RoomRedesign/RoomRedesignPage").then(m => ({ default: m.RoomRedesignPage })));
const StudioStartPage = lazy(() => import("./pages/RoomRedesign/intake/StudioStartPage").then(m => ({ default: m.StudioStartPage })));

// Account & Gallery
const AccountGalleryDetailPage = lazy(() => import("./pages/Account/GalleryDetailPage"));
const AccountGalleryPage = lazy(() => import("./pages/Account/GalleryPage"));

// Shared (public)
const SharedPage = lazy(() => import("./pages/Shared/SharedPage"));


// Loading Component - Now using HOMA Loader
const PageLoader = () => <HomaLoader />;
// Preview is compiled out of production and can only be activated on loopback.
const LocalStudioPreview = import.meta.env.DEV && import.meta.env.VITE_LOCAL_STUDIO_PREVIEW === 'true'
  && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  ? lazy(() => import('./pages/Studio/dev/LocalStudioPreview')) : null;
const LocalStudioCompare = import.meta.env.DEV && import.meta.env.MODE === 'studio-local'
  && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  ? lazy(() => import('./pages/StudioCompare/StudioComparePage')) : null;

const LocalModelCompare = LocalStudioCompare ? lazy(() => import('./pages/StudioCompare/ModelComparePage')) : null;
const LocalDiscoveryPreview = (LocalStudioCompare || LocalStudioPreview) ? lazy(() => import('./pages/Studio/dev/DiscoveryPreview')) : null;
const LocalCatalogue = LocalStudioCompare ? lazy(() => import('./pages/Catalogue/CataloguePage')) : null;

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
              <RouterRoute index element={LocalStudioPreview ? <Navigate to="/studio" replace /> : <ProductLandingPage />} />
              <RouterRoute path="hosts" element={<HostsLandingPage />} />
              <RouterRoute path="gallery" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="explore" element={<PublicShowcase />} />
              <RouterRoute path="shop" element={<PublicShowcase />} /> {/* Alias for ExplorePage */}
              <RouterRoute path="upload" element={<UploadPage />} />
              <RouterRoute path="precheck" element={<PrecheckPage />} />
              <RouterRoute path="processing" element={<ProcessingPage />} />
              <RouterRoute path="confirmation" element={<ConfirmationPage />} />
              <RouterRoute path="result" element={<VisualizationPage />} />
              <RouterRoute path="error" element={<ErrorPage />} />
              <RouterRoute path="product-not-found" element={<ProductFallbackPage />} />
              <RouterRoute path="collaboration" element={<CollaborationPage />} />
              <RouterRoute path="store/:slug" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="store/:slug/product/:productId" element={<Navigate to="/explore" replace />} />
              <RouterRoute path="basket" element={<BasketPage />} />
              <RouterRoute path="contact" element={<ContactPage />} />
              <RouterRoute path="faq" element={<FAQPage />} />
              <RouterRoute path="support" element={<InformationPage page="support" />} />
              <RouterRoute path="privacy" element={<InformationPage page="privacy" />} />
              <RouterRoute path="terms" element={<InformationPage page="terms" />} />

              {/* Shared gallery items (public, no auth) */}
              <RouterRoute path="s/:token" element={<SharedPage />} />

              {/* Legacy chat URLs remain available for existing sessions. */}
              <RouterRoute path="redesign/:sessionId?" element={
                <ProtectedRoute fallback="modal">
                  <RoomRedesignPage />
                </ProtectedRoute>
              } />

              {/* Studio now starts the existing conversational flow. Legacy jobs remain accessible. */}
              <RouterRoute path="studio" element={
                LocalStudioPreview ? <LocalStudioPreview /> : <StudioStartPage />
              } />
              <RouterRoute path="studio/hosts" element={<StudioStartPage host />} />
              {LocalDiscoveryPreview && <RouterRoute path="studio/preview" element={<LocalDiscoveryPreview />} />}
              {LocalCatalogue && <RouterRoute path="studio/catalogue" element={<ProtectedRoute fallback="modal"><LocalCatalogue /></ProtectedRoute>} />}
              <RouterRoute path="blog/*" element={<BlogPage />} />
              {LocalModelCompare && <RouterRoute path="studio/model-compare" element={<ProtectedRoute fallback="modal"><LocalModelCompare /></ProtectedRoute>} />}
              {(import.meta.env.DEV || import.meta.env.VITE_IMAGE_FIRST_ENABLED === 'true') && <RouterRoute path="studio/accommodation-test" element={<Navigate to="/studio?room=accommodation_test" replace />} />}
              {LocalStudioCompare && <RouterRoute path="studio/compare" element={<ProtectedRoute fallback="modal"><LocalStudioCompare /></ProtectedRoute>} />}
              <RouterRoute path="studio/chat/:sessionId" element={
                LocalStudioPreview ? <LocalStudioPreview /> : <StudioStartPage />
              } />
              <RouterRoute path="studio/start" element={<Navigate to="/studio" replace />} />
              <RouterRoute path="studio/upload" element={<StudioUploadPage />} />
              <RouterRoute path="studio/progress" element={<StudioProgressPage />} />
              <RouterRoute path="studio/result/:jobId" element={<StudioResultPage />} />
              {/* Studio Projects - requires login */}
              <RouterRoute path="studio/projects" element={
                LocalStudioPreview ? <Navigate to="/studio" replace /> : <ProtectedRoute fallback="modal">
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
