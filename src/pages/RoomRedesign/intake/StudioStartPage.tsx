import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StudioIntake } from './StudioIntake';
import { RoomRedesignPage } from '../RoomRedesignPage';
import type { HomaIntakePayload } from './intakeTypes';

/** The draft stays mounted behind sign-in; no session/model before confirmation. */
export function StudioStartPage({ host = false }: { host?: boolean }) {
  const { isLoggedIn, login } = useAuth();
  const { sessionId } = useParams();
  const [pending, setPending] = useState<HomaIntakePayload | null>(null);
  const [confirmed, setConfirmed] = useState<HomaIntakePayload | null>(null);
  // The chat now owns the intake; returning to /studio must open a fresh draft.
  useEffect(() => { if (sessionId) setConfirmed(null); }, [sessionId]);
  // Keep this same component boundary during /studio → /studio/chat/:id.
  // Remounting the chat at session creation aborts its first live command.
  if ((confirmed || sessionId) && isLoggedIn) return <RoomRedesignPage initialIntake={confirmed} />;
  if (sessionId) return <ProtectedRoute fallback="modal"><></></ProtectedRoute>;
  return <><StudioIntake key={host ? 'host' : 'home'} host={host} onStartAnalysis={payload => isLoggedIn ? setConfirmed(payload) : setPending(payload)} />
    <AuthModal isOpen={!!pending && !isLoggedIn} onClose={() => setPending(null)}
      onSuccess={(user, tokens) => { login(user, tokens); setConfirmed(pending); setPending(null); }} />
  </>;
}
