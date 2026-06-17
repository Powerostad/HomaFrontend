import { useEffect, useState } from 'react';

/** Reactive media-query match. Used to switch the Room Redesign flow between
 *  the mobile bottom-sheet layout and the desktop workspace at the lg breakpoint. */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatch(mql.matches);
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return match;
}
