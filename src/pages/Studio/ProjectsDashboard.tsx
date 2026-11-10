import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useAuth } from '@/context/AuthContext';
import { fetchUserSessions, type SessionListItem } from '@/services/studioService';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChatSessionArchive } from '../RoomRedesign/components/ChatSessionArchive';
import '../RoomRedesign/journey.css';

export function StudioProjectsDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [legacy, setLegacy] = useState<SessionListItem[]>([]);
  const [legacyError, setLegacyError] = useState(false);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLegacy([]);
    setLegacyError(false);
    setLegacyLoading(true);
    if (!user?.id) { setLegacyLoading(false); return; }
    void fetchUserSessions({ pageSize:100 }).then(result => {
      if (!active) return;
      if (result.success && result.data) setLegacy(result.data.sessions);
      else setLegacyError(true);
    }).catch(() => { if (active) setLegacyError(true); }).finally(() => { if (active) setLegacyLoading(false); });
    return () => { active = false; };
  }, [user?.id, refresh]);
  return <div className="min-h-screen bg-surface-page" dir={i18n.dir()}>
    <Header />
    <main className="studio-archive-page">
      <div className="studio-archive-page-heading"><h1>{t('studioChat.title')}</h1><Button asChild><Link to="/studio"><Plus size={18} aria-hidden="true" />{t('studioChat.new')}</Link></Button></div>
      <ChatSessionArchive />
      {(legacyLoading || legacyError || !!legacy.length) && <details className="studio-legacy-section">
        <summary>{t('studioChat.legacy')}{!!legacy.length && ` · ${legacy.length.toLocaleString(i18n.language)}`}</summary>
        {legacyLoading && <p role="status" className="studio-empty-note">{t('studioChat.loading')}</p>}
        {legacyError && <div className="studio-archive-state" role="alert"><p>{t('studioChat.archiveError')}</p><Button variant="outline" onClick={() => setRefresh(value => value + 1)}>{t('common.retry')}</Button></div>}
        <div className="studio-session-grid">{legacy.map((session, index) => <Link className="studio-session-card" key={session.id} to={`/studio/result/${encodeURIComponent(session.id)}`}>
          {session.thumbnailUrl && <AuthenticatedImage className="studio-legacy-thumbnail" src={session.thumbnailUrl} alt={t('studioChat.room')} loading="lazy" />}
          <h3>{t('redesignJourney.version', { number:index + 1 })}</h3>
          <time className="studio-caption" dateTime={session.createdAt}>{new Date(session.createdAt).toLocaleDateString(i18n.language)}</time>
          <span className="studio-session-continue">{t('studioChat.viewLegacy')}</span>
        </Link>)}</div>
      </details>}
    </main>
  </div>;
}
