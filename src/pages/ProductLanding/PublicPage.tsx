import { Footer } from "../../components/Footer";
import { PublicChromeHeader } from "../../seo/PublicChrome";
import { HomeIntro } from "./components/HomeIntro";
import { HomeDetails } from "./components/HomeDetails";

export interface ProductLandingContentProps {
  onStudioStart?: () => void;
}

/** Shared public content for the initial document and interactive homepage. */
export function ProductLandingContent({ onStudioStart }: ProductLandingContentProps) {
  return <main className="flex-grow"><HomeIntro onStudioStart={onStudioStart} /><HomeDetails onStudioStart={onStudioStart} /></main>;
}

export function SeoProductLandingPage({ controllersEnabled = false }: { controllersEnabled?: boolean }) {
  return <div className="homa-homepage min-h-screen flex flex-col"><PublicChromeHeader controllersEnabled={controllersEnabled} /><div className="h-[64px] md:h-[80px]" /><ProductLandingContent /><Footer /></div>;
}
