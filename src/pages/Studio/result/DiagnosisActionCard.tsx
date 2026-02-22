/**
 * DiagnosisActionCard — Types & Icon Utilities
 */
import {
  Sofa,
  Lamp,
  Palette,
  LayoutGrid,
  TrendingUp,
  Ruler,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

export type DiagnosisStatus = 'good' | 'warning' | 'critical';

export type IconType =
  | 'furniture'
  | 'lighting'
  | 'boundary'
  | 'color'
  | 'growth'
  | 'proportion'
  | 'default';

export interface DiagnosisAction {
  id: number;
  status: DiagnosisStatus;
  title: string;
  diagnosis: string;
  solution: string;
  ctaText: string;
  linkedItemId?: number;
  harmonyImpact?: number;
  iconType?: IconType;
}

const ICON_MAP: Record<IconType, LucideIcon> = {
  furniture: Sofa,
  lighting: Lamp,
  boundary: LayoutGrid,
  color: Palette,
  growth: TrendingUp,
  proportion: Ruler,
  default: Sparkles,
};

export function getDescriptiveIcon(status: DiagnosisStatus, iconType?: IconType): LucideIcon {
  if (status === 'good') return CheckCircle2;
  return ICON_MAP[iconType || 'default'];
}
