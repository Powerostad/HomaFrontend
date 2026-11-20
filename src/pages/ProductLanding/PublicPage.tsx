import { Footer } from "../../components/Footer";
import { HomeNavigation } from "../../components/HomeNavigation";
import { HomeScrollExperience } from "./components/HomeScrollExperience";

export interface ProductLandingContentProps {
  onStudioStart?: () => void;
}

/** Shared public content for the initial document and interactive homepage. */
export function ProductLandingContent({ onStudioStart }: ProductLandingContentProps) {
  return <main className="flex-grow"><HomeScrollExperience onStudioStart={onStudioStart} /></main>;
}

export function SeoProductLandingPage() {
  return <div className="homa-homepage min-h-screen flex flex-col"><HomeNavigation /><ProductLandingContent /><Footer /></div>;
}
