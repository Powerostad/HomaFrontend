import { apiPost, type APIResponse, type RequestOptions } from '@/utils/apiClient';
import { appConfig } from '@/config/appConfig';

export type ChatErrorKind = 'network' | 'auth' | 'server';

export interface ChatSocketEvent {
  event: string;
  data: unknown;
  sessionId?: string;
  operationId?: string;
}

export interface ChatCommandResult {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
  errorKind?: ChatErrorKind;
  aborted?: boolean;
}

interface ChatFrame {
  type?: string;
  request_id?: string;
  event?: string;
  session_id?: string;
  operation_id?: string;
  data?: unknown;
  error?: unknown;
}

type ChatCommandType = 'chat.turn' | 'chat.render' | 'chat.select' | 'chat.dislike';

interface TicketResponse {
  ticket: string;
  expires_in: number;
}

interface RunChatCommandOptions {
  type: ChatCommandType;
  sessionId: string;
  requestId: string;
  payload: unknown;
  signal: AbortSignal;
  onEvent?: (event: ChatSocketEvent) => void;
  onConnectionLost?: () => void;
}

const COMMAND_TIMEOUT_MS = 120_000;
const TURN_TIMEOUT_MS = 180_000;
const RENDER_IDLE_TIMEOUT_MS = 180_000;
const TERMINAL_RENDER_EVENTS = new Set(['image', 'error']);

function websocketUrl(ticket: string): string {
  const url = new URL(appConfig.apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/v1/chat/';
  url.search = `?ticket=${encodeURIComponent(ticket)}`;
  return url.toString();
}

function isAbort(signal: AbortSignal, error?: unknown): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError');
}

function userError(value: unknown): string {
  const raw = typeof value === 'string' ? value : '';
  return /[؀-ۿ]/.test(raw) ? raw : 'خطایی رخ داد. لطفاً دوباره تلاش کن.';
}

function operationIdFromData(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const operationId = (value as { operation_id?: unknown }).operation_id;
  return typeof operationId === 'string' && operationId ? operationId : undefined;
}

async function getTicket(signal: AbortSignal): Promise<ChatCommandResult | { ticket: string }> {
  if (signal.aborted) return { ok: false, status: 0, aborted: true };
  let response: APIResponse<TicketResponse>;
  const options: RequestOptions = { signal };
  try {
    response = await apiPost<TicketResponse>('/realtime/ws-ticket/', {}, options);
  } catch (error) {
    return { ok: false, status: 0, aborted: isAbort(signal, error), errorKind: 'network' };
  }
  if (signal.aborted) return { ok: false, status: 0, aborted: true };
  if (!response.success || typeof response.data?.ticket !== 'string' || !response.data.ticket) {
    return {
      ok: false,
      status: response.statusCode || 0,
      error: response.error,
      errorKind: response.statusCode === 401 ? 'auth' : 'server',
    };
  }
  return { ticket: response.data.ticket };
}

/** Run one chat command over a ticket-authenticated WebSocket. */
export async function runChatCommand(options: RunChatCommandOptions): Promise<ChatCommandResult> {
  const ticket = await getTicket(options.signal);
  if (!('ticket' in ticket)) return ticket;

  let socket: WebSocket;
  try {
    socket = new WebSocket(websocketUrl(ticket.ticket));
  } catch (error) {
    return { ok: false, status: 0, error: userError(error), errorKind: 'network' };
  }

  return new Promise<ChatCommandResult>((resolve) => {
    let settled = false;
    let closed = false;
    let connectionLossNotified = false;
    let expectedOperationId: string | undefined;
    let earlyTerminalPush: ChatFrame | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutMs = options.type === 'chat.turn' ? TURN_TIMEOUT_MS : COMMAND_TIMEOUT_MS;

    const clearTimer = () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = null;
    };
    const armTimer = (duration = timeoutMs) => {
      clearTimer();
      timeoutId = setTimeout(() => {
        if (!settled) {
          notifyConnectionLost();
          finish({
            ok: false,
            status: 408,
            error: 'مهلت ارتباط با سرور تمام شد.',
            errorKind: 'network',
          }, true);
          return;
        }
        notifyConnectionLost();
        close('command timeout');
      }, duration);
    };
    const notifyConnectionLost = () => {
      if (connectionLossNotified) return;
      connectionLossNotified = true;
      options.onConnectionLost?.();
    };
    const abort = () => finish({ ok: false, status: 0, aborted: true }, true);
    const close = (reason: string) => {
      if (closed) return;
      closed = true;
      clearTimer();
      options.signal.removeEventListener('abort', abort);
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState < WebSocket.CLOSING) socket.close(1000, reason);
    };
    const finish = (result: ChatCommandResult, closeSocket: boolean) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
      if (closeSocket) close(result.aborted ? 'command aborted' : 'command complete');
    };

    options.signal.addEventListener('abort', abort, { once: true });
    armTimer();
    socket.onopen = () => {
      if (options.signal.aborted) return abort();
      try {
        socket.send(JSON.stringify({
          type: options.type,
          request_id: options.requestId,
          payload: options.payload,
        }));
      } catch {
        finish({ ok: false, status: 0, errorKind: 'network' }, true);
      }
    };
    socket.onmessage = (message) => {
      if (closed) return;
      let frame: ChatFrame;
      try {
        frame = JSON.parse(String(message.data)) as ChatFrame;
      } catch {
        return;
      }
      if (frame.request_id && frame.request_id !== options.requestId) return;

      const isPush = frame.type === 'chat.event' && !frame.request_id;
      const frameOperationId = typeof frame.operation_id === 'string' && frame.operation_id
        ? frame.operation_id
        : operationIdFromData(frame.data);
      // Worker pushes are fanned out by user. Require both the session and the
      // operation identity before forwarding a push to this command. This
      // protects two tabs and a newer render in the same session from late
      // events belonging to another operation.
      if (frame.type === 'chat.event' && frame.session_id && frame.session_id !== options.sessionId) return;
      if (isPush) {
        if (!frame.session_id || !frameOperationId) return;
        // A very fast worker can publish before chat.render's ack reaches the
        // browser. Hold only its terminal frame until the ack identifies the
        // requested operation; older same-session operations remain ignored.
        if (!expectedOperationId) {
          if (options.type === 'chat.render' && TERMINAL_RENDER_EVENTS.has(frame.event || '')) {
            earlyTerminalPush = frame;
          }
          return;
        }
        if (frameOperationId !== expectedOperationId) return;
      }
      armTimer(settled ? RENDER_IDLE_TIMEOUT_MS : timeoutMs);

      if (frame.type === 'chat.event' && typeof frame.event === 'string') {
        const operationId = frameOperationId;
        if (operationId) expectedOperationId = operationId;
        options.onEvent?.({
          event: frame.event,
          data: frame.data,
          sessionId: frame.session_id,
          operationId,
        });
        if (operationId && (options.type === 'chat.turn' || options.type === 'chat.render')) {
          armTimer(RENDER_IDLE_TIMEOUT_MS);
        }
        if (isPush && TERMINAL_RENDER_EVENTS.has(frame.event)) close('render complete');
        return;
      }
      if (frame.type === 'chat.done') {
        // A text turn may enqueue a durable render. Keep this socket only when
        // the current turn announced a concrete render operation; otherwise
        // release it as soon as the turn completes.
        const keepRenderSocket = options.type === 'chat.turn' && !!expectedOperationId;
        if (keepRenderSocket) armTimer(RENDER_IDLE_TIMEOUT_MS);
        finish({ ok: true, status: 200 }, keepRenderSocket);
        return;
      }
      if (frame.type === 'chat.ack') {
        const operationId = operationIdFromData(frame.data);
        if (options.type === 'chat.render' && operationId) expectedOperationId = operationId;
        const status = typeof frame.data === 'object' && frame.data
          ? (frame.data as { status?: unknown }).status
          : undefined;
        const terminal = typeof status === 'string' && ['ready', 'succeeded', 'duplicate', 'completed'].includes(status);
        const keepRenderSocket = options.type === 'chat.render' && !terminal && !!expectedOperationId;
        if (keepRenderSocket) armTimer(RENDER_IDLE_TIMEOUT_MS);
        finish({ ok: true, status: 200, data: frame.data }, keepRenderSocket);
        if (
          options.type === 'chat.render'
          && !terminal
          && earlyTerminalPush
          && frameOperationId
          && (earlyTerminalPush.operation_id || operationIdFromData(earlyTerminalPush.data)) === frameOperationId
        ) {
          const pending = earlyTerminalPush;
          earlyTerminalPush = null;
          options.onEvent?.({
            event: pending.event || '',
            data: pending.data,
            sessionId: pending.session_id,
            operationId: frameOperationId,
          });
          close('render complete');
        }
        return;
      }
      if (frame.type === 'chat.error') {
        finish({ ok: false, status: 400, error: userError(frame.error), errorKind: 'server' }, true);
      }
    };
    socket.onerror = () => {
      notifyConnectionLost();
      if (!settled) finish({ ok: false, status: 0, errorKind: 'network' }, true);
      else {
        close('socket error');
      }
    };
    socket.onclose = (event) => {
      if (closed) return;
      notifyConnectionLost();
      if (!settled) finish({ ok: false, status: 0, errorKind: event.code === 4401 ? 'auth' : 'network' }, true);
      else {
        close('socket closed');
      }
    };
  });
}
