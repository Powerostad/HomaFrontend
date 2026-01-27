import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Header } from '../../components/Header';
import { ContextBar } from '../../components/ContextBar';
import { DecisionPointOverlay } from '../../components/DecisionPointOverlay';
import { AuthModal } from '../../components/AuthModal';
import { toast } from 'sonner';
import { saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';
import { fetchImageAsFile } from '../../utils/imageUtils';

export function StudioUploadPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setSelectedFile, trackKPI } = useApp();
  const { startSession, isCreatingSession, clearActiveSession } = useStudio();
  const { isLoggedIn, login } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setLocalSelectedFile] = useState<File | null>(null);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [loadingPresetId, setLoadingPresetId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EXAMPLES = {
    good: {
      label: t('tryOn.upload.goodExample'),
      image: 'https://images.unsplash.com/photo-1581209410127-8211e90da024?q=80&w=800',
      caption: t('tryOn.upload.goodCaption')
    },
    bad: {
      label: t('tryOn.upload.badExample'),
      reason: t('tryOn.upload.badReason'),
      image: 'https://images.unsplash.com/photo-1715366843673-f21a95ec11cc?q=80&w=800',
      caption: t('tryOn.upload.badCaption')
    }
  };

  const PRESETS = [
    { id: 1, name: 'پذیرایی مدرن', image: 'https://images.unsplash.com/photo-1581209410127-8211e90da024?q=80&w=400' },
    { id: 2, name: 'اتاق خواب روشن', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=400' },
    { id: 3, name: 'نشیمن گرم', image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=400' },
    { id: 4, name: 'فضای ناهارخوری', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=400' },
  ];

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      trackKPI('upload_started', { fileName: file.name, fileSize: file.size });
      setSelectedFile(file);
      setLocalSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setShowDecision(true);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle preset image selection
   * Fetches the image URL, converts to File, and triggers the same flow as file upload
   */
  const handlePresetSelect = async (preset: { id: number; name: string; image: string }) => {
    // Prevent double-clicks
    if (isLoadingPreset) return;

    setIsLoadingPreset(true);
    setLoadingPresetId(preset.id);

    // Track KPI for preset selection (distinct from manual upload)
    trackKPI('preset_selected', { presetId: preset.id, presetName: preset.name });

    // Fetch and convert to File
    const result = await fetchImageAsFile(
      preset.image,
      `preset-${preset.id}-${preset.name.replace(/\s+/g, '-')}.jpg`
    );

    if (!result.success) {
      setIsLoadingPreset(false);
      setLoadingPresetId(null);
      toast.error(result.error);
      return;
    }

    const file = result.file;

    // Set file in state (same as handleFile)
    setSelectedFile(file);
    setLocalSelectedFile(file);

    // Set preview (use original URL for faster display)
    setPreview(preset.image);
    setShowDecision(true);

    setIsLoadingPreset(false);
    setLoadingPresetId(null);
  };

  /**
   * Proceed with the upload process
   * @param skipAuthCheck - Set to true when called from auth success callback
   *                        (user just authenticated, but isLoggedIn state hasn't updated yet)
   */
  const handleProceed = async (skipAuthCheck = false) => {
    if (!selectedFile) {
      toast.error(t('tryOn.errors.noImage'));
      return;
    }

    // Check if user is logged in before proceeding
    // Skip this check if we just came from successful authentication
    if (!skipAuthCheck && !isLoggedIn) {
      setShowDecision(false); // Close decision overlay first
      setShowAuthModal(true);
      return;
    }

    trackKPI('upload_confirmed');

    // Clear any previous session state
    clearActiveSession();
    setUploadProgress(0);

    // Start the session with API call
    const result = await startSession(selectedFile, (progress) => {
      setUploadProgress(progress);
    });

    if (result.success && result.sessionId) {
      // Save sessionId to storage for recovery on page reload
      saveToStorage(STORAGE_KEYS.STUDIO_SESSION_ID, result.sessionId);

      // Navigate to progress page with sessionId in URL for recovery
      navigate(`/studio/progress?sessionId=${result.sessionId}`);
    } else {
      // Check if error is auth-related (401 or session expired message)
      const isAuthError = result.error?.includes('منقضی شده') ||
                          result.error?.includes('وارد شوید');

      if (isAuthError) {
        // Show auth modal for re-authentication
        setShowDecision(false);
        setShowAuthModal(true);
      } else {
        // Show error toast for other errors
        toast.error(result.error || t('errors.resultFailed'));
      }
    }
  };

  return (
    <div className="h-screen bg-[#FDFDFB] flex flex-col overflow-hidden relative" dir="rtl">
      
      {/* 1. HEADER & BREADCRUMBS */}
      <div className="relative z-[110] shrink-0 bg-[#FDFDFB]">
        <Header />
        <div className="block"> {/* Removed hidden md:block to show on mobile */}
          <ContextBar
            items={[
              { label: t('nav.home'), href: '/' },
              { label: t('nav.studio'), href: '/studio' },
              { label: t('tryOn.upload.title') }
            ]}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto relative z-10 overflow-y-auto pb-64 scrollbar-hide">
        
        {/* 2. HERO AREA - Editorial Title with Spacing */}
        <div className="px-6 md:px-16 pt-2 pb-3"> {/* Reduced pt-6 to pt-2 to stick closer to header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1 opacity-40">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">HOMA STUDIO</span>
              <div className="w-1 h-1 rounded-full bg-black" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">هوش مصنوعی</span>
            </div>
            <h1 className="text-[28px] md:text-[34px] font-medium text-black tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              آپلود تصویر 
            </h1>
            <div className="h-px w-full bg-black/[0.05]" />
          </div>
        </div>

        {/* 3. TEACHING SECTION - Editorial Layout (Restored Aspect Ratio) */}
        <div className="px-6 md:px-16 mb-20 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* GOOD EXAMPLE */}
            <div className="space-y-6">
              <div className="relative aspect-[3/2] bg-white overflow-hidden">
                <ImageWithFallback src={EXAMPLES.good.image} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 border border-black/10">
                  <span className="text-[10px] font-medium text-black uppercase tracking-wider">مطلوب</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[12px] text-black/50 leading-none">مطلوب: {EXAMPLES.good.caption}</p>
              </div>
            </div>

            {/* BAD EXAMPLE */}
            <div className="space-y-6">
              <div className="relative aspect-[3/2] bg-white overflow-hidden">
                <ImageWithFallback src={EXAMPLES.bad.image} className="w-full h-full object-cover grayscale-[0.3]" />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 border border-black/10">
                  <span className="text-[10px] font-medium text-black/40 uppercase tracking-wider">نامناسب</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[12px] text-black/50 leading-none">نامناسب: {EXAMPLES.bad.caption}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="px-6 md:px-16 mb-20">
          <div className="h-px w-full bg-black/[0.05]" />
        </div>

        {/* 4. PRESETS SECTION - Catalog Grid */}
        <div id="presets-section" className="px-6 md:px-16 mb-24 mt-4">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-[18px] font-medium text-black tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>فضاهای آماده</h2>
            <button className="text-[11px] font-medium text-black/40 border-b border-black/10 hover:text-black transition-colors uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              مشاهده همه
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {PRESETS.map(preset => (
              <div
                key={preset.id}
                className={`group cursor-pointer space-y-3 ${isLoadingPreset && loadingPresetId !== preset.id ? 'pointer-events-none opacity-50' : ''}`}
                onClick={() => !isLoadingPreset && handlePresetSelect(preset)}
              >
                <div className="relative aspect-[4/5] bg-white overflow-hidden">
                  <ImageWithFallback src={preset.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {/* Overlay - show loading spinner or select label */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                    loadingPresetId === preset.id
                      ? 'bg-black/30 opacity-100'
                      : 'bg-black/5 opacity-0 group-hover:opacity-100'
                  }`}>
                    {loadingPresetId === preset.id ? (
                      <div className="bg-white text-black text-[10px] font-bold px-4 py-2 uppercase tracking-widest flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>در حال بارگذاری...</span>
                      </div>
                    ) : (
                      <span className="bg-white text-black text-[10px] font-bold px-4 py-2 uppercase tracking-widest">
                        انتخاب
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-[11px] text-black/60 uppercase tracking-widest text-center">{preset.name}</h3>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* 5. STICKY BOTTOM ACTION BAR - Zara Home Hierarchy */}
      <div className="fixed bottom-0 left-0 right-0 py-6 px-6 md:px-16 bg-[#FDFDFB]/95 backdrop-blur-md border-t border-black/[0.03] z-[120]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-4">
          
          <div className="w-full max-w-[420px] flex flex-col items-center gap-4">
            {/* Primary Actions: Side by Side Grid */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 bg-black text-white text-[12px] font-medium uppercase tracking-[0.1em] hover:bg-black/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                  <Camera size={16} strokeWidth={1.5} />
                  <span>گرفتن عکس</span>
              </button>

              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 bg-white border border-black/10 text-black text-[12px] font-medium uppercase tracking-[0.1em] hover:bg-black/[0.02] transition-all active:scale-[0.98] flex items-center justify-center"
              >
                  <span>گالری</span>
              </button>
            </div>

            {/* Tertiary: Minimal Text Link */}
            <button 
              onClick={() => {
                const presetsSection = document.getElementById('presets-section');
                presetsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-medium text-black/50 hover:text-black transition-all flex items-center gap-2"
              style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
            >
              <span>اگر تصویر مناسبی ندارید، از نمونه‌های آماده استفاده کنید</span>
              <ArrowLeft size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* DECISION POINT OVERLAY */}
      <DecisionPointOverlay
        isOpen={showDecision}
        onClose={() => !isCreatingSession && setShowDecision(false)}
        title={isCreatingSession ? "در حال آپلود..." : "تصویر شما آماده است"}
        description={
          isCreatingSession
            ? `${uploadProgress}% آپلود شده`
            : "لطفاً تایید کنید که تصویر انتخابی شفاف و دارای نور کافی است."
        }
        image={preview || undefined}
        primaryCTA={{
          label: isCreatingSession ? "در حال ارسال..." : "تایید",
          onClick: handleProceed,
          icon: isCreatingSession ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />,
          disabled: isCreatingSession
        }}
        secondaryCTA={{
          label: "انتخاب مجدد",
          onClick: () => {
            setShowDecision(false);
            fileInputRef.current?.click();
          },
          icon: <Camera size={18} />,
          disabled: isCreatingSession
        }}
        exitAction={{
          label: "انصراف",
          onClick: () => {
            if (!isCreatingSession) {
              setShowDecision(false);
              setPreview(null);
            }
          }
        }}
        type="accent"
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, tokens) => {
          login(user, tokens);
          setShowAuthModal(false);
          // After login, automatically proceed with the upload
          // Pass skipAuthCheck=true because user just authenticated
          // but React state (isLoggedIn) hasn't updated yet
          handleProceed(true);
        }}
      />
    </div>
  );
}