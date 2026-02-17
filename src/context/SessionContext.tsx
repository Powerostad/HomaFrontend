import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { posthog } from "@/utils/posthog";

const STORAGE_KEY = 'homa_session_id';

/**
 * SessionContext - manages session tracking and error state
 */
interface SessionContextType {
  sessionId: string;
  errorType: string;
  setErrorType: (type: string) => void;
  placementSuccess: boolean;
  setPlacementSuccess: (success: boolean) => void;
  trackKPI: (event: string, metadata?: Record<string, unknown>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable (SSR, private browsing)
  }
  const id = crypto.randomUUID();
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable
  }
  return id;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Session ID persists across page reloads via localStorage
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const [errorType, setErrorType] = useState<string>("network");
  const [placementSuccess, setPlacementSuccess] = useState<boolean>(true);

  const trackKPI = (event: string, metadata?: Record<string, unknown>) => {
    console.log(`[KPI] ${event}`, { sessionId, ...metadata });
    posthog.capture(event, { session_id: sessionId, ...metadata });
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        errorType,
        setErrorType,
        placementSuccess,
        setPlacementSuccess,
        trackKPI,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
