import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StudioIntake } from './StudioIntake';
import { StudioIntroduction } from './StudioIntroduction';
import type { StudioSubmission } from './StudioHomeIntake';
import { RoomRedesignPage } from '../RoomRedesignPage';
import type { HomaIntakePayload } from './intakeTypes';

const StudioPaymentDemo = import.meta.env.DEV ? lazy(() => import('./StudioPaymentDemo')) : null;

/** The draft stays mounted behind sign-in; no session/model before confirmation. */
export function StudioStartPage({ host = false }: { host?: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  const { isLoggedIn, isInitialized, user, login } = useAuth();
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const [pending, setPending] = useState<HomaIntakePayload | null>(null);
  const [confirmed, setConfirmed] = useState<HomaIntakePayload | null>(null);
  const [submission, setSubmission] = useState<StudioSubmission | null>(null);
  const [signedInFromIntake, setSignedInFromIntake] = useState(false);
  const homeFlow = !host && !(import.meta.env.DEV && import.meta.env.MODE === 'studio-local') && !params.has('creditPurchase');
  // The chat now owns the intake; returning to /studio must open a fresh draft.
  useEffect(() => {
    if (sessionId) {
      setConfirmed(null);
      setSubmission(null);
      setSignedInFromIntake(false);
    }
  }, [sessionId]);
  // Keep this same component boundary during /studio → /studio/chat/:id.
  // Remounting the chat at session creation aborts its first live command.
  if (sessionId && !isLoggedIn) return <ProtectedRoute fallback="modal"><></></ProtectedRoute>;
  if (StudioPaymentDemo && !host && params.get('creditDemo') === '1' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    return <Suspense><StudioPaymentDemo /></Suspense>;
  }
  const showIntake = !sessionId && !(confirmed && isLoggedIn && (!homeFlow || submission?.accepted));
  return <>
    {(confirmed || sessionId) && isLoggedIn && <RoomRedesignPage initialIntake={confirmed}
      {...(homeFlow && confirmed && !sessionId ? { onInitialProgress: setSubmission } : {})} />}
    {showIntake && <>
    {import.meta.env.DEV && import.meta.env.MODE === 'studio-local' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) &&
    <div className="px-6 py-3 text-end text-xs text-content-secondary"><Link className="underline underline-offset-4" to="/studio/catalogue">{copy('مدیریت کاتالوگ')}</Link></div>}
    <StudioIntake key={host ? 'host' : 'home'} host={host} homeFlow={homeFlow} accountId={user?.id}
      requiresSignIn={!isLoggedIn} showCreditPurchase={!host && isLoggedIn}
      submission={submission} submitting={!!confirmed && (!submission || submission.busy)} onEditSubmission={() => { setConfirmed(null); setSubmission(null); }}
      introduction={!host && isInitialized && <StudioIntroduction key={user?.id ?? 'guest'} accountId={user?.id}
        autoOpen={!signedInFromIntake && !params.has('creditPurchase') && params.get('view') !== 'design'} />}
      onStartAnalysis={payload => isLoggedIn ? setConfirmed(payload) : setPending(payload)} />
    <AuthModal isOpen={!!pending && !isLoggedIn} onClose={() => setPending(null)}
      onSuccess={(user, tokens) => {
        login(user, tokens);
        setSignedInFromIntake(true);
        if (!homeFlow) setConfirmed(pending);
        setPending(null);
      }} />
    </>}
  </>;
}
