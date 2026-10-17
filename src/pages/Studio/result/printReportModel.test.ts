import { describe, expect, it } from 'vitest';
import { buildPrintReport, type PrintReportState } from './printReportModel';
import type { CategoryGroup } from './types';
const group:CategoryGroup = { itemId:1, category:'rug', categoryDisplay:'Rug', recommendationReasonFa:'A selection reason, not a defect', designRationaleFa:'Under sofa', recommendedSize:'', quantity:2, placements:[], positionInImage:null, actionStatus:'available', interventionTier:'quick_win', impactLevel:'medium',
  products:[{ id:'rug/1', name:'Main', image:'', price:100000, category:'rug' }, { id:'rug/2', name:'Alternative', image:'', price:200000, category:'rug' }] };
const state:PrintReportState = { projectName:'Room', originalImage:'before.jpg', resultImage:'after.jpg', analysisOnly:false, categoryGroups:[group], basketProductIds:new Set(), productQuantityOverrides:new Map(), diagnosisDetail:'Saved summary' };
describe('printable saved design', () => {
  it('prints before and after independently of the comparison view and does not invent findings', () => {
    const report = buildPrintReport(state);
    expect(report.before).toBe('before.jpg'); expect(report.after).toBe('after.jpg');
    expect(report.findings).toEqual([]);
    expect(report.products).toHaveLength(1);
    expect(report.knownSubtotal).toBe(200000);
    expect(buildPrintReport({ ...state, analysisOnly:true }).after).toBeNull();
  });
  it('uses selected alternatives and their quantity without adding unselected alternatives to costs', () => {
    const report = buildPrintReport({ ...state, basketProductIds:new Set(['rug/2']), productQuantityOverrides:new Map([['rug/2', 3]]) });
    expect(report.products.map(line => line.product.id)).toEqual(['rug/2']);
    expect(report.knownSubtotal).toBe(600000);
    expect(report.products[0].selected).toBe(true);
  });
  it('separates layout, services and external sourcing from catalogue products and excludes unknown prices', () => {
    const report = buildPrintReport({ ...state, categoryGroups:[{ ...group, products:[{ ...group.products[0], priceUnknown:true }] }, { ...group, itemId:2, actionStatus:'architectural', actionKind:'service', products:[] }, { ...group, itemId:3, actionStatus:'custom_order', actionKind:'layout', products:[] }] });
    expect(report.products).toHaveLength(1); expect(report.services).toHaveLength(1); expect(report.layout).toHaveLength(1);
    expect(report.knownSubtotal).toBe(0); expect(report.unknownCount).toBe(1);
  });
  it('preserves real findings and solutions but excludes fallback suggestion reasons from the problem list', () => {
    const real = { id:'issue', track:'layout' as const, observation:'Door is obstructed', suggestion:'Move sofa', isObservation:true };
    const report = buildPrintReport(state, { summary:'Stored analysis', direction:'Warm design', findings:[real, { ...real, id:'idea', isObservation:false }] });
    expect(report.findings).toEqual([real]); expect(report.summary).toBe('Stored analysis');
  });
});
