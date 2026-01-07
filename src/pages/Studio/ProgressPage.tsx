import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUpload } from '../../context/AppProviders';
import { useStudio } from '../../context/StudioContext';
import { Header } from '../../components/Header';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';
import { fetchSessionStatus, type SessionStatus } from '@/services/studioService';

const PHASES = [
  {
    h1: "داریم فضای خونه‌ت رو می‌فهمیم…",
    body: "نور، مقیاس و حال‌وهوای فضا",
    micro: "درک فضا"
  },
  {
    h1: "داریم بررسی می‌کنیم این فضا می‌تونه چی بشه…",
    body: "با انتخاب‌هایی که به سبکِ فضا می‌خوره",
    micro: "هماهنگی سبک"
  },
  {
    h1: "داریم بهترین چیدمان رو برات می‌سازیم…",
    body: "تا انتخاب و خرید، ساده‌تر بشه",
    micro: "ساخت نتیجه"
  }
];

/**
 * Map session status from API to UI phase index
 */
function statusToPhase(status: SessionStatus | null): number {
  switch (status) {
    case 'pending':
    case 'analyzing':
      return 0;
    case 'generating':
      return 1;
    case 'matching':
    case 'ready':
      return 2;
    default:
      return 0;
  }
}

export function StudioProgressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedFile, getSelectedFile } = useUpload();
  const {
    activeSessionId,
    setActiveSessionId,
    sessionStatus,
    setSessionStatus,
    pollSession,
    clearActiveSession,
    startSession
  } = useStudio();

  // URL params for recovery
  const urlSessionId = searchParams.get('sessionId');

  const [phase, setPhase] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStartedPolling = useRef(false);
  const hasRecoveredRef = useRef(false);

  // Navigation guard - warn user before leaving during processing
  useNavigationGuard(isPolling || isRecovering);

  // Load background image from selected file
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setBgImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  // Update phase based on session status
  useEffect(() => {
    setPhase(statusToPhase(sessionStatus));
  }, [sessionStatus]);

  /**
   * Session recovery effect - handles page reload scenarios
   * Checks URL params and storage for sessionId, then fetches status from API
   */
  useEffect(() => {
    // Only attempt recovery once
    if (hasRecoveredRef.current) return;
    // Skip if we already have an active session
    if (activeSessionId) return;

    const recoverSession = async () => {
      // Try URL param first, then sessionStorage
      const sessionIdToRecover = urlSessionId || loadFromStorage<string>(STORAGE_KEYS.STUDIO_SESSION_ID);

      if (!sessionIdToRecover) {
        // No session to recover - redirect to upload
        toast.error('جلسه‌ای یافت نشد. لطفا دوباره تصویر آپلود کنید.');
        navigate('/studio/upload');
        return;
      }

      hasRecoveredRef.current = true;
      setIsRecovering(true);
      console.log('[StudioProgress] Recovering session from:', urlSessionId ? 'URL' : 'storage', sessionIdToRecover);

      // Fetch session status from API
      const result = await fetchSessionStatus(sessionIdToRecover);

      setIsRecovering(false);

      if (!result.success) {
        // Session not found or error
        setError(result.error || 'جلسه یافت نشد');
        return;
      }

      const session = result.data!;

      if (session.status === 'ready') {
        // Session already complete - redirect to result
        console.log('[StudioProgress] Session already ready, redirecting to result');
        navigate(`/studio/result/${sessionIdToRecover}`, { replace: true });
        return;
      }

      if (session.status === 'failed') {
        // Session failed - show error
        setError(session.errorMessage || 'پردازش قبلی با خطا مواجه شد');
        return;
      }

      // Session still processing - set active and start polling
      setActiveSessionId(sessionIdToRecover);
      setSessionStatus(session.status);
      // Save to storage for future recovery
      saveToStorage(STORAGE_KEYS.STUDIO_SESSION_ID, sessionIdToRecover);
    };

    recoverSession();
  }, [activeSessionId, urlSessionId, navigate, setActiveSessionId, setSessionStatus]);

  // Start polling when we have an active session
  useEffect(() => {
    // Prevent double polling
    if (hasStartedPolling.current) return;
    // Wait for recovery to complete
    if (isRecovering) return;

    if (!activeSessionId) {
      // Will be handled by recovery effect
      return;
    }

    hasStartedPolling.current = true;
    setIsPolling(true);
    setError(null);

    const startPolling = async () => {
      const result = await pollSession(activeSessionId, (status) => {
        // Status change callback - phase updates via useEffect above
        console.log('Session status changed:', status);
      });

      setIsPolling(false);

      if (result.success && result.session) {
        // Success! Navigate to result page
        navigate(`/studio/result/${activeSessionId}`);
      } else {
        // Error - show retry option
        setError(result.error || 'خطا در پردازش تصویر');
      }
    };

    startPolling();
  }, [activeSessionId, pollSession, navigate, isRecovering]);

  // Handle retry - create a NEW session with the same image
  const handleRetry = async () => {
    // Get file synchronously (ref-based access)
    const file = getSelectedFile();

    if (!file) {
      // No file available - redirect to upload
      toast.error('تصویر یافت نشد. لطفا دوباره آپلود کنید.');
      navigate('/studio/upload');
      return;
    }

    hasStartedPolling.current = false;
    setError(null);
    setIsPolling(true);
    setPhase(0); // Reset phase to beginning

    // Create a NEW session with the same image
    const createResult = await startSession(file);

    if (!createResult.success || !createResult.sessionId) {
      setIsPolling(false);
      setError(createResult.error || 'خطا در ایجاد جلسه جدید');
      return;
    }

    // Poll the NEW session
    const pollResult = await pollSession(createResult.sessionId, (status) => {
      console.log('Retry - Session status changed:', status);
    });

    setIsPolling(false);

    if (pollResult.success && pollResult.session) {
      navigate(`/studio/result/${createResult.sessionId}`);
    } else {
      setError(pollResult.error || 'خطا در پردازش تصویر');
    }
  };

  // Handle go back
  const handleGoBack = () => {
    clearActiveSession();
    navigate('/studio/upload');
  };

  // Recovery loading state
  if (isRecovering) {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">
        <Header theme="light" disableNavigation={true} />
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 size={40} className="animate-spin text-black/30" />
          <p className="text-[14px] text-black/50">در حال بازیابی جلسه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">

      {/* --- Background --- */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <>
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover blur-[80px] scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 mix-blend-overlay" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[20px]" />
      </div>

      <Header theme="light" disableNavigation={true} />

      {/* --- Error State --- */}
      {error && !isPolling && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 text-center">
          <div className="w-[80px] h-[80px] mb-6 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-bold leading-tight tracking-tight text-black dark:text-white mb-3">
            خطا در پردازش
          </h1>
          <p className="text-[14px] sm:text-[16px] font-medium text-black/60 dark:text-white/60 mb-8">
            {error}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleRetry}
              className="h-12 bg-black dark:bg-white text-white dark:text-black text-[13px] font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={18} />
              تلاش مجدد
            </button>
            <button
              onClick={handleGoBack}
              className="h-12 bg-transparent border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 text-[13px] font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              بازگشت و آپلود مجدد
            </button>
          </div>
        </div>
      )}

      {/* --- Processing State --- */}
      {(!error || isPolling) && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 text-center">

          {/* Progress Ring */}
          <div className="relative w-[120px] h-[120px] mb-6 flex items-center justify-center">
            {/* Base Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke="currentColor"
                className="text-black/5 dark:text-white/5"
                strokeWidth="2"
              />
              {/* Animated Ring - Changes per phase */}
              <motion.circle
                key={`ring-${phase}`}
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke="currentColor"
                className="text-black dark:text-white"
                strokeWidth={phase === 0 ? 2 : phase === 1 ? 3 : 4}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 0.3, 0.7, 1],
                  opacity: 1,
                  rotate: phase === 0 ? 0 : phase === 1 ? 180 : 360
                }}
                transition={{
                  duration: 10,
                  ease: "linear",
                  repeat: Infinity
                }}
              />
            </svg>

            {/* Logo in Center */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
               <div className="w-3 h-3 bg-black dark:bg-white rounded-full" />
            </motion.div>
          </div>

          {/* Narrative Text */}
          <div className="h-[140px] flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight text-black dark:text-white mb-2">
                  {PHASES[phase].h1}
                </h1>
                <p className="text-[14px] sm:text-[16px] font-medium text-black/60 dark:text-white/60">
                  {PHASES[phase].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Micro Status */}
          <div className="mt-4 mb-3">
            <AnimatePresence mode="wait">
               <motion.span
                key={`micro-${phase}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="text-[12px] font-medium text-black dark:text-white uppercase tracking-widest"
               >
                 {PHASES[phase].micro}
               </motion.span>
            </AnimatePresence>
          </div>

          {/* ETA */}
          <div className="text-[12px] font-medium text-black/50 dark:text-white/50">
            {sessionStatus === 'pending' && 'در حال شروع...'}
            {sessionStatus === 'analyzing' && 'در حال تحلیل تصویر...'}
            {sessionStatus === 'generating' && 'در حال طراحی...'}
            {sessionStatus === 'matching' && 'در حال یافتن محصولات...'}
            {!sessionStatus && 'معمولاً کمتر از ۳۰ ثانیه'}
          </div>

        </div>
      )}

    </div>
  );
}
