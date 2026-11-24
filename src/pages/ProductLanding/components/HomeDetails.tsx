import { HomeJourney } from './HomeJourney';
import { HomePreserve } from './HomePreserve';
import { HomeShopping } from './HomeShopping';
import { HomeJournal } from './HomeJournal';
import { HomeFaq } from './HomeFaq';

export function HomeDetails({ onStudioStart }: { onStudioStart?: () => void }) {
  return <><HomeJourney /><HomePreserve onStudioStart={onStudioStart} /><HomeShopping onStudioStart={onStudioStart} /><HomeJournal /><HomeFaq onStudioStart={onStudioStart} /></>;
}
