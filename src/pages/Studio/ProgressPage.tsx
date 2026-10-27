import {
  trackStudioProcessingCompleted,
  trackStudioProcessingFailed,
  trackStudioProcessingStarted,
} from '@/analytics/events';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { fetchSessionStatus } from '@/services/studioService';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HomaLoadingExperience } from '@/components/studio/loading/HomaLoadingExperience';
import { legacyLoadingState } from '@/components/studio/loading/loadingState';
import { useUpload } from '../../context/AppProviders';
import { useStudio } from '../../context/StudioContext';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';

export function StudioProgressPage() {
  const { siteText } = useSiteTranslation();
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
  // URL params for recovery
  const urlSessionId = searchParams.get('sessionId');

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNoImageSession, setIsNoImageSession] = useState(false);
  const hasStartedPolling = useRef(false);
  const hasRecoveredRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  // Navigation guard - warn user before leaving during processing
  useNavigationGuard(isPolling || isRecovering);

  // Load background image from selected file
  useEffect(() => {
    if (selectedFile) {
      const source = URL.createObjectURL(selectedFile);
      setBgImage(source);
      return () => URL.revokeObjectURL(source);
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
      if (session.roomImageUrl) setBgImage(session.roomImageUrl);

      if (session.status === 'ready') {
        // Session already complete - redirect to result
        console.log('[StudioProgress] Session already ready, redirecting to result');
        setCompletedSessionId(sessionIdToRecover);
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
      if (result.session) setIsNoImageSession(result.session.skipImageGeneration);



      setIsPolling(false);

      if (result.success && result.session) {
        trackStudioProcessingCompleted({
          session_id: activeSessionId,
          duration_ms: Date.now() - startTimeRef.current,
        });
        // Success! Navigate to result page
        setCompletedSessionId(activeSessionId);
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
      setCompletedSessionId(createResult.sessionId);
    } else {
      setError(pollResult.error || t('tryOn.errors.processingFailed'));
    }
  };

  // Handle go back
  const handleGoBack = () => {
    clearActiveSession();
    navigate('/studio/upload');
  };

  const lifecycle = legacyLoadingState(sessionStatus);
  return <HomaLoadingExperience jobId={activeSessionId || urlSessionId || 'recovering'}
    originalImage={bgImage} analysisReady={lifecycle.analysisReady && !isRecovering}
    busy={isPolling || isRecovering} error={error} complete={!!completedSessionId}
    stageKey={lifecycle.stageKey}
    statusLabel={isRecovering ? siteText('در حال بازیابی درخواست شما…')
      : sessionStatus === 'retrying' ? siteText('سرویس در حال تلاش مجدد برای تولید تصویر است…')
      : sessionStatus === 'matching' ? siteText('در حال یافتن محصولات متناسب…')
      : sessionStatus === 'generating' ? siteText('در حال ساخت تصویر طراحی…') : null}
    onComplete={() => { if (completedSessionId) navigate(`/studio/result/${completedSessionId}`); }} onRetry={() => { setCompletedSessionId(null); void handleRetry(); }} onNew={handleGoBack} />;
}
