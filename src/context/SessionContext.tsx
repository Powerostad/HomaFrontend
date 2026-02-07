import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { trackEvent as trackAnalytics } from "../utils/analytics";
import { posthog } from "@/utils/posthog";

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

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Session ID is constant per session
  const sessionId = useMemo(() => generateSessionId(), []);

  const [errorType, setErrorType] = useState<string>("network");
  const [placementSuccess, setPlacementSuccess] = useState<boolean>(true);

  const trackKPI = (event: string, metadata?: Record<string, unknown>) => {
    const eventData = {
      timestamp: new Date().toISOString(),
      sessionId,
      ...metadata,
    };
    console.log(`[KPI] ${event}`, eventData);
    trackAnalytics(event, eventData);
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
