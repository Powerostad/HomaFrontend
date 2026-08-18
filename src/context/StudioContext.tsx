import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { StudioProject } from "../types/studio";
import type {
  CreateRedesignSessionOptions,
  SessionStatus,
  RedesignSession,
  SessionListItem,
} from "@/services/studioService";
import {
  createRedesignSession,
  fetchSessionStatus,
  pollSessionStatus,
  fetchUserSessions,
  deleteSession,
} from "@/services/studioService";
import i18n from "@/i18n/config";

/**
 * StudioContext - manages studio mode, session state, and legacy project state
 *
 * New API-based session tracking:
 * - activeSessionId: Current session being created/polled
 * - activeSession: Full session data when ready
 * - sessionStatus: Real-time processing status
 *
 * Legacy localStorage-based projects (kept for backwards compatibility):
 * - studioProjects: Array of StudioProject from localStorage
 */
interface StudioContextType {
  // Studio mode
  studioMode: 'recommend' | 'tryon' | null;
  setStudioMode: (mode: 'recommend' | 'tryon' | null) => void;

  // API-based session tracking (NEW)
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void; // Exposed for recovery
  activeSession: RedesignSession | null;
  sessionStatus: SessionStatus | null;
  setSessionStatus: (status: SessionStatus | null) => void; // Exposed for recovery
  isCreatingSession: boolean;
  sessionError: string | null;

  // Session actions (NEW)
  startSession: (
    file: File,
    onProgress?: (progress: number) => void,
    options?: Pick<CreateRedesignSessionOptions, 'skipImageGeneration'>
  ) => Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
    creditRequired?: boolean;
    pendingRequestId?: string;
    allowContinueWithoutImage?: boolean;
  }>;
  loadSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  pollSession: (
    sessionId: string,
    onStatusChange?: (status: SessionStatus) => void
  ) => Promise<{ success: boolean; session?: RedesignSession; error?: string }>;
  clearActiveSession: () => void;

  // API session list (NEW)
  sessions: SessionListItem[];
  isLoadingSessions: boolean;
  loadSessions: () => Promise<void>;
  removeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;

  // Legacy localStorage projects (kept for backwards compatibility)
  studioProjects: StudioProject[];
  addStudioProject: (project: StudioProject) => void;
  updateStudioProject: (id: string, updates: Partial<StudioProject>) => void;
  deleteStudioProject: (id: string) => void;
  getProjectById: (id: string) => StudioProject | undefined;
}

const STORAGE_KEY = "studioProjects";

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  // Studio mode
  const [studioMode, setStudioMode] = useState<'recommend' | 'tryon' | null>(null);

  // API session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<RedesignSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // API session list
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Legacy localStorage projects
  const [studioProjects, setStudioProjects] = useState<StudioProject[]>([]);

  // Load legacy projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        setStudioProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error("Error loading studio projects:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save legacy projects to localStorage when they change
  useEffect(() => {
    if (studioProjects.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(studioProjects));
      } catch (error) {
        console.error("Error saving studio projects:", error);
      }
    }
  }, [studioProjects]);

  // ==========================================================================
  // API Session Actions
  // ==========================================================================

  /**
   * Start a new redesign session by uploading a room image
   */
  const startSession = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void,
    options?: Pick<CreateRedesignSessionOptions, 'skipImageGeneration'>
  ): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
    creditRequired?: boolean;
    pendingRequestId?: string;
    allowContinueWithoutImage?: boolean;
  }> => {
    setIsCreatingSession(true);
    setSessionError(null);
    setActiveSession(null);
    setSessionStatus(null);

    const result = await createRedesignSession(file, options, onProgress);

    if (result.success && result.data) {
      setActiveSessionId(result.data.sessionId);
      setSessionStatus(result.data.status);
      setIsCreatingSession(false);
      return { success: true, sessionId: result.data.sessionId };
    }

    if (result.creditRequired && result.creditData) {
      setIsCreatingSession(false);
      return {
        success: false,
        creditRequired: true,
        pendingRequestId: result.creditData.pendingRequestId,
        allowContinueWithoutImage: result.creditData.allowContinueWithoutImage,
        error: result.error,
      };
    }

    setSessionError(result.error || i18n.t('studio.errors.createSession'));
    setIsCreatingSession(false);
    return { success: false, error: result.error };
  }, []);

  /**
   * Load an existing session by ID
   */
  const loadSession = useCallback(async (
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setSessionError(null);

    const result = await fetchSessionStatus(sessionId);

    if (result.success && result.data) {
      setActiveSessionId(sessionId);
      setActiveSession(result.data);
      setSessionStatus(result.data.status);
      return { success: true };
    }

    setSessionError(result.error || i18n.t('studio.errors.fetchSession'));
    return { success: false, error: result.error };
  }, []);

  /**
   * Poll session status until ready or failed
   */
  const pollSession = useCallback(async (
    sessionId: string,
    onStatusChange?: (status: SessionStatus) => void
  ): Promise<{ success: boolean; session?: RedesignSession; error?: string }> => {
    setActiveSessionId(sessionId);
    setSessionError(null);

    const handleStatusChange = (status: SessionStatus) => {
      setSessionStatus(status);
      onStatusChange?.(status);
    };

    const result = await pollSessionStatus(sessionId, handleStatusChange);

    if (result.success && result.data) {
      setActiveSession(result.data);
      setSessionStatus(result.data.status);
      return { success: true, session: result.data };
    }

    // Even on failure, we might have partial data
    if (result.data) {
      setActiveSession(result.data);
    }

    setSessionError(result.error || i18n.t('studio.errors.processing'));
    return { success: false, error: result.error };
  }, []);

  /**
   * Clear active session state
   */
  const clearActiveSession = useCallback(() => {
    setActiveSessionId(null);
    setActiveSession(null);
    setSessionStatus(null);
    setSessionError(null);
    setIsCreatingSession(false);
  }, []);

  /**
   * Load user's session list from API
   */
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);

    const result = await fetchUserSessions();

    if (result.success && result.data) {
      setSessions(result.data.sessions);
    }

    setIsLoadingSessions(false);
  }, []);

  /**
   * Remove a session via API
   */
  const removeSession = useCallback(async (
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteSession(sessionId);

    if (result.success) {
      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      // Clear active if it was the deleted one
      if (activeSessionId === sessionId) {
        clearActiveSession();
      }

      return { success: true };
    }

    return { success: false, error: result.error };
  }, [activeSessionId, clearActiveSession]);

  // ==========================================================================
  // Legacy Project Actions (backwards compatibility)
  // ==========================================================================

  const addStudioProject = (project: StudioProject) => {
    setStudioProjects(prev => [project, ...prev]);
  };

  const updateStudioProject = (id: string, updates: Partial<StudioProject>) => {
    setStudioProjects(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const deleteStudioProject = (id: string) => {
    setStudioProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectById = (id: string) => {
    return studioProjects.find(p => p.id === id);
  };

  return (
    <StudioContext.Provider
      value={{
        // Mode
        studioMode,
        setStudioMode,

        // API session state
        activeSessionId,
        setActiveSessionId,
        activeSession,
        sessionStatus,
        setSessionStatus,
        isCreatingSession,
        sessionError,

        // API session actions
        startSession,
        loadSession,
        pollSession,
        clearActiveSession,

        // API session list
        sessions,
        isLoadingSessions,
        loadSessions,
        removeSession,

        // Legacy project state & actions
        studioProjects,
        addStudioProject,
        updateStudioProject,
        deleteStudioProject,
        getProjectById,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
