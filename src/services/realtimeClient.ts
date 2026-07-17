import { apiPost } from '@/utils/apiClient';
import { appConfig } from '@/config/appConfig';

export type RealtimeResourceKind = 'try_on' | 'redesign_session' | 'redesign_item_try_on';

export interface RealtimeEvent {
  type: 'job.status';
  version: 1;
  resource: { kind: RealtimeResourceKind; id: string };
  status: string;
  terminal: boolean;
  updated_at: string;
}

export type RealtimeConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unauthorized'
  | 'closed';

interface TicketResponse {
  ticket: string;
  expires_in: number;
}

type EventListener = (event: RealtimeEvent) => void;
type StateListener = (state: RealtimeConnectionState) => void;

const MAX_RECONNECT_DELAY = 30_000;

export function getRealtimeUrl(apiBaseUrl: string, ticket: string): string {
  const apiUrl = new URL(apiBaseUrl);
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  apiUrl.pathname = '/ws/v1/events/';
  apiUrl.search = `?ticket=${encodeURIComponent(ticket)}`;
  return apiUrl.toString();
}

export function parseRealtimeEvent(value: unknown): RealtimeEvent | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as Record<string, unknown>;
  const resource = event.resource as Record<string, unknown> | undefined;
  const validKinds = ['try_on', 'redesign_session', 'redesign_item_try_on'];

  if (
    event.type !== 'job.status' ||
    event.version !== 1 ||
    !resource ||
    typeof resource.id !== 'string' ||
    typeof resource.kind !== 'string' ||
    !validKinds.includes(resource.kind) ||
    typeof event.status !== 'string' ||
    typeof event.terminal !== 'boolean' ||
    typeof event.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    type: 'job.status',
    version: 1,
    resource: {
      kind: resource.kind as RealtimeResourceKind,
      id: resource.id,
    },
    status: event.status,
    terminal: event.terminal,
    updated_at: event.updated_at,
  };
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private stopping = true;
  private state: RealtimeConnectionState = 'idle';
  private readonly eventListeners = new Set<EventListener>();
  private readonly stateListeners = new Set<StateListener>();
  private readonly waiters = new Set<{
    kind: RealtimeResourceKind;
    id: string;
    resolve: (event: RealtimeEvent | null) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  subscribe(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  async connect(): Promise<void> {
    if (!this.stopping && (this.state === 'connecting' || this.state === 'connected')) {
      return;
    }
    if (!this.stopping && this.state === 'reconnecting' && this.reconnectTimer) {
      return;
    }

    this.stopping = false;
    this.setState(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

    let response: Awaited<ReturnType<typeof apiPost<TicketResponse>>>;
    try {
      response = await apiPost<TicketResponse>('/realtime/ws-ticket/', {});
    } catch {
      this.scheduleReconnect();
      return;
    }
    if (!response.success || typeof response.data?.ticket !== 'string' || !response.data.ticket) {
      if (response.statusCode === 401) {
        this.setState('unauthorized');
        return;
      }
      this.scheduleReconnect();
      return;
    }

    if (this.stopping) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(getRealtimeUrl(appConfig.apiBaseUrl, response.data.ticket));
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.setState('connected');
    };
    socket.onmessage = (message) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data as string);
      } catch {
        return;
      }
      const event = parseRealtimeEvent(parsed);
      if (!event) return;
      this.eventListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('[Realtime] Event listener failed', error);
        }
      });
      this.waiters.forEach((waiter) => {
        if (waiter.kind === event.resource.kind && waiter.id === event.resource.id) {
          clearTimeout(waiter.timer);
          waiter.resolve(event);
          this.waiters.delete(waiter);
        }
      });
    };
    socket.onerror = () => socket.close();
    socket.onclose = (event) => {
      if (this.socket === socket) this.socket = null;
      if (this.stopping) return;
      if (event.code === 4401) {
        this.setState('unauthorized');
        return;
      }
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.stopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close(1000, 'client logout');
    this.socket = null;
    this.reconnectAttempt = 0;
    this.setState('closed');
    this.waiters.forEach((waiter) => {
      clearTimeout(waiter.timer);
      waiter.resolve(null);
    });
    this.waiters.clear();
  }

  waitForEvent(kind: RealtimeResourceKind, id: string, timeoutMs = 30_000): Promise<RealtimeEvent | null> {
    if (!this.isConnected()) return Promise.resolve(null);
    return new Promise((resolve) => {
      const waiter = {
        kind,
        id,
        resolve,
        timer: setTimeout(() => {
          this.waiters.delete(waiter);
          resolve(null);
        }, timeoutMs),
      };
      this.waiters.add(waiter);
    });
  }

  private scheduleReconnect(): void {
    if (this.stopping || this.reconnectTimer) return;
    const exponential = Math.min(MAX_RECONNECT_DELAY, 1000 * 2 ** this.reconnectAttempt);
    const jitter = Math.floor(Math.random() * 500);
    this.reconnectAttempt += 1;
    this.setState('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, exponential + jitter);
  }

  private setState(state: RealtimeConnectionState): void {
    this.state = state;
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('[Realtime] State listener failed', error);
      }
    });
  }
}

export const realtimeClient = new RealtimeClient();
