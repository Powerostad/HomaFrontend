import type { ExecutionPlan } from './redesignChatService';
import { purchaseKey } from './planChanges';

export interface JourneyFinding {
  id: string; title: string; kind: string; before: string; recommendation: string; reason: string;
  purchaseKey?: string;
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown) => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const ids = (value: unknown) => Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];

/** All prose is copied from the canonical document. Missing reasons stay missing. */
export function journeyFindings(plan: ExecutionPlan | null): JourneyFinding[] {
  const findings: JourneyFinding[] = [];
  const documents = Object.entries(plan?.studio_documents || {});
  for (const [scene, doc] of documents) {
    const document = object(doc), analysis = object(document.room_analysis);
    const issues: Array<Record<string, unknown> & { key: string }> = [
      ...rows(object(analysis.layout_evaluation).layout_issues).map(issue => ({ ...issue, key: text(issue.issue_id) })),
      ...rows(object(analysis.harmony_diagnosis).main_conflicts).map(issue => ({ ...issue, key: text(issue.conflict_id) })),
      ...rows(object(analysis.function_diagnosis).functional_issues).map(issue => ({ ...issue, key: text(issue.function_issue_id) })),
      ...rows(object(analysis.surface_finish_diagnosis).surface_issues).map(issue => ({ ...issue, key: text(issue.surface_issue_id) })),
    ];
    const covered = new Set<string>();
    const link = (product: Record<string, unknown> | undefined) => {
      if (!product) return undefined;
      const id = text(product.item_id);
      const purchase = plan?.purchases.find(item => item.source_item_id === `${scene}:${id}` ||
        (documents.length === 1 && (item.mother_product?.item_id === id || item.item_id === id)));
      return purchase ? purchaseKey(purchase) : undefined;
    };
    for (const [index, item] of rows(document.existing_items_decision).entries()) {
      const recommendation = text(item.action_instruction), reason = text(item.decision_reason);
      if (!recommendation && !reason) continue;
      const related = ids(item.related_issue_ids);
      related.forEach(id => covered.add(id));
      findings.push({ id: `${scene}:existing:${text(item.existing_item_id) || index}`, title: text(item.item_name),
        kind: text(item.decision), before: issues.filter(issue => related.includes(issue.key)).map(issue => text(issue.evidence)).filter(Boolean).join('\n') || text(item.visible_evidence),
        recommendation, reason });
    }
    for (const [index, fix] of rows(document.layout_fix_plan).entries()) {
      const id = text(fix.resolves_issue_id), recommendation = text(fix.specific_instruction);
      if (!recommendation || (id && covered.has(id))) continue;
      if (id) covered.add(id);
      findings.push({ id: `${scene}:layout:${id || index}`, title: text(fix.target_item), kind: text(fix.action_type),
        before: text(issues.find(issue => issue.key === id)?.evidence), recommendation, reason: text(fix.why_it_works) });
    }
    for (const product of rows(document.product_recommendations)) {
      const related = ids(product.related_issue_ids), recommendation = text(product.placement_instruction), reason = text(product.why_needed);
      if (!recommendation && !reason) continue;
      related.forEach(id => covered.add(id));
      findings.push({ id: `${scene}:product:${text(product.item_id)}`, title: text(product.product_name_generic),
        kind: object(product.shopping_attributes).replace_existing === true ? 'replace' : text(product.recommendation_type) === 'surface_upgrade' ? '' : 'add',
        before: issues.filter(issue => related.includes(issue.key)).map(issue => text(issue.evidence)).filter(Boolean).join('\n'),
        recommendation, reason, purchaseKey: link(product) });
    }
    for (const issue of issues) {
      if (covered.has(issue.key) || !text(issue.evidence)) continue;
      findings.push({ id: `${scene}:issue:${issue.key}`, title: '', kind: '', before: text(issue.evidence), recommendation: '', reason: '' });
    }
  }
  const seen = new Set<string>();
  return findings.filter(finding => {
    const key = [finding.before, finding.recommendation, finding.reason].join('|').replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

const key = (session: string) => `homa.studio.result-journey-v2:${session}`;
const memory = new Set<string>();
export function journeySeen(session: string) {
  try { return localStorage.getItem(key(session)) === 'seen'; } catch { return memory.has(session); }
}
export function journeyPending(session: string) {
  try { return localStorage.getItem(key(session)) === 'pending'; } catch { return false; }
}
export function markJourneyPending(session: string) {
  if (journeySeen(session)) return;
  try { localStorage.setItem(key(session), 'pending'); } catch { /* Reload memory is optional. */ }
}
export function markJourneySeen(session: string) {
  try { localStorage.setItem(key(session), 'seen'); memory.delete(session); } catch { memory.add(session); }
}

/** Image-only retries never resubmit analysis/design or incur model charges. */
export function prepareResultImages(urls: string[], signal: AbortSignal, timeoutMs = 15000): Promise<void> {
  return Promise.all([...new Set(urls)].map(url => new Promise<void>((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; clearTimeout(timer); image.onload = null; image.onerror = null;
      signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve();
    };
    const abort = () => finish(new Error('image_preparation_cancelled'));
    const timer = setTimeout(() => finish(new Error('image_preparation_timeout')), timeoutMs);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    image.onerror = () => finish(new Error('image_unavailable'));
    image.onload = () => {
      if (!image.naturalWidth) { finish(new Error('image_empty')); return; }
      if (typeof image.decode === 'function') image.decode().then(() => finish(), () => finish(new Error('image_decode_failed')));
      else finish();
    };
    image.src = url;
  }))).then(() => undefined);
}
