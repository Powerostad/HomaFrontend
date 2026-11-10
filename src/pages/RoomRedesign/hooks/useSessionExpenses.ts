import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { refreshSessionExpenses, type SessionExpenses } from '../services/redesignChatService';

/** Read provider receipts only: no generation, no polling during AI, bounded retries. */
export function useSessionExpenses(sessionId: string, active: boolean, busy: boolean, revision = 0) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<SessionExpenses | null>(null);
  useEffect(() => {
    setExpenses(null);
    if (!active || busy || !user?.id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function reconcile(attempt: number) {
      try {
        const result = await refreshSessionExpenses(sessionId);
        if (cancelled || !result.success || !result.data) return;
        const value = result.data.expenses;
        setExpenses(value);
        // AvalAI receipts may settle later; 35s also respects the server lock.
        if (attempt < 2 && (value.pending_receipts > 0 || value.refresh_status === 'cooldown')) {
          timer = setTimeout(() => void reconcile(attempt + 1), 35_000);
        }
      } catch { /* Saved report remains available; manual refresh can retry. */ }
    }
    void reconcile(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId, user?.id, active, busy, revision]);
  return expenses;
}
