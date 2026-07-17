import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  realtimeClient,
  type RealtimeConnectionState,
  type RealtimeEvent,
} from '@/services/realtimeClient';
import { appConfig } from '@/config/appConfig';

interface RealtimeContextValue {
  state: RealtimeConnectionState;
  isConnected: boolean;
  subscribe: (listener: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isInitialized } = useAuth();
  const [state, setState] = useState<RealtimeConnectionState>('idle');

  useEffect(() => realtimeClient.subscribeState(setState), []);

  useEffect(() => {
    if (!isInitialized) return;
    if (appConfig.enableRealtime && isLoggedIn) {
      void realtimeClient.connect();
    } else {
      realtimeClient.disconnect();
    }
    return () => realtimeClient.disconnect();
  }, [isInitialized, isLoggedIn]);

  const value = useMemo(() => ({
    state,
    isConnected: state === 'connected',
    subscribe: realtimeClient.subscribe.bind(realtimeClient),
  }), [state]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within a RealtimeProvider');
  return context;
}
