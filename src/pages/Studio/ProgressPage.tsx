import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUpload } from '../../context/AppProviders';
import { useStudio } from '../../context/StudioContext';
import { Header } from '../../components/Header';
import { ProgressScreen, type ProgressStep } from '../../components/ProgressScreen';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';
import { fetchSessionStatus, type SessionStatus } from '@/services/studioService';
import {
  trackStudioProcessingStarted,
  trackStudioProcessingCompleted,
  trackStudioProcessingFailed,
} from '@/analytics/events';

/**
 * Map session status from API to step index for ProgressScreen
 */
function statusToStepIndex(status: SessionStatus | null, skipImageGeneration = false): number {
  if (skipImageGeneration) {
    switch (status) {
      case 'pending':
      case 'analyzing':
        return 0;
      case 'matching':
        return 1;
      case 'ready':
        return 2;
      default:
        return 0;
    }
  }

  switch (status) {
    case 'pending':
    case 'analyzing':
      return 0;
    case 'generating':
    case 'retrying':
      return 1;
    case 'matching':
      return 2;
    case 'ready':
      return 3;
    default:
      return 0;
  }
}

export function StudioProgressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
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

  // 4 steps with sub-messages for Studio flow (retrying is NOT a visible step)
  const STEPS: ProgressStep[] = useMemo(() => [
    {
      label: t('studio.progress.step1Label', 'تحلیل فضا'),
      subMessages: [
        { text: t('studio.progress.step1Msg1', 'بررسی ساختار و نور فضا...'), delayMs: 0 },
        { text: t('studio.progress.step1Msg2', 'شناسایی سبک و رنگ‌بندی...'), delayMs: 2000 },
      ],
      estimatedSec: 10,
    },
    {
      label: t('studio.progress.step2Label', 'طراحی تصویر'),
      subMessages: [
        { text: t('studio.progress.step2Msg1', 'طراحی چیدمان جدید...'), delayMs: 0 },
        { text: t('studio.progress.step2Msg2', 'هماهنگ‌سازی المان‌ها...'), delayMs: 3000 },
        { text: t('studio.progress.step2Msg3', 'اعمال جزئیات نهایی...'), delayMs: 7000 },
      ],
      estimatedSec: 25,
    },
    {
      label: t('studio.progress.step4Label', 'یافتن محصولات'),
      subMessages: [
        { text: t('studio.progress.step4Msg1', 'جستجوی محصولات مناسب...'), delayMs: 0 },
        { text: t('studio.progress.step4Msg2', 'تطبیق با سبک فضا...'), delayMs: 2500 },
      ],
      estimatedSec: 15,
    },
    {
      label: t('studio.progress.step5Label', 'آماده‌سازی'),
      subMessages: [
        { text: t('studio.progress.step5Msg1', 'آماده‌سازی نتیجه نهایی...'), delayMs: 0 },
      ],
      estimatedSec: 10,
    },
  ], [t]);

  // 6 rotating tips about Studio / interior design
  const TIPS = useMemo(() => [
    t('studio.progress.tip1', 'استودیو هُما بهترین چیدمان رو برات پیدا می‌کنه'),
    t('studio.progress.tip2', 'محصولات پیشنهادی بر اساس سبک فضات انتخاب میشن'),
    t('studio.progress.tip3', 'می‌تونی نتیجه رو ذخیره کنی و بعداً ببینی'),
    t('studio.progress.tip4', 'هر دسته‌بندی، بهترین گزینه‌ها رو نشونت میده'),
    t('studio.progress.tip5', 'قبل از خرید، نتیجه رو تو فضای واقعی ببین'),
    t('studio.progress.tip6', 'تحلیل فضا شامل نور، رنگ و ابعاده'),
  ], [t]);

  // URL params for recovery
  const urlSessionId = searchParams.get('sessionId');

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNoImageSession, setIsNoImageSession] = useState(false);
  const hasStartedPolling = useRef(false);
  const hasRecoveredRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  // Derive step index from session status
  const activeStepIndex = statusToStepIndex(sessionStatus, isNoImageSession);

  const visibleSteps = useMemo(() => {
    if (!isNoImageSession) return STEPS;
    return [
      {
        label: t('studio.progress.noImageStep1Label', 'تحلیل فضا'),
        subMessages: [
          { text: t('studio.progress.noImageStep1Msg1', 'بررسی ساختار و نور فضا...'), delayMs: 0 },
          { text: t('studio.progress.noImageStep1Msg2', 'شناسایی سبک و نیازهای فضا...'), delayMs: 2000 },
        ],
        estimatedSec: 10,
      },
      {
        label: t('studio.progress.noImageStep2Label', 'یافتن محصولات'),
        subMessages: [
          { text: t('studio.progress.noImageStep2Msg1', 'جستجوی محصولات مناسب برای همین فضا...'), delayMs: 0 },
          { text: t('studio.progress.noImageStep2Msg2', 'تطبیق پیشنهادها با تحلیل تصویر...'), delayMs: 2500 },
        ],
        estimatedSec: 15,
      },
      {
        label: t('studio.progress.noImageStep3Label', 'آماده‌سازی'),
        subMessages: [
          { text: t('studio.progress.noImageStep3Msg1', 'آماده‌سازی پیشنهادها بدون تولید تصویر بازطراحی...'), delayMs: 0 },
        ],
        estimatedSec: 10,
      },
    ];
  }, [STEPS, isNoImageSession, t]);

  // Status override for retrying state
  const statusOverride = sessionStatus === 'retrying' ? (
    <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
      {t('studio.progress.retryingNotice', 'سرویس هوش مصنوعی در لحظه شلوغ است — در حال تلاش مجدد...')}
    </span>
  ) : undefined;

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
        toast.error(t('errors.sessionNotFound'));
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
        setError(result.error || t('errors.sessionNotFound'));
        return;
      }

      const session = result.data!;
      setIsNoImageSession(session.skipImageGeneration);

      if (session.status === 'ready') {
        // Session already complete - redirect to result
        console.log('[StudioProgress] Session already ready, redirecting to result');
        navigate(`/studio/result/${sessionIdToRecover}`, { replace: true });
        return;
      }

      if (session.status === 'failed') {
        // Session failed - show error
        setError(session.errorMessage || t('tryOn.errors.processingFailed'));
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
    startTimeRef.current = Date.now();
    trackStudioProcessingStarted({ session_id: activeSessionId });

    const startPolling = async () => {
      const result = await pollSession(activeSessionId, (status) => {
        // Status change callback - phase updates via useEffect above
        console.log('Session status changed:', status);
      });

      if (result.session?.skipImageGeneration) {
        setIsNoImageSession(true);
      }

      setIsPolling(false);

      if (result.success && result.session) {
        trackStudioProcessingCompleted({
          session_id: activeSessionId,
          duration_ms: Date.now() - startTimeRef.current,
        });
        // Success! Navigate to result page
        navigate(`/studio/result/${activeSessionId}`);
      } else {
        const errorMessage = result.error || t('tryOn.errors.processingFailed');
        trackStudioProcessingFailed({ session_id: activeSessionId, error_message: errorMessage });
        // Error - show retry option
        setError(errorMessage);
      }
    };

    startPolling();
  }, [activeSessionId, pollSession, navigate, isRecovering, t]);

  // Handle retry - create a NEW session with the same image
  const handleRetry = async () => {
    // Get file synchronously (ref-based access)
    const file = getSelectedFile();

    if (!file) {
      // No file available - redirect to upload
      toast.error(t('errors.imageNotFound'));
      navigate('/studio/upload');
      return;
    }

    hasStartedPolling.current = false;
    setError(null);
    setIsPolling(true);

    // Create a NEW session with the same image, preserving the user's choice
    // to continue without generating a redesigned image.
    const createResult = await startSession(
      file,
      undefined,
      isNoImageSession ? { skipImageGeneration: true } : undefined,
    );

    if (!createResult.success || !createResult.sessionId) {
      setIsPolling(false);
      setError(createResult.error || t('errors.resultFailed'));
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
      setError(pollResult.error || t('tryOn.errors.processingFailed'));
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
          <p className="text-[14px] text-black/50">{t('studio.progress.recovering', "در حال بازیابی جلسه...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">

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

      {/* --- Processing State (ProgressScreen) --- */}
      {(!error || isPolling) && (
        <ProgressScreen
          steps={visibleSteps}
          activeStepIndex={activeStepIndex}
          tips={TIPS}
          bgImage={bgImage}
          statusOverride={statusOverride}
        />
      )}

    </div>
  );
}
