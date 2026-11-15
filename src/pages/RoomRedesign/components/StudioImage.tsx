import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Renew an expired signed URL once; never re-run image generation. */
export function StudioImage({ image, versionKey, alt, onRefresh }: {
  image: string; versionKey: string; alt: string; onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const refreshed = useRef(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { refreshed.current = false; setFailed(false); }, [versionKey]);
  return <>
    <img className="redesign-main-image" src={image} alt={alt} onLoad={() => setFailed(false)}
      onError={() => {
        setFailed(true);
        if (!refreshed.current && versionKey !== 'original') { refreshed.current = true; onRefresh(); }
      }} />
    {failed && <div role="alert"><p>{t('redesignJourney.imageUnavailable')}</p>
      <button onClick={onRefresh}>{t('redesignJourney.reloadImage')}</button></div>}
  </>;
}
