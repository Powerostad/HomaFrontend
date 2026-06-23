/**
 * IntakeForm — step-0 intake UI for the conversational room-redesign flow.
 *
 * Renders:
 *  - Assistant intro bubble (HeaderBadge + INTAKE_WELCOME text)
 *  - Room photo uploader (FileUpload when empty, thumbnail when set)
 *  - Scope chips (REDESIGN_SCOPE_CHIPS, multi-select pill grid)
 *
 * The text field + send button live in the parent (page footer), not here.
 *
 * Callers: components/panels.tsx (AnalysisPanel intake),
 *          components/desktop.tsx (ChatPanel intake),
 *          RoomRedesignPage.tsx
 */

import { X, Camera, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { FileUpload } from '@/components/FileUpload';
import { IMAGE_ACCEPT_STRING } from '@/utils/imageConversion';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { HeaderBadge, Chip } from './chat';
import { RD } from '../theme';
import { INTAKE_WELCOME, INTAKE_SCOPE_TITLE } from '../data/mockData';
import type { Chip as ChipType } from '../types';

export interface IntakeFormProps {
  image: string | null;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  scopeChips: ChipType[];
  scopeSelected: Set<string>;
  onToggleScope: (chipId: string) => void;
  variant?: 'mobile' | 'desktop';
}

export function IntakeForm({
  image,
  onPickImage,
  onRemoveImage,
  scopeChips,
  scopeSelected,
  onToggleScope,
  variant = 'mobile',
}: IntakeFormProps): JSX.Element {
  const px = variant === 'desktop' ? '16px' : '20px';
  const pt = variant === 'desktop' ? '12px' : '16px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: `${pt} ${px} 8px`,
        fontFamily: 'Vazirmatn, sans-serif',
        direction: 'rtl',
      }}
    >
      {/* ── Assistant intro bubble ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
      >
        <HeaderBadge icon={Sparkles} />
        <div
          style={{
            backgroundColor: RD.cream,
            border: `1px solid ${RD.line}`,
            borderRadius: '0 12px 12px 12px',
            padding: '10px 14px',
            fontSize: '13px',
            lineHeight: '1.85',
            color: RD.ink,
            flex: 1,
          }}
        >
          {INTAKE_WELCOME}
        </div>
      </motion.div>

      {/* ── Photo uploader / thumbnail ──────────────────────────────── */}
      <div>
        {image === null ? (
          <FileUpload
            accept={IMAGE_ACCEPT_STRING}
            maxSizeMB={10}
            onFileSelect={onPickImage}
          />
        ) : (
          <div style={{ position: 'relative', width: '100%' }}>
            <ImageWithFallback
              src={image}
              alt="تصویر اتاق"
              style={{
                width: '100%',
                aspectRatio: '16/9',
                objectFit: 'cover',
                borderRadius: 0,
                display: 'block',
              }}
            />
            {/* Remove button — top-right in RTL layout */}
            <button
              onClick={onRemoveImage}
              aria-label="حذف تصویر"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: RD.darkOverlay,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <X size={14} />
            </button>
            {/* Camera badge — bottom-right */}
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: RD.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={12} color="#fff" />
            </div>
          </div>
        )}
      </div>

      {/* ── Scope chips ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: RD.ink,
          }}
        >
          {INTAKE_SCOPE_TITLE}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {scopeChips.map((chip) => (
            <Chip
              key={chip.id}
              chip={chip}
              selected={scopeSelected.has(chip.id)}
              variant="pill"
              onClick={() => onToggleScope(chip.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
