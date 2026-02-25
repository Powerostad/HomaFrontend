import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth, useUpload } from '../../context/AppProviders';
import { Header } from '../../components/Header';
import { AuthModal } from '../../components/AuthModal';
import { ProgressScreen, type ProgressStep } from '../../components/ProgressScreen';
import {
  submitVisualizationTask,
  pollTaskStatus,
  type TaskStatus,
} from '../../services/visualizationService';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { loadFromStorage, STORAGE_KEYS, type StoredTryOnResult } from '../../utils/storageUtils';
import { getStoredTokens, setStoredTokens } from '../../utils/apiClient';
import { trackProcessingStarted, trackProcessingCompleted, trackProcessingFailed } from '../../analytics/events';
import { toast } from 'sonner';
import type { User } from '../../context/AuthContext';

export function TryOnProgressPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { t } = useTranslation();
  const { isLoggedIn, login } = useAuth();

  // 3 steps with sub-messages for TryOn flow
  const STEPS: ProgressStep[] = useMemo(() => [
    {
      label: t('tryOn.progress.step1Label', 'درک فضا'),
      subMessages: [
        { text: t('tryOn.progress.step1Msg1', 'بررسی نور و ابعاد فضا...'), delayMs: 0 },
        { text: t('tryOn.progress.step1Msg2', 'تحلیل حال‌وهوای اتاق...'), delayMs: 2000 },
      ],
      estimatedSec: 8,
    },
    {
      label: t('tryOn.progress.step2Label', 'تطبیق محصول'),
      subMessages: [
        { text: t('tryOn.progress.step2Msg1', 'جایگذاری محصول در فضا...'), delayMs: 0 },
        { text: t('tryOn.progress.step2Msg2', 'تنظیم ابعاد و سایه‌زنی...'), delayMs: 3000 },
      ],
      estimatedSec: 10,
    },
    {
      label: t('tryOn.progress.step3Label', 'ساخت نتیجه'),
      subMessages: [
        { text: t('tryOn.progress.step3Msg1', 'رندر نهایی تصویر...'), delayMs: 0 },
        { text: t('tryOn.progress.step3Msg2', 'بهینه‌سازی کیفیت...'), delayMs: 3000 },
      ],
      estimatedSec: 8,
    },
  ], [t]);

  // 4 rotating tips about product visualization
  const TIPS = useMemo(() => [
    t('tryOn.progress.tip1', 'نور طبیعی بهترین نتیجه رو میده'),
    t('tryOn.progress.tip2', 'هر چه زاویه عکس صاف‌تر باشه، نتیجه واقعی‌تره'),
    t('tryOn.progress.tip3', 'تصویر با کیفیت بالا = نتیجه بهتر'),
    t('tryOn.progress.tip4', 'بعد از دیدن نتیجه، می‌تونی تو گالریت ذخیره‌ش کنی'),
  ], [t]);

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
  const processingStartTimeRef = useRef<number>(0);

  // Navigation guard - warn user before leaving during processing
  const isProcessing = processingStatus === 'uploading' || processingStatus === 'processing';
  useNavigationGuard(isProcessing);

  /**
   * Handle back button case - if processing already completed, redirect to result
   */
  useEffect(() => {
    if (processingStatus === 'completed' && productId) {
      const storedResult = loadFromStorage<StoredTryOnResult>(STORAGE_KEYS.TRYON_RESULT);

      if (storedResult) {
        const params = new URLSearchParams();
        params.set('resultId', String(storedResult.id));
        params.set('path', storedResult.path);

        navigate(`/try-on/${productId}/result?${params.toString()}`, { replace: true });
      }
    }
  }, [processingStatus, productId, navigate]);

  /**
   * Task recovery - resume polling for existing task on page reload
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
      setCurrentTaskId(null);

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

  // Phase animation timer — drives activeStepIndex for ProgressScreen
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
  useEffect(() => {
    if (hasStartedRef.current) return;

    if (!productId) {
      toast.error(t('errors.productNotFound'));
      navigate('/explore');
      return;
    }

    const file = getSelectedFile();

    if (!file) {
      console.warn('[Progress] Missing file, redirecting to upload');
      toast.error(t('tryOn.progress.fileNotSelected'));
      navigate(`/try-on/${productId}/upload`);
      return;
    }

    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    hasStartedRef.current = true;
    startProcessing(productId);
  }, [selectedFile, productId, getSelectedFile, navigate]);

  /**
   * Start the AI visualization processing (two-phase async flow)
   */
  const startProcessing = async (productUniqueLink: string) => {
    const file = getSelectedFile();
    if (!file) {
      console.error('[Progress] File not found when starting processing');
      toast.error(t('tryOn.progress.fileNotSelected'));
      navigate(`/try-on/${productUniqueLink}/upload`);
      return;
    }

    const currentSize = getSelectedSize();
    console.log('[Progress] Starting processing with selectedSize:', currentSize);

    setProcessingStatus('uploading');
    setProcessingProgress(0);
    setProcessingError(null);
    processingStartTimeRef.current = Date.now();
    trackProcessingStarted({ product_id: productUniqueLink });

    try {
      // Phase 1: Submit task
      const submitResult = await submitVisualizationTask(
        productUniqueLink,
        file,
        (progress) => {
          setProcessingProgress(progress);
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

      setCurrentTaskId(submitResult.taskId);
      setProcessingStatus('processing');

      // Phase 2: Poll for completion
      const result = await pollTaskStatus(submitResult.taskId, (status: TaskStatus) => {
        console.log('[Progress] Task status:', status);
      });

      if (result.success && result.data) {
        const durationMs = Date.now() - processingStartTimeRef.current;
        trackProcessingCompleted({
          product_id: productUniqueLink,
          task_id: submitResult.taskId,
          duration_ms: durationMs,
        });
        setProcessingStatus('completed');
        setVisualizedImageUrl(result.data.imageUrl);
        setResultImageId(result.data.imageId);
        setResultImagePath(result.data.imagePath);
        setCurrentTaskId(null);

        const params = new URLSearchParams();
        params.set('resultId', String(result.data.imageId));
        params.set('path', result.data.imagePath);

        navigate(`/try-on/${productUniqueLink}/result?${params.toString()}`);
      } else {
        trackProcessingFailed({
          product_id: productUniqueLink,
          error_message: result.error || 'unknown',
        });
        setProcessingStatus('error');
        setProcessingError(result.error || t('tryOn.errors.processingFailed'));
        setCurrentTaskId(null);
      }
    } catch (error) {
      console.error('[Progress] Processing error:', error);
      trackProcessingFailed({
        product_id: productUniqueLink,
        error_message: error instanceof Error ? error.message : 'unknown',
      });
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
    setCurrentTaskId(null);
    setPhase(0);

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
   */
  const handleAuthSuccess = (
    userData: User,
    tokens: { access: string; refresh: string }
  ) => {
    setStoredTokens(tokens);
    console.log('[Progress] Tokens stored directly, verifying...', !!getStoredTokens()?.access);

    login(userData, tokens);
    setShowAuth(false);

    queueMicrotask(() => {
      const storedTokens = getStoredTokens();
      console.log('[Progress] After microtask, tokens available:', !!storedTokens?.access);

      if (!storedTokens?.access) {
        console.error('[Progress] CRITICAL: Tokens not found after login!');
        toast.error(t('tryOn.progress.authError'));
        return;
      }

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

  // Normal processing UI with ProgressScreen
  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">

      <Header theme="light" disableNavigation={true} />

      {/* ProgressScreen replaces the ring + text + upload bar */}
      <ProgressScreen
        steps={STEPS}
        activeStepIndex={phase}
        tips={TIPS}
        bgImage={bgImage}
        isUploading={processingStatus === 'uploading'}
        uploadProgress={processingProgress}
      />

      {/* AUTH MODAL - Appears if user not logged in */}
      <AuthModal
        isOpen={showAuth}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
