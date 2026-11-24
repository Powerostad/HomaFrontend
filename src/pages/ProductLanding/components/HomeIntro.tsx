import { HeroSection } from './HeroSection';
import { HomeDecisionSection } from './HomeDecisionSection';

export function HomeIntro({ onStudioStart }: { onStudioStart?: () => void }) {
  return <><HeroSection onGetStarted={onStudioStart} /><HomeDecisionSection onStudioStart={onStudioStart} /></>;
}
