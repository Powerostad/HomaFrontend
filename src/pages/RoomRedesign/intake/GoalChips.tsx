/**
 * GoalChips — multi-select goal chip group with staggered entrance animation.
 *
 * Renders a label + helper text then a flex-wrap row of pill Chips from GOALS.
 * Each chip animates in with a 40ms stagger; motion is gated via useReducedMotion.
 */
import { motion, useReducedMotion } from 'motion/react';
import { RD } from '../theme';
import { Chip } from '../components/chat';
import { INTAKE_COPY } from './intakeCopy';
import { GOALS, type Goal } from './intakeTypes';

interface GoalChipsProps {
  selected: Set<Goal>;
  onToggle: (g: Goal) => void;
}

export function GoalChips({ selected, onToggle }: GoalChipsProps): JSX.Element {
  const reduce = useReducedMotion();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: 'Vazirmatn, sans-serif',
        direction: 'rtl',
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
        {INTAKE_COPY.review.goalsLabel}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: RD.inkMuted,
          textAlign: 'right',
          lineHeight: '1.6',
        }}
      >
        {INTAKE_COPY.review.goalsHelper}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {GOALS.map((g, i) => (
          <motion.div
            key={g.value}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.04, duration: 0.2, ease: 'easeOut' }}
            style={{ display: 'inline-flex' }}
          >
            <Chip
              chip={{ id: g.value, label: g.label, icon: g.icon }}
              selected={selected.has(g.value)}
              variant="pill"
              onClick={() => onToggle(g.value)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
