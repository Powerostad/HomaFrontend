import { HeroSection } from './HeroSection';
import { HomeDecisionSection } from './HomeDecisionSection';
import { AudienceNavigation } from './AudienceNavigation';

/** Shared by the static document and the interactive homepage. */
export function HomeIntro({ onStudioStart }: { onStudioStart?: () => void }) {
  return (
    <>
      <AudienceNavigation />
      <HeroSection onGetStarted={onStudioStart} />
      <HomeDecisionSection onStudioStart={onStudioStart} />
    </>
  );
}
