import type { ReactNode } from 'react';
import type { Product } from '../components/ProductDetailSheet';
import type { UseStudioResultReturn } from './useStudioResult';
import type { RefineProduct } from './ProductRefinement';
import type { DiscoveryReview } from '../../RoomRedesign/services/discoveryReview';

/** Both Studio data sources render the same result page. */
export type StudioResultViewState = Pick<UseStudioResultReturn,
  | 'acceptedItems' | 'activeSessionId' | 'analysisOnly' | 'basketProductIds'
  | 'categoryGroups' | 'checklistCheckedIds' | 'completionChecklistItems'
  | 'diagnosisDetail' | 'diagnosisExpanded' | 'expandedWhyGroups'
  | 'handleCancelDownload' | 'handleConfirmDownload' | 'handleDownload'
  | 'handleFinalize' | 'handleImageMarkerClick' | 'handleProductClick'
  | 'handleRequestRedesignCredit' | 'isDownloading' | 'isFinalizing'
  | 'isFullScreen' | 'isInitialized' | 'isLoading' | 'isRequestingRedesignCredit'
  | 'isSaved' | 'navigate' | 'originalImage' | 'priorityRankedIds'
  | 'productAlternatives' | 'productQuantityOverrides' | 'projectName'
  | 'recommendedTotalPrice' | 'resultImage' | 'scrollToCard' | 'selectedCount'
  | 'selectedPrice' | 'selectedProduct' | 'sessionId' | 'setDiagnosisExpanded'
  | 'setIsFullScreen' | 'setIsSaved' | 'setSelectedProduct' | 'setShowExitDecision'
  | 'setShowOriginal' | 'showDownloadReady' | 'showExitDecision' | 'showOriginal'
  | 'targetStyle' | 'tierGroups' | 'toggleAcceptedItem' | 'toggleBasketProduct'
  | 'toggleChecklistItem' | 'toggleWhyExpanded' | 'updateItemQuantity'
  | 'updateProductQuantity'
> & Partial<Pick<UseStudioResultReturn, 'harmonyScore' | 'projectedScore' | 'liveProjectedScore'>>;

export interface StudioResultConversation {
  open: boolean;
  compact: boolean;
  onOpen: () => void;
  onClose?: () => void;
  onExit: () => void;
  panel: ReactNode;
  toolbar: ReactNode;
  status: ReactNode;
  details: ReactNode;
  afterReport: ReactNode;
  busy: boolean;
  priceUnknown: boolean;
  onImageError: () => void;
  onPreview: (product: Product) => void;
  onRefineProduct?: RefineProduct;
  printReview?: DiscoveryReview;
}
