export function StylePhoto({ row, col, label, className = '' }: { row: number; col: number; label: string; className?: string }) {
  // Crop one shared contact sheet without stretching rooms in portrait panels.
  return <svg role="img" aria-label={label} className={`studio-mood-photo ${className}`}
    viewBox={`${col * 100 + .5} ${row * 100 + .5} 99 99`} preserveAspectRatio="xMidYMid slice">
    <image href="/images/studio/style-atlas.png" width="400" height="400" />
  </svg>;
}
