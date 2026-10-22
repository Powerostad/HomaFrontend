import { getStoredTokens, refreshAccessToken } from '@/utils/apiClient';
import { fromSession, type ArmKey, type ComparisonArm, type ComparisonCase } from './comparison';
import type { SessionPayload, SessionDiagnosticsReport, StudioPerformanceReport } from '../RoomRedesign/services/redesignChatService';

export interface RuntimeInfo { profile: 'server' | 'local'; revision: string; image_generation: false; catalogue: string; products: number; model: string; prompt: string }
export interface LiveRun { sessionId: string; status: 'running' | 'complete' | 'failed' | 'unknown'; stage: string; startedAt: string; finishedAt?: string; runtime: RuntimeInfo }
const profiles = { A: 'server', B: 'local' } as const;
function prefix(key: ArmKey) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'studio-local' || !['127.0.0.1', 'localhost'].includes(location.hostname)) throw new Error('local_only');
  return `/__studio_ab/${profiles[key]}`;
}
async function request<T>(key: ArmKey, path: string, body?: unknown, refreshed = false): Promise<T> {
  const token = getStoredTokens()?.access;
  if (!token) throw new Error('auth');
  const response = await fetch(`${prefix(key)}/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 401 && !refreshed && await refreshAccessToken()) return request<T>(key, path, body, true);
  if (!response.ok) throw new Error(`read_${response.status}`);
  const json = await response.json();
  if (!json.success || !json.data) throw new Error('response');
  return json.data as T;
}
export async function preflight(): Promise<Record<ArmKey, RuntimeInfo>> {
  const [A, B] = await Promise.all((['A', 'B'] as ArmKey[]).map(key => request<RuntimeInfo>(key, 'recommendations/chat/local-comparison/')));
  if (A.profile !== 'server' || B.profile !== 'local' || A.image_generation !== false || B.image_generation !== false
    || A.catalogue !== B.catalogue || A.products !== B.products || A.model !== B.model) throw new Error('runtime_mismatch');
  return { A, B };
}
function turn(key: ArmKey, sessionId: string, brief: string, image: string, onStage: (stage: string) => void): Promise<void> {
  return request<{ ticket: string }>(key, 'realtime/ws-ticket/', {}).then(({ ticket }) => new Promise<void>((resolve, reject) => {
    const url = new URL(`${prefix(key)}/ws/v1/chat/`, location.origin); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'; url.searchParams.set('ticket', ticket);
    const socket = new WebSocket(url); const requestId = crypto.randomUUID(); let finished = false;
    const end = (error?: Error) => { if (finished) return; finished = true; clearTimeout(timer); socket.close(); error ? reject(error) : resolve(); };
    // No resubmission on timeout or disconnect. The saved session can be read again.
    const timer = setTimeout(() => end(new Error('connection_unknown')), 35 * 60_000);
    socket.onopen = () => socket.send(JSON.stringify({ type: 'chat.turn', request_id: requestId, payload: {
      session_id: sessionId, text: brief, text_origin: 'user', images: [image], action: 'chat', idempotency_key: requestId,
    } }));
    socket.onmessage = event => {
      let frame; try { frame = JSON.parse(String(event.data)); } catch { return; }
      if (frame.request_id !== requestId) return;
      if (frame.type === 'chat.event' && frame.event === 'stage') onStage(frame.data?.label_fa || '');
      if (frame.type === 'chat.event' && frame.event === 'error' || frame.type === 'chat.error') end(new Error('model_failed'));
      if (frame.type === 'chat.done') end();
    };
    socket.onerror = () => end(new Error('connection_unknown'));
    socket.onclose = () => { if (!finished) end(new Error('connection_unknown')); };
  }));
}
export async function readLiveArm(key: ArmKey, run: LiveRun): Promise<{ arm: ComparisonArm; run: LiveRun }> {
  const path = `recommendations/chat/sessions/${run.sessionId}/`;
  const [session, diagnostics, performance] = await Promise.allSettled([
    request<SessionPayload>(key, path), request<SessionDiagnosticsReport>(key, path + 'diagnostics/'), request<StudioPerformanceReport>(key, path + 'performance/'),
  ]);
  if (session.status !== 'fulfilled') throw new Error('session_unavailable');
  const arm = fromSession(session.value, diagnostics.status === 'fulfilled' ? diagnostics.value : undefined,
    performance.status === 'fulfilled' ? performance.value : undefined,
    `${profiles[key]} · ${run.runtime.revision} · ${run.runtime.prompt}`);
  arm.resultImage = null; // This comparison never associates earlier renders with a new run.
  arm.model = arm.model || run.runtime.model;
  const running = session.value.operations?.some(op => op.status === 'running');
  const failed = arm.status === 'failed';
  const next = { ...run, status: running ? 'running' : failed ? 'failed' : session.value.operations?.length ? 'complete' : 'unknown',
    stage: '', ...(running ? {} : { finishedAt: run.finishedAt || new Date().toISOString() }) } as LiveRun;
  return { arm, run: next };
}
export async function runLiveArm(key: ArmKey, item: ComparisonCase, runtime: RuntimeInfo,
  onProgress: (run: LiveRun) => void, onOutput: (arm: ComparisonArm, run: LiveRun) => void) {
  const startedAt = new Date().toISOString();
  const created = await request<{ session_id: string }>(key, 'recommendations/chat/sessions/', key === 'B'
    ? { prompt_split: 'server-split-v1', search_version: 'studio-search-v2', product_taxonomy_version: 'product-taxonomy-v1', product_identity_version: 'product-identity-v1' } : {});
  let run: LiveRun = { sessionId: created.session_id, status: 'running', stage: '', startedAt, runtime };
  onProgress(run);
  let failure = '';
  try { await turn(key, run.sessionId, item.brief, item.originalImage!, stage => { run = { ...run, stage }; onProgress(run); }); }
  catch (error) { failure = error instanceof Error ? error.message : 'connection_unknown'; }
  run = { ...run, status: failure === 'connection_unknown' ? 'unknown' : failure ? 'failed' : 'complete', finishedAt: new Date().toISOString(), stage: '' };
  onProgress(run);
  try {
    const output = await readLiveArm(key, run);
    if (failure === 'model_failed') { output.arm.status = 'failed'; output.run.status = 'failed'; }
    onOutput(output.arm, output.run);
  } catch { onProgress({ ...run, status: failure === 'model_failed' ? 'failed' : 'unknown' }); }
}
