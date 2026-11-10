import { ArrowUpLeft } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { StylePhoto } from '@/pages/RoomRedesign/intake/StylePhoto';
import { ROOMS } from '@/pages/RoomRedesign/intake/studioOnboarding';
import '@/pages/RoomRedesign/intake/studio-onboarding.css';
import './studio-landing.css';

export function RoomEntrySection({ host = false }: { host?: boolean }) {
  const { siteText: copy, siteDirection } = useSiteTranslation();
  return <section className="landing-room-entry" dir={siteDirection()}>
    <header><span>{host ? 'HOMA / HOSTS' : 'HOMA / STUDIO'}</span>
      <h2>{copy(host ? 'از کدام فضای اقامتگاه شروع کنیم؟' : 'یک فضا را انتخاب کن.')}</h2>
      <p>{copy('هر بار یک فضا و یک عکس؛ برای اتاق بعدی یک طراحی جدا بساز.')}</p>
    </header>
    <div>{ROOMS.map(room => <a key={room.id} href={`${host ? '/studio/hosts' : '/studio'}?room=${room.id}`}>
      <StylePhoto row={room.row} col={host ? 1 : 0} label={copy(room.label)} />
      <span><b>{copy(room.label)}</b><ArrowUpLeft size={18} /></span><small>{copy(room.hint)}</small>
    </a>)}</div>
  </section>;
}
