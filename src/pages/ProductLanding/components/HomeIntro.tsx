import { HeroSection } from './HeroSection';
import { HomeDecisionSection } from './HomeDecisionSection';

/** Shared by the static document and the interactive homepage. */
export function HomeIntro({ onStudioStart }: { onStudioStart?: () => void }) {
  return (
    <>
      <HeroSection onGetStarted={onStudioStart} />
      <HomeDecisionSection onStudioStart={onStudioStart} />
    </>
  );
}
