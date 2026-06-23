/**
 * PhotoTipsBottomSheet — "how to take a good photo" guidance sheet.
 *
 * Vaul Drawer bottom sheet with 5 numbered tips, labelled good/bad examples
 * (icon rows, no image assets), and a dismiss CTA. RTL, RD tokens.
 */
import { Check, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';

export interface PhotoTipsBottomSheetProps {
  open: boolean;
  onClose: () => void;
}

export function PhotoTipsBottomSheet({ open, onClose }: PhotoTipsBottomSheetProps): JSX.Element {
  const reduce = useReducedMotion();

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        {/* a11y title — visually hidden; visible heading rendered below */}
        <DrawerTitle className="sr-only">{INTAKE_COPY.tips.title}</DrawerTitle>

        <div
          dir="rtl"
          style={{
            fontFamily: 'Vazirmatn, sans-serif',
            padding: '4px 20px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            overflowY: 'auto',
            maxHeight: '80dvh',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ── Visible heading ──────────────────────────────────── */}
          <h2
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: RD.ink,
              margin: 0,
              textAlign: 'right',
            }}
          >
            {INTAKE_COPY.tips.title}
          </h2>

          {/* ── Numbered tips list ───────────────────────────────── */}
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {INTAKE_COPY.tips.items.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: reduce ? 0 : 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduce ? 0 : i * 0.04,
                  duration: 0.2,
                  ease: 'easeOut',
                }}
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.9,
                  color: RD.ink,
                  textAlign: 'right',
                }}
              >
                {item}
              </motion.li>
            ))}
          </ol>

          {/* ── Examples block ───────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: RD.ink,
                textAlign: 'right',
              }}
            >
              {INTAKE_COPY.tips.examplesTitle}
            </span>

            {/* Good example */}
            <ExampleRow
              icon="good"
              text={INTAKE_COPY.tips.goodExample}
              reduce={!!reduce}
              delay={0}
            />
            {/* Bad example: close-up */}
            <ExampleRow
              icon="bad"
              text={INTAKE_COPY.tips.badExampleClose}
              reduce={!!reduce}
              delay={reduce ? 0 : 0.04}
            />
            {/* Bad example: dark */}
            <ExampleRow
              icon="bad"
              text={INTAKE_COPY.tips.badExampleDark}
              reduce={!!reduce}
              delay={reduce ? 0 : 0.08}
            />
          </div>

          {/* ── Dismiss CTA ─────────────────────────────────────── */}
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: RD.green,
              color: '#fff',
              border: 'none',
              borderRadius: '18px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Vazirmatn, sans-serif',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            {INTAKE_COPY.tips.dismiss}
          </motion.button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── Internal helper: one icon+text example row ────────────────────────────
function ExampleRow({
  icon,
  text,
  reduce,
  delay,
}: {
  icon: 'good' | 'bad';
  text: string;
  reduce: boolean;
  delay: number;
}) {
  const isGood = icon === 'good';
  const badgeColor = isGood ? RD.accentGreen : RD.danger;
  const IconCmp = isGood ? Check : X;

  return (
    <motion.div
      initial={{ opacity: 0, x: reduce ? 0 : 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      {/* Icon badge */}
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: isGood ? RD.accentGreenBg : RD.dangerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <IconCmp size={12} strokeWidth={2.5} color={badgeColor} />
      </span>

      <span
        style={{
          fontSize: '13px',
          lineHeight: 1.7,
          color: RD.ink,
          textAlign: 'right',
          flex: 1,
        }}
      >
        {text}
      </span>
    </motion.div>
  );
}
