// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runChatCommand } from './chatWebSocket';
import { apiPost } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({ apiPost: vi.fn() }));
vi.mock('@/config/appConfig', () => ({ appConfig: { apiBaseUrl: 'https://site.example' } }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (s: string) => s }));

class Socket {
  static CLOSING = 2;
  static instances: Socket[] = [];
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; });
  constructor() { Socket.instances.push(this); }
  frame(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
beforeEach(() => {
  vi.useFakeTimers();
  Socket.instances = [];
  vi.stubGlobal('WebSocket', Socket);
  vi.mocked(apiPost).mockResolvedValue({ success: true, data: { ticket: 'test' } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
async function start(type: 'chat.turn' | 'chat.render' = 'chat.turn') {
  const onEvent = vi.fn();
  const onConnectionLost = vi.fn();
  const controller = new AbortController();
  const result = runChatCommand({ type, sessionId: 'session', requestId: 'request', payload: {},
    signal: controller.signal, onEvent, onConnectionLost });
  await Promise.resolve(); await Promise.resolve();
  const socket = Socket.instances[0];
  socket.onopen?.();
  return { socket, result, onEvent, onConnectionLost, controller };
}
const push = (operation = 'render', session = 'session') => ({ type: 'chat.event',
  session_id: session, operation_id: operation, event: 'image', data: { url: 'image' } });

describe('durable Studio socket lifecycle', () => {
  it('keeps a pending render socket open after text completion and receives the image', async () => {
    const { socket, result, onEvent } = await start();
    socket.frame({ type: 'chat.event', request_id: 'request', event: 'render_pending', data: { operation_id: 'render' } });
    socket.frame({ type: 'chat.done', request_id: 'request' });
    expect(await result).toMatchObject({ ok: true });
    expect(socket.close).not.toHaveBeenCalled();
    socket.frame(push());
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ event: 'image', operationId: 'render' }));
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it('closes a text-only socket immediately', async () => {
    const { socket, result } = await start();
    socket.frame({ type: 'chat.done', request_id: 'request' });
    await result;
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it('keeps a non-terminal render acknowledgement open', async () => {
    const { socket, result } = await start('chat.render');
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'running', operation_id: 'render' } });
    await result;
    expect(socket.close).not.toHaveBeenCalled();
    socket.frame(push());
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it('closes an already completed render acknowledgement', async () => {
    const { socket, result } = await start('chat.render');
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'succeeded', operation_id: 'render' } });
    await result;
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it('does not accept another session or another operation image', async () => {
    const { socket, result, onEvent, controller } = await start('chat.render');
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'running', operation_id: 'render' } });
    await result;
    socket.frame(push('old')); socket.frame(push('render', 'other'));
    expect(onEvent).not.toHaveBeenCalled();
    controller.abort();
  });
  it('recovers a terminal image arriving before the render acknowledgement', async () => {
    const { socket, result, onEvent } = await start('chat.render');
    socket.frame(push());
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'running', operation_id: 'render' } });
    await result;
    expect(onEvent).toHaveBeenCalledOnce();
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it('notifies recovery when a pending render connection is lost', async () => {
    const { socket, result, onConnectionLost } = await start('chat.render');
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'running', operation_id: 'render' } });
    await result;
    socket.onclose?.({ code: 1006 });
    expect(onConnectionLost).toHaveBeenCalledOnce();
  });
  it('bounds waiting when a render push is missed', async () => {
    const { socket, result, onConnectionLost } = await start('chat.render');
    socket.frame({ type: 'chat.ack', request_id: 'request', data: { status: 'running', operation_id: 'render' } });
    await result;
    await vi.advanceTimersByTimeAsync(180_001);
    expect(onConnectionLost).toHaveBeenCalledOnce();
    expect(socket.close).toHaveBeenCalledOnce();
  });
});
