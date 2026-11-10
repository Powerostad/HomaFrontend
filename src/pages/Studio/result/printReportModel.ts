import type { DiscoveryReview } from '../../RoomRedesign/services/discoveryReview';
import type { StudioResultViewState } from './viewState';

export type PrintReportState = Pick<StudioResultViewState, 'projectName' | 'originalImage' | 'resultImage' | 'analysisOnly' | 'categoryGroups' | 'basketProductIds' | 'productQuantityOverrides' | 'diagnosisDetail'>;

/** Saved data only. A product recommendation reason is not an observed defect. */
export function buildPrintReport(state: PrintReportState, review?: DiscoveryReview) {
  const products = state.categoryGroups.filter(group => group.actionStatus === 'available').flatMap(group => {
    const selected = group.products.filter(product => state.basketProductIds.has(product.id));
    return (selected.length ? selected : group.products.slice(0, 1)).map(product => {
      const index = group.products.findIndex(candidate => candidate.id === product.id);
      const quantity = index === 0 ? group.quantity : state.productQuantityOverrides.get(product.id) ?? group.quantity;
      return { product, quantity, selected:state.basketProductIds.has(product.id), reason:group.recommendationReasonFa, placement:group.designRationaleFa,
        known:!product.priceUnknown && Number.isFinite(product.price) && product.price > 0 };
    });
  });
  const actions = state.categoryGroups.filter(group => group.actionStatus !== 'available');
  return {
    title:state.projectName, before:state.originalImage,
    after:!state.analysisOnly && state.resultImage !== state.originalImage ? state.resultImage : null,
    summary:review?.summary || state.diagnosisDetail || '', direction:review?.direction || '',
    findings:review?.findings.filter(finding => finding.isObservation) ?? [],
    changes:state.categoryGroups.map(group => ({ id:group.itemId, title:group.categoryDisplay, detail:group.actionStatus === 'available' ? group.designRationaleFa : group.actionGuidance || group.designRationaleFa || '', reason:group.recommendationReasonFa })),
    products, layout:actions.filter(group => group.actionKind === 'layout'), services:actions.filter(group => group.actionKind !== 'layout'),
    knownSubtotal:products.reduce((sum, line) => sum + (line.known ? line.product.price * line.quantity : 0), 0),
    unknownCount:products.filter(line => !line.known).length,
  };
}
