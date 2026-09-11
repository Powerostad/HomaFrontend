import { Footer } from "../../components/Footer";
import { PublicChromeHeader } from "../../seo/PublicChrome";
import { HeroSection } from "./components/HeroSection";
import { TrustBar } from "./components/TrustBar";
import { OutputShowcase } from "./components/OutputShowcase";
import { ComparisonSection } from "./components/ComparisonSection";
import { ShoppingPropSection } from "./components/ShoppingPropSection";

export interface ProductLandingContentProps {
  onStudioStart?: () => void;
  onBrowseCollections?: () => void;
  onCollaborate?: () => void;
}

/** Original landing sections, kept provider-free for the server document. */
export function ProductLandingContent({ onStudioStart, onBrowseCollections, onCollaborate }: ProductLandingContentProps) {
  return <main className="flex-grow"><HeroSection onGetStarted={onStudioStart} /><OutputShowcase onGetStarted={onStudioStart} /><TrustBar /><ComparisonSection onBrowseCollections={onBrowseCollections} /><ShoppingPropSection onCollaborate={onCollaborate} /></main>;
}

export function SeoProductLandingPage({ controllersEnabled = false }: { controllersEnabled?: boolean }) {
  return <div className="min-h-screen bg-surface-page flex flex-col"><PublicChromeHeader controllersEnabled={controllersEnabled} /><ProductLandingContent /><Footer /></div>;
}
