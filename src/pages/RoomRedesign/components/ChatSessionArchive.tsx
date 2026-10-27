import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, History, Loader2, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { listChatSessions, type ChatSessionListItem } from '../services/redesignChatService';
import '../journey.css';

/** Server-owned archive, intentionally separate from the legacy image gallery.
 * No local fallback: account switches and reloads must never expose another user's chats. */
export function ChatSessionArchive({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<{ owner: string; sessions: ChatSessionListItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(12);
  const revision = useRef(0);
  const owner = user?.id;
  const load = useCallback(async () => {
    const request = ++revision.current;
    if (!owner) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const result = await listChatSessions();
      if (revision.current !== request) return;
      if (result.success) setData({ owner, sessions: result.sessions });
      else setError(true);
    } catch {
      if (revision.current === request) setError(true);
    } finally {
      if (revision.current === request) setLoading(false);
    }
  }, [owner]);
  useEffect(() => {
    setData(null);
    setVisible(12);
    void load();
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener('focus', refresh);
    return () => { ++revision.current; window.removeEventListener('focus', refresh); };
  }, [load]);
  const sessions = data && data.owner === owner ? data.sessions : [];
  const shown = sessions.slice(0, compact ? 3 : visible);
  return <section className="studio-session-archive" dir={i18n.dir()} aria-label={t('studioChat.archiveTitle')}>
    <div className="studio-archive-heading">
      <div><h2>{t(compact ? 'studioChat.galleryLink' : 'studioChat.archiveTitle')}</h2><p>{t(compact ? 'studioChat.galleryHint' : 'studioChat.archiveHint')}</p></div>
      <div className="studio-archive-actions">
        <Button variant="outline" disabled={loading} onClick={() => void load()} aria-label={t('studioChat.refresh')}><RefreshCw size={16} aria-hidden="true" />{t('studioChat.refresh')}</Button>
        {compact && <Button asChild variant="outline"><Link to="/studio/projects"><History size={16} aria-hidden="true" />{t('studioChat.allConversations')}</Link></Button>}
      </div>
    </div>
    {error ? <div className="studio-archive-state studio-archive-state--error" role="alert"><p>{t('studioChat.archiveError')}</p><Button variant="outline" onClick={() => void load()}>{t('common.retry')}</Button></div>
      : loading && !sessions.length ? <div className="studio-archive-state" role="status"><Loader2 className="studio-spinner" size={24} aria-hidden="true" /><p>{t('studioChat.loading')}</p></div>
      : !sessions.length ? <div className="studio-archive-state"><MessageSquare size={28} aria-hidden="true" /><h3>{t('studioChat.archiveEmpty')}</h3><p>{t('studioChat.archiveEmptyHint')}</p><Button asChild><Link to="/studio"><Plus size={16} aria-hidden="true" />{t('studioChat.new')}</Link></Button></div>
      : <div className="studio-session-grid" aria-busy={loading}>{shown.map(session => <Link key={session.id} className="studio-session-card" to={`/studio/chat/${encodeURIComponent(session.id)}`}>
        <div className="studio-session-card-top"><MessageSquare size={20} aria-hidden="true" /><span className={`studio-session-status-badge studio-session-status-badge--${session.status}`}>{t(`studioChat.${session.status}`)}</span></div>
        <h3>{session.title.trim() || t('studioChat.conversationTitle')}</h3>
        <div className="studio-session-meta"><time dateTime={session.updated_at}>{new Date(session.updated_at).toLocaleDateString(i18n.language, { year:'numeric', month:'short', day:'numeric' })}</time><span>{t('studioChat.messages', { count:session.turn_count })}</span></div>
        <span className="studio-session-continue">{t('studioChat.continue')}<ArrowRight size={18} aria-hidden="true" /></span>
      </Link>)}</div>}
    {!compact && !error && sessions.length > visible && <div className="studio-archive-more"><Button variant="outline" onClick={() => setVisible(count => count + 12)}>{t('store.loadMore')}</Button></div>}
  </section>;
}
