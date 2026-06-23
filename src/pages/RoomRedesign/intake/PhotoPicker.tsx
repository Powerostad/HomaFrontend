/**
 * PhotoPicker — a hidden file input + render-prop trigger.
 *
 * One input with `accept="image/*,…"` and no `capture` attribute: on mobile the
 * OS chooser already offers both "Camera" and "Photo Library", so a single tap
 * covers "take a photo OR pick from gallery" (Screen 1 primary CTA). The render
 * prop lets callers style the trigger freely (big CTA on Screen 1, the small
 * "تغییر عکس" text button on Screen 2).
 *
 * Source is reported as 'gallery' by default — a single input can't reliably
 * distinguish camera vs library, and the payload's `source` is advisory only.
 */
import { useRef, type ChangeEvent, type ReactNode } from 'react';
import { IMAGE_ACCEPT_STRING } from '@/utils/imageConversion';

export interface PhotoPickerProps {
  onPick: (file: File, source: 'camera' | 'gallery') => void;
  disabled?: boolean;
  /** Render the trigger; call `open` to launch the OS file/camera chooser. */
  children: (open: () => void) => ReactNode;
}

export function PhotoPicker({ onPick, disabled, children }: PhotoPickerProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file, 'gallery');
    // Reset so picking the same file again re-fires onChange.
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT_STRING}
        className="hidden"
        onChange={onChange}
        aria-hidden
        tabIndex={-1}
      />
      {children(open)}
    </>
  );
}
