import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth, useUpload } from '../../context/AppProviders';
import { Header } from '../../components/Header';
import { AuthModal } from '../../components/AuthModal';
import {
  submitVisualizationTask,
  pollTaskStatus,
  type TaskStatus,
} from '../../services/visualizationService';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { loadFromStorage, STORAGE_KEYS, type StoredTryOnResult } from '../../utils/storageUtils';
import { getStoredTokens, setStoredTokens } from '../../utils/apiClient';
import { toast } from 'sonner';
import type { User } from '../../context/AuthContext';

export function TryOnProgressPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { t } = useTranslation();
  const { isLoggedIn, login } = useAuth();

  /**
   * Progress phases shown during AI processing
   * Each phase represents a stage of the visualization pipeline
   */
  const PHASES = [
    {
      h1: t('tryOn.progress.phase1Title', "داریم فضای خونه‌ت رو می‌فهمیم…"),
      body: t('tryOn.progress.phase1Body', "نور، مقیاس و حال‌وهوای فضا"),
      micro: t('tryOn.progress.phase1Micro', "درک فضا")
    },
    {
      h1: t('tryOn.progress.phase2Title', "داریم محصول رو تو فضا می‌چینیم…"),
      body: t('tryOn.progress.phase2Body', "با رعایت ابعاد و سایه‌زنی دقیق"),
      micro: t('tryOn.progress.phase2Micro', "تطبیق محصول")
    },
    {
      h1: t('tryOn.progress.phase3Title', "داریم بهترین تصویر رو برات می‌سازیم…"),
      body: t('tryOn.progress.phase3Body', "تا ببینی چقدر به خونت میاد"),
      micro: t('tryOn.progress.phase3Micro', "ساخت نتیجه")
    }
  ];
  const {
    selectedFile,
    getSelectedFile,
    getSelectedSize,
    processingStatus,
    setProcessingStatus,
    processingProgress,
    setProcessingProgress,
    processingError,
    setProcessingError,
    setVisualizedImageUrl,
    setResultImageId,
    setResultImagePath,
    currentTaskId,
    setCurrentTaskId,
    resetProcessing,
  } = useUpload();

  const [phase, setPhase] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const hasStartedRef = useRef(false);

  // Navigation guard - warn user before leaving during processing
  const isProcessing = processingStatus === 'uploading' || processingStatus === 'processing';
  useNavigationGuard(isProcessing);

  /**
   * Handle back button case - if processing already completed, redirect to result
   * This handles the case where user presses back from result page
   */
  useEffect(() => {
    if (processingStatus === 'completed' && productId) {
      // Check if we have stored result info
      const storedResult = loadFromStorage<StoredTryOnResult>(STORAGE_KEYS.TRYON_RESULT);

      if (storedResult) {
        // Redirect back to result page with params (productId now in URL path)
        const params = new URLSearchParams();
        params.set('resultId', String(storedResult.id));
        params.set('path', storedResult.path);

        navigate(`/try-on/${productId}/result?${params.toString()}`, { replace: true });
      }
    }
  }, [processingStatus, productId, navigate]);

  /**
   * Task recovery - resume polling for existing task on page reload
   * This handles the case where user refreshes page during processing
   */
  useEffect(() => {
    if (currentTaskId && processingStatus === 'idle' && !hasStartedRef.current) {
      console.log('[Progress] Resuming polling for task:', currentTaskId);
      hasStartedRef.current = true;
      resumePolling(currentTaskId);
    }
  }, [currentTaskId, processingStatus]);

  /**
   * Resume polling for an existing task
   */
  const resumePolling = async (taskId: string) => {
    setProcessingStatus('processing');

    const result = await pollTaskStatus(taskId, (status: TaskStatus) => {
      if (status === 'processing') {
        setProcessingStatus('processing');
      }
    });

    if (result.success && result.data) {
      setProcessingStatus('completed');
      setVisualizedImageUrl(result.data.imageUrl);
      setResultImageId(result.data.imageId);
      setResultImagePath(result.data.imagePath);
      setCurrentTaskId(null);  // Clear task after completion

      const params = new URLSearchParams();
      params.set('resultId', String(result.data.imageId));
      params.set('path', result.data.imagePath);
      navigate(`/try-on/${productId}/result?${params.toString()}`);
    } else {
      setProcessingStatus('error');
      setProcessingError(result.error || t('tryOn.errors.processingFailed'));
      setCurrentTaskId(null);
    }
  };

  // Load background image from selected file
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setBgImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  // Phase animation timer
  useEffect(() => {
    if (processingStatus === 'error') return;

    const phaseInterval = setInterval(() => {
      setPhase((p) => {
        if (p < 2) return p + 1;
        return p;
      });
    }, 3000);

    return () => clearInterval(phaseInterval);
  }, [processingStatus]);

  // Start processing when component mounts
  // IMPORTANT: Check file BEFORE auth to detect file loss early
  useEffect(() => {
    // Prevent double execution in strict mode
    if (hasStartedRef.current) return;

    // Validate productId from URL
    if (!productId) {
      toast.error(t('errors.productNotFound'));
      navigate('/explore');
      return;
    }

    // Get file synchronously from ref (handles race condition with navigation)
    // Check file FIRST before showing auth modal
    const file = getSelectedFile();

    // Need file to process - redirect if missing
    if (!file) {
      console.warn('[Progress] Missing file, redirecting to upload');
      toast.error(t('tryOn.progress.fileNotSelected'));
      navigate(`/try-on/${productId}/upload`);
      return;
    }

    // Check if user is logged in AFTER confirming file exists
    // This ensures we don't lose the file check when user authenticates
    if (!isLoggedIn) {
      setShowAuth(true);
      return;  // handleAuthSuccess will start processing after login
    }

    hasStartedRef.current = true;
    // Use productId from URL directly (no need for context product)
    startProcessing(productId);
    // Note: isLoggedIn removed from dependencies to prevent re-runs on login
    // handleAuthSuccess handles starting processing after authentication
  }, [selectedFile, productId, getSelectedFile, navigate]);

  /**
   * Start the AI visualization processing (two-phase async flow)
   * Phase 1: Submit task and get task_id
   * Phase 2: Poll for completion
   */
  const startProcessing = async (productUniqueLink: string) => {
    const file = getSelectedFile();
    if (!file) {
      console.error('[Progress] File not found when starting processing');
      toast.error(t('tryOn.progress.fileNotSelected'));
      navigate(`/try-on/${productUniqueLink}/upload`);
      return;
    }

    // Get size synchronously from ref (handles navigation race condition)
    const currentSize = getSelectedSize();
    console.log('[Progress] Starting processing with selectedSize:', currentSize);

    setProcessingStatus('uploading');
    setProcessingProgress(0);
    setProcessingError(null);

    try {
      // Phase 1: Submit task
      const submitResult = await submitVisualizationTask(
        productUniqueLink,
        file,
        (progress) => {
          setProcessingProgress(progress);
          // Switch to processing phase after upload completes
          if (progress >= 100) {
            setProcessingStatus('processing');
          }
        },
        currentSize || undefined
      );

      if (!submitResult.success || !submitResult.taskId) {
        setProcessingStatus('error');
        setProcessingError(submitResult.error || t('tryOn.errors.processingFailed'));
        return;
      }

      // Store task ID for recovery
      setCurrentTaskId(submitResult.taskId);
      setProcessingStatus('processing');

      // Phase 2: Poll for completion
      const result = await pollTaskStatus(submitResult.taskId, (status: TaskStatus) => {
        console.log('[Progress] Task status:', status);
      });

      if (result.success && result.data) {
        setProcessingStatus('completed');
        setVisualizedImageUrl(result.data.imageUrl);
        setResultImageId(result.data.imageId);
        setResultImagePath(result.data.imagePath);
        setCurrentTaskId(null);  // Clear task after completion

        // Navigate to result page with productId in URL path
        const params = new URLSearchParams();
        params.set('resultId', String(result.data.imageId));
        params.set('path', result.data.imagePath);

        navigate(`/try-on/${productUniqueLink}/result?${params.toString()}`);
      } else {
        setProcessingStatus('error');
        setProcessingError(result.error || t('tryOn.errors.processingFailed'));
        setCurrentTaskId(null);
      }
    } catch (error) {
      console.error('[Progress] Processing error:', error);
      setProcessingStatus('error');
      setProcessingError(t('errors.unknown'));
      setCurrentTaskId(null);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    hasStartedRef.current = false;
    resetProcessing();
    setCurrentTaskId(null);  // Clear any stale task ID

    // Re-trigger processing using productId from URL
    const file = getSelectedFile();
    if (productId && file) {
      hasStartedRef.current = true;
      startProcessing(productId);
    } else if (!file) {
      toast.error(t('tryOn.progress.fileNotSelected'));
      navigate(`/try-on/${productId}/upload`);
    }
  };

  /**
   * Handle successful authentication
   * Ensures tokens are stored before starting processing to avoid race conditions
   */
  const handleAuthSuccess = (
    userData: User,
    tokens: { access: string; refresh: string }
  ) => {
    // Store tokens directly FIRST to ensure they're available for API calls
    // This is a safeguard against race conditions with the login() context function
    setStoredTokens(tokens);
    console.log('[Progress] Tokens stored directly, verifying...', !!getStoredTokens()?.access);

    // Then update React state via context
    login(userData, tokens);
    setShowAuth(false);

    // Use queueMicrotask to ensure all synchronous operations complete
    // before starting processing (belt-and-suspenders approach)
    queueMicrotask(() => {
      const storedTokens = getStoredTokens();
      console.log('[Progress] After microtask, tokens available:', !!storedTokens?.access);

      if (!storedTokens?.access) {
        console.error('[Progress] CRITICAL: Tokens not found after login!');
        toast.error(t('tryOn.progress.authError'));
        return;
      }

      // Start processing after auth using productId from URL
      const file = getSelectedFile();
      if (productId && file && !hasStartedRef.current) {
        hasStartedRef.current = true;
        startProcessing(productId);
      } else if (!file) {
        toast.error(t('tryOn.progress.fileNotSelected'));
        navigate(`/try-on/${productId}/upload`);
      }
    });
  };

  /**
   * Handle auth modal close without completing
   */
  const handleAuthClose = () => {
    setShowAuth(false);
    // Go back to upload if user cancels auth
    navigate(`/try-on/${productId}/upload`);
  };

  // Error state UI
  if (processingStatus === 'error') {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {bgImage ? (
            <>
              <img
                src={bgImage}
                alt="Background"
                className="w-full h-full object-cover blur-[80px] scale-110 opacity-40"
              />
              <div className="absolute inset-0 bg-white/60" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-200" />
          )}
        </div>

        <Header theme="light" disableNavigation={true} />

        {/* Error Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>

          <h1 className="text-[24px] font-bold text-black mb-3">
            {t('tryOn.errors.processingFailed')}
          </h1>

          <p className="text-[15px] text-black/60 mb-8 leading-relaxed">
            {processingError || t('errors.tryAgain')}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              onClick={handleRetry}
              className="h-14 bg-black text-white text-[14px] font-bold uppercase tracking-[0.1em] hover:bg-black/90 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCw size={18} />
              <span>{t('common.retry')}</span>
            </button>

            <button
              onClick={() => navigate(`/try-on/${productId}/upload`)}
              className="h-14 bg-white border border-black/10 text-black text-[14px] font-medium hover:bg-black/[0.02] transition-all"
            >
              {t('tryOn.tryAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal processing UI
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

      {/* --- Center Stack --- */}
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
                duration: 3,
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

        {/* Upload Progress Bar (shown during upload phase) */}
        {processingStatus === 'uploading' && processingProgress > 0 && (
          <div className="w-full max-w-[200px] mb-4">
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${processingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[11px] text-black/40 mt-2">
              {t('tryOn.progress.uploadPercent', { percent: Math.round(processingProgress) })}
            </p>
          </div>
        )}

        {/* ETA */}
        <div className="text-[12px] font-medium text-black/50 dark:text-white/50">
          {t('tryOn.progress.eta', "معمولاً کمتر از ۳۰ ثانیه")}
        </div>

      </div>

      {/* AUTH MODAL - Appears if user not logged in */}
      <AuthModal
        isOpen={showAuth}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
