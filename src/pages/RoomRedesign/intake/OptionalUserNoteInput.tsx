import { useSiteTranslation } from '@/i18n/siteCopy';
/**
 * OptionalUserNoteInput — optional free-text note textarea for the intake review screen.
 *
 * Renders an associated <label>, RTL <textarea>, and helper text.
 * The textarea is resizeable via rows=3 (fixed height baseline) with a subtle focus ring.
 */
import { type ChangeEvent } from 'react';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';

const TEXTAREA_ID = 'intake-user-note';

interface OptionalUserNoteInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function OptionalUserNoteInput({ value, onChange }: OptionalUserNoteInputProps): JSX.Element {
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
      <label
        htmlFor={TEXTAREA_ID}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: RD.ink,
          textAlign: 'start',
          cursor: 'pointer',
        }}
      >
        {siteValue(INTAKE_COPY.review.noteLabel)}
      </label>
      <textarea
        id={TEXTAREA_ID}
        rows={3}
        value={value}
        placeholder={siteValue(INTAKE_COPY.review.notePlaceholder)}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        style={{
          direction: siteDirection(),
          textAlign: 'start',
          fontFamily: 'Vazirmatn, sans-serif',
          fontSize: '14px',
          lineHeight: '1.7',
          color: RD.ink,
          backgroundColor: '#fff',
          border: `1px solid ${RD.line}`,
          borderRadius: '12px',
          padding: '12px 14px',
          minHeight: '80px',
          resize: 'vertical',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = RD.inkMuted;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${RD.greenTintBg}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = RD.line;
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <span
        style={{
          fontSize: '12px',
          color: RD.inkMuted,
          textAlign: 'start',
          lineHeight: '1.6',
        }}
      >
        {siteValue(INTAKE_COPY.review.noteHelper)}
      </span>
    </div>
  );
}
