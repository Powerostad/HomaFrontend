import { useSiteTranslation } from '@/i18n/siteCopy';
/**
 * RoomTypeSelector — single-select room/space type chip group.
 *
 * Renders a label + helper text followed by a flex-wrap row of pill Chips
 * sourced from ROOM_TYPES. Selecting an already-selected chip is handled
 * upstream (the onSelect callback always fires; clearing is the caller's job).
 */
import { Chip } from '../components/chat';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';
import { ROOM_TYPES, type RoomType } from './intakeTypes';

interface RoomTypeSelectorProps {
  value?: RoomType;
  onSelect: (rt: RoomType) => void;
}

export function RoomTypeSelector({ value, onSelect }: RoomTypeSelectorProps): JSX.Element {
  const { siteValue, siteDirection } = useSiteTranslation();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: 'Vazirmatn, sans-serif',
        direction: siteDirection(),
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: RD.ink,
          textAlign: 'right',
        }}
      >
        {siteValue(INTAKE_COPY.review.roomTypeLabel)}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: RD.inkMuted,
          textAlign: 'right',
          lineHeight: '1.6',
        }}
      >
        {siteValue(INTAKE_COPY.review.roomTypeHelper)}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {siteValue(ROOM_TYPES.map((rt) => (
          <Chip
            key={rt.value}
            chip={{ id: rt.value, label: rt.label }}
            selected={value === rt.value}
            variant="pill"
            onClick={() => onSelect(rt.value)}
          />
        )))}
      </div>
    </div>
  );
}
