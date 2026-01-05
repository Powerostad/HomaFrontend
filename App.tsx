import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes as RouterRoutes, Route as RouterRoute, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./layout/Layout";

// Import Pages directly instead of lazy to prevent "white screen" hydration issues in this environment
import { ProductLandingPage } from "./pages/ProductLanding/Page";
import { UploadPage } from "./pages/Upload/Page";
import { GalleryPage } from "./pages/Gallery";
import { PrecheckPage } from "./pages/Precheck";
import { ProcessingPage } from "./pages/Processing";
import { ConfirmationPage } from "./pages/Confirmation";
import { VisualizationPage } from "./pages/Visualization";
import { ErrorPage } from "./pages/Error";
import { ProductFallbackPage } from "./pages/ProductFallback";
import { CollaborationPage } from "./pages/Collaboration/Page";
import { StudioUploadPage } from "./pages/Studio/UploadPage";
import { StudioProgressPage } from "./pages/Studio/ProgressPage";
import { StudioResultPage } from "./pages/Studio/ResultPage";
import { StudioProjectsDashboard } from "./pages/Studio/ProjectsDashboard";
import { StudioProjectDetailsPage } from "./pages/Studio/ProjectDetailsPage";
import { ExplorePage } from "./pages/Explore";
import { StorePage } from "./pages/Store";
import { ProductDetailsPage } from "./pages/ProductDetails";
import { ContactPage } from "./pages/Contact/Page";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomaLoader } from "./components/HomaLoader";

// Try On Flow
import { TryOnUploadPage } from "./pages/TryOn/UploadPage";
import { TryOnProgressPage } from "./pages/TryOn/ProgressPage";
import { TryOnResultPage } from "./pages/TryOn/ResultPage";

// Account & Gallery
import AccountGalleryPage from "./pages/Account/GalleryPage";
import AccountGalleryDetailPage from "./pages/Account/GalleryDetailPage";

// Auth
import { useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import { User } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();

  const handleLogin = () => {
    // Simulate login
    setUser({ name: 'کاربر هُما', phone: '۰۹۱۲۰۰۰۰۰۰۰' });
    navigate(-1); // Go back to where they were
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-10 bg-card border border-border rounded-md shadow-elevation-lg text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <User size={32} strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-h2 font-bold text-foreground">ورود به هُما</h2>
          <p className="text-muted-foreground leading-relaxed">
            برای ذخیره نتایج Try-On و دسترسی به گالری و پروژه‌ها وارد شوید.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleLogin}
            className="w-full h-14 bg-accent text-accent-foreground rounded-button font-bold transition-transform active:scale-95 shadow-lg shadow-accent/20"
          >
            ورود / ثبت‌نام
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="text-label font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            بعداً
          </button>
        </div>

        <p className="text-caption text-muted-foreground/60">
          ورود کمتر از یک دقیقه زمان می‌برد.
        </p>
      </div>
    </div>
  );
};

// Loading Component - Now using HOMA Loader
const PageLoader = () => <HomaLoader />;

export default function App() {
  return (
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
              <RouterRoute path="contact" element={<ContactPage />} />
              
              {/* Studio Flow (Complex/Dark) */}
              <RouterRoute path="studio/start" element={<Navigate to="/studio/upload" replace />} />
              <RouterRoute path="studio/upload" element={<StudioUploadPage />} />
              <RouterRoute path="studio/progress" element={<StudioProgressPage />} />
              <RouterRoute path="studio/result/:jobId" element={<StudioResultPage />} />
              <RouterRoute path="studio/projects" element={<StudioProjectsDashboard />} />
              <RouterRoute path="studio/project/:projectId" element={<StudioProjectDetailsPage />} />

              {/* Try On Flow (Simple/Light - Single Product) */}
              <RouterRoute path="try-on" element={<TryOnUploadPage />} />
              <RouterRoute path="try-on/upload" element={<TryOnUploadPage />} />
              <RouterRoute path="try-on/progress" element={<TryOnProgressPage />} />
              <RouterRoute path="try-on/result" element={<TryOnResultPage />} />

              {/* Account & User Space */}
              <RouterRoute path="login" element={<LoginPage />} />
              <RouterRoute path="account/gallery" element={<AccountGalleryPage />} />
              <RouterRoute path="account/gallery/:id" element={<AccountGalleryDetailPage />} />
              <RouterRoute path="account/orders" element={<div className="p-20 text-center">صفحه سفارش‌ها (بزودی)</div>} />
              <RouterRoute path="account/settings" element={<div className="p-20 text-center">تنظیمات حساب (بزودی)</div>} />
            </RouterRoute>
          </RouterRoutes>
        </Suspense>
      </AppProvider>
    </Router>
  );
}