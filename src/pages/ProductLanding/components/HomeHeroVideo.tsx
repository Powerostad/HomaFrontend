import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function HomeHeroVideo() {
  const { t } = useTranslation();
  const layer = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [readySource, setReadySource] = useState<string>();
  const [failedSource, setFailedSource] = useState<string>();
  const videoUrl = hasEntered && source !== failedSource ? source : null;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 700px)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const updateSource = () => {
      setSource(motion.matches || connection?.saveData
        ? null
        : `/images/home-editorial/hero-${mobile.matches ? 'mobile' : 'desktop'}.mp4`);
    };
    updateSource();
    motion.addEventListener('change', updateSource);
    mobile.addEventListener('change', updateSource);

    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.intersectionRatio >= 0.15;
      setInView(visible);
      if (visible) setHasEntered(true);
    }, { threshold: 0.15 });
    if (layer.current) observer.observe(layer.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', updateSource);
      mobile.removeEventListener('change', updateSource);
    };
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (inView && !paused) void player.play().catch(() => {});
    else player.pause();
  }, [videoUrl, inView, paused]);

  const toggle = () => {
    const player = video.current;
    if (!player) return;
    setPaused(!player.paused);
    if (player.paused) void player.play().catch(() => {});
    else player.pause();
  };

  return <>
    <div ref={layer} className="hh-motion" aria-hidden="true" data-ready={!!videoUrl && readySource === videoUrl}>
      {videoUrl && <video key={videoUrl} ref={video} src={videoUrl} muted autoPlay loop playsInline preload="auto"
        onPlaying={() => { setPlaying(true); setReadySource(videoUrl); }}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setFailedSource(videoUrl); }} />}
    </div>
    {videoUrl && <button type="button" className="hh-motion-toggle" onClick={toggle}
      aria-label={t(playing ? 'landing.heroGallery.pauseVideo' : 'landing.heroGallery.playVideo')}>
      {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
    </button>}
  </>;
}
