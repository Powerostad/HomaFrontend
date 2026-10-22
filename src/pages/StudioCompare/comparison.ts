import type { ExecutionPlan, SessionDiagnosticsReport, SessionPayload, StudioPerformanceReport } from '../RoomRedesign/services/redesignChatService';

export type ArmKey = 'A' | 'B';
export type Dimension = 'design' | 'products' | 'image';
export type Choice = ArmKey | 'tie' | 'neither' | 'unassessed';
export const dimensions: Dimension[] = ['design', 'products', 'image'];
export interface ComparisonProduct { name: string; need: string; image: string | null; priceToman: number | null; variant: string; reason: string }
export interface ComparisonArm {
  source: string; sessionId: string; versionId: string; model: string; status: 'ready' | 'partial' | 'failed';
  originalImage: string | null; resultImage: string | null; design: string; needs: string[];
  products: ComparisonProduct[]; document: unknown; prompt: string;
  cost: { knownUsd: number | null; textUsd: number | null; imageUsd: number | null; complete: boolean };
  timing: { elapsedMs: number | null; calls: number | null; scope: string };
}
export interface ComparisonVote { choice: Choice; note: string; judge: string; savedAt: string; blind: boolean }
export interface ComparisonCase {
  id: string; title: string; brief: string; originalImage: string | null; order: ArmKey[]; revealed: boolean;
  arms: Record<ArmKey, ComparisonArm | null>; votes: Partial<Record<Dimension, ComparisonVote>>;
}
export const format = 'homa-studio-comparison-v1';
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (value: unknown) => typeof value === 'string' ? value : '';
export const numberOrNull = (value: unknown): number | null => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
export function imageSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function newCase(random = Math.random()): ComparisonCase {
  return { id: crypto.randomUUID(), title: '', brief: '', originalImage: null, order: random < 0.5 ? ['A', 'B'] : ['B', 'A'], revealed: false, arms: { A: null, B: null }, votes: {} };
}
export function replaceArm(item: ComparisonCase, key: ArmKey, arm: ComparisonArm): ComparisonCase {
  return { ...item, originalImage: item.originalImage || arm.originalImage, arms: { ...item.arms, [key]: arm }, votes: {} };
}
export function vote(item: ComparisonCase, dimension: Dimension, choice: Choice, note: string, judge: string): ComparisonCase {
  return { ...item, votes: { ...item.votes, [dimension]: { choice, note, judge, savedAt: new Date().toISOString(), blind: !item.revealed } } };
}
export function totals(cases: ComparisonCase[], dimension: Dimension) {
  const result = { A: 0, B: 0, tie: 0, neither: 0, unassessed: 0 };
  for (const item of cases) result[item.votes[dimension]?.choice || 'unassessed'] += 1;
  return result;
}
function documentInfo(doc: unknown) {
  const root = object(doc);
  const summary = object(root.user_facing_summary);
  const strategy = object(root.improvement_strategy);
  const needs = Array.isArray(root.product_recommendations) ? root.product_recommendations.map(p => string(object(p).product_name_generic)).filter(Boolean) : [];
  const design = [summary.positive_diagnosis, summary.main_improvement_idea, strategy.main_idea, summary.why_these_changes_work, summary.expected_visual_result,
    ...(Array.isArray(summary.top_changes) ? summary.top_changes : [])].filter(v => typeof v === 'string' && v).join('\n\n');
  return { design, needs };
}
function fromRenderRequest(raw: Record<string, unknown>): ComparisonArm {
  const prompt = string(raw.prompt), metadata = object(raw.metadata);
  const marker = prompt.includes('\n\nIMAGE EXECUTION INPUT:\n') ? '\n\nIMAGE EXECUTION INPUT:\n'
    : '\n\nDESIGN AND EXECUTION HANDOFF (owner-excluded analysis sections omitted):\n';
  const start = prompt.indexOf(marker);
  let context: Record<string, unknown> = {};
  if (start >= 0) {
    const rest = prompt.slice(start + marker.length);
    const end = rest.indexOf('\n\nExecution contract:');
    try { context = object(JSON.parse(end < 0 ? rest : rest.slice(0, end))); } catch { /* Full prompt remains available, even if an old packet differs. */ }
  }
  const doc = context.canonical_document || context;
  const info = documentInfo(doc);
  const references = Array.isArray(raw.references) ? raw.references : [];
  const products = references.flatMap(ref => {
    const row = object(ref);
    return (Array.isArray(row.selections) ? row.selections : []).map(selection => {
      const p = object(selection);
      return { name: string(p.name), need: string(p.placement_id), image: null, priceToman: null, variant: string(p.variant_label), reason: '' };
    });
  });
  return { source: '', sessionId: string(metadata.session_id), versionId: string(metadata.design_version_id), model: string(object(metadata.image_provider).model), status: 'partial',
    originalImage: null, resultImage: null, design: info.design || (start >= 0 ? prompt.slice(0, start) : prompt), document: doc, needs: info.needs,
    products, prompt, cost: { knownUsd: null, textUsd: null, imageUsd: null, complete: false }, timing: { elapsedMs: null, calls: null, scope: 'unknown' } };
}
export function fromSession(session: SessionPayload, diagnostics?: SessionDiagnosticsReport, performance?: StudioPerformanceReport, source = ''): ComparisonArm {
  const latest = session.operations?.[0];
  const failedAnalysis = latest?.status === 'failed' && latest.kind !== 'render' || session.status === 'failed' && !latest;
  const version = failedAnalysis ? undefined : session.versions?.[session.versions.length - 1];
  const plan: ExecutionPlan | undefined = failedAnalysis ? undefined : session.current_execution || version?.execution || undefined;
  const document = failedAnalysis ? null : Object.values(plan?.studio_documents || {})[0] || object(diagnostics?.documents?.[0]).document || null;
  const info = documentInfo(document);
  const traces = diagnostics?.traces || [];
  const models = [...new Set(traces.map(t => t.model).filter(Boolean))];
  const handoff = traces.find(t => t.payload_name?.startsWith('handoff-image-'));
  const expenses = diagnostics?.expenses;
  const failed = session.operations?.[0]?.status === 'failed' || session.status === 'failed';
  const running = session.operations?.some(op => op.status === 'running');
  const lastRender = session.operations?.find(op => op.kind === 'render');
  const matchingRender = !lastRender || lastRender.status === 'succeeded' && !!lastRender.result_version_id
    && [version?.version_id, version?.render_version_id].includes(lastRender.result_version_id);
  return {
    source, sessionId: session.session_id, versionId: version?.version_id || '', model: models.join(', '),
    status: failed ? 'failed' : running || (!plan && !version) ? 'partial' : 'ready',
    originalImage: imageSource(session.original_image), resultImage: failed || running || !matchingRender || version?.image_status === 'exported' || version?.image_pending ? null : imageSource(version?.image_url),
    design: info.design || (plan?.free_actions || []).map(a => a.instruction_fa).join('\n'), document, needs: info.needs,
    products: (plan?.purchases || []).map(item => ({ name: item.product?.name || '', need: item.mother_product?.product_name_generic || item.category,
      image: imageSource(item.product?.image_url), priceToman: numberOrNull(item.product?.price_toman),
      variant: item.product?.candidate?.variant_label || '', reason: item.reason_fa })).filter(p => p.name),
    prompt: failedAnalysis ? '' : string(object(handoff?.payload).actual_prompt),
    cost: { knownUsd: numberOrNull(expenses?.known_usd), textUsd: numberOrNull(expenses?.text_usd), imageUsd: numberOrNull(expenses?.image_usd), complete: expenses?.status === 'settled' },
    timing: { elapsedMs: numberOrNull(performance?.summary?.trace_elapsed_timestamp_ms), calls: numberOrNull(performance?.summary?.api_calls), scope: 'session' },
  };
}
export function parseArm(value: unknown): ComparisonArm {
  const raw = object(value);
  if (raw.format === 'homa-studio-arm-v1') return parseArm(raw.arm);
  if (raw.format === 'homa-image-export-v1' && typeof raw.prompt === 'string') return fromRenderRequest(raw);
  if (raw.session && typeof raw.session === 'object') return fromSession(raw.session as SessionPayload, raw.diagnostics as SessionDiagnosticsReport, raw.performance as StudioPerformanceReport, string(raw.source));
  if (Array.isArray(raw.turns) && typeof raw.session_id === 'string') return fromSession(raw as unknown as SessionPayload);
  if (Array.isArray(raw.documents) && Array.isArray(raw.traces)) return fromSession({ session_id: string(raw.session_id), status: 'active', title: '', turns: [] }, raw as unknown as SessionDiagnosticsReport);
  if (!['ready', 'partial', 'failed'].includes(string(raw.status)) || !Array.isArray(raw.products) || typeof raw.design !== 'string') throw new Error('unsupported_snapshot');
  const cost = object(raw.cost), timing = object(raw.timing);
  return { source: string(raw.source), sessionId: string(raw.sessionId), versionId: string(raw.versionId), model: string(raw.model),
    status: raw.status as ComparisonArm['status'], originalImage: imageSource(raw.originalImage), resultImage: imageSource(raw.resultImage),
    design: raw.design, needs: Array.isArray(raw.needs) ? raw.needs.filter((v): v is string => typeof v === 'string') : [], document: raw.document || null, prompt: string(raw.prompt),
    products: raw.products.slice(0, 200).map(p => { const item = object(p); return { name: string(item.name), need: string(item.need), image: imageSource(item.image),
      priceToman: numberOrNull(item.priceToman), variant: string(item.variant), reason: string(item.reason) }; }),
    cost: { knownUsd: numberOrNull(cost.knownUsd), textUsd: numberOrNull(cost.textUsd), imageUsd: numberOrNull(cost.imageUsd), complete: cost.complete === true },
    timing: { elapsedMs: numberOrNull(timing.elapsedMs), calls: numberOrNull(timing.calls), scope: string(timing.scope) || 'unknown' } };
}
export function parseCases(value: unknown): ComparisonCase[] {
  const raw = object(value);
  if (raw.format !== format || !Array.isArray(raw.cases) || !raw.cases.length || raw.cases.length > 50) throw new Error('unsupported_comparison');
  const ids = new Set<string>();
  return raw.cases.map(value => {
    const item = object(value), arms = object(item.arms), savedVotes = object(item.votes);
    const parsed = newCase();
    parsed.id = string(item.id) || parsed.id; parsed.title = string(item.title); parsed.brief = string(item.brief); parsed.originalImage = imageSource(item.originalImage);
    if (ids.has(parsed.id)) parsed.id = crypto.randomUUID();
    ids.add(parsed.id);
    parsed.order = Array.isArray(item.order) && item.order.join(',') === 'B,A' ? ['B', 'A'] : ['A', 'B'];
    parsed.revealed = item.revealed === true;
    parsed.arms = { A: arms.A ? parseArm(arms.A) : null, B: arms.B ? parseArm(arms.B) : null };
    for (const dimension of dimensions) {
      const v = object(savedVotes[dimension]);
      if (['A', 'B', 'tie', 'neither', 'unassessed'].includes(string(v.choice))) parsed.votes[dimension] = {
        choice: v.choice as Choice, note: string(v.note), judge: string(v.judge), savedAt: string(v.savedAt), blind: v.blind === true };
    }
    return parsed;
  });
}
export function localSessionId(value: string): string {
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  if (new RegExp(`^${uuid}$`, 'i').test(value.trim())) return value.trim();
  const url = new URL(value);
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('local_only');
  const match = url.pathname.match(new RegExp(`/studio/chat/(${uuid})/?$`, 'i'));
  if (!match) throw new Error('invalid_session');
  return match[1];
}
