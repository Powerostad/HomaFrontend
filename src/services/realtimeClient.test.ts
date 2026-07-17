// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { parseRealtimeEvent, getRealtimeUrl } from './realtimeClient';

describe('realtime protocol', () => {
  it('accepts the versioned job status envelope', () => {
    expect(parseRealtimeEvent({
      type: 'job.status',
      version: 1,
      resource: { kind: 'try_on', id: 'task-1' },
      status: 'completed',
      terminal: true,
      updated_at: '2026-07-17T12:34:56Z',
    })).toEqual({
      type: 'job.status',
      version: 1,
      resource: { kind: 'try_on', id: 'task-1' },
      status: 'completed',
      terminal: true,
      updated_at: '2026-07-17T12:34:56Z',
    });
  });

  it('ignores unknown or malformed events', () => {
    expect(parseRealtimeEvent({ type: 'job.status', version: 2 })).toBeNull();
    expect(parseRealtimeEvent({ type: 'other', version: 1 })).toBeNull();
  });

  it('maps the API URL to the WebSocket URL', () => {
    expect(getRealtimeUrl('https://api.example.com', 'ticket')).toBe(
      'wss://api.example.com/ws/v1/events/?ticket=ticket',
    );
    expect(getRealtimeUrl('http://localhost:8000/', 'ticket')).toBe(
      'ws://localhost:8000/ws/v1/events/?ticket=ticket',
    );
  });
});
