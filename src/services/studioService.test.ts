// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRedesignSession } from './studioService';
import { normalizeImagePlacementMarker } from './placementMarkers';

const apiUploadMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiUpload: apiUploadMock,
  apiDelete: vi.fn(),
  apiConfig: { baseURL: '' },
  getStoredTokens: vi.fn(() => ({ access: 'test-access', refresh: 'test-refresh' })),
}));

vi.mock('@/utils/imageConversion', () => ({
  convertHeicToJpeg: vi.fn(async (file: File) => file),
}));

const originalImage = globalThis.Image;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  apiUploadMock.mockReset();
  apiUploadMock.mockResolvedValue({
    success: true,
    data: { session_id: 'session-1', status: 'pending' },
  });

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: class MockImage {
      naturalWidth = 100;
      naturalHeight = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  });
});

afterEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: originalCreateObjectURL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: originalRevokeObjectURL,
  });
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: originalImage,
  });
});

describe('Studio image placement markers', () => {
  it('accepts normalized coordinates and trims an optional label', () => {
    expect(normalizeImagePlacementMarker({ x: 0.2, y: 0.8, label: '  فرش  ' })).toEqual({
      x: 0.2,
      y: 0.8,
      label: 'فرش',
    });
  });

  it.each([
    null,
    undefined,
    { x: -0.1, y: 0.5 },
    { x: 0.5, y: 1.1 },
    { x: '0.5', y: 0.5 },
    { x: Number.NaN, y: 0.5 },
  ])('rejects an invalid marker: %j', (value) => {
    expect(normalizeImagePlacementMarker(value)).toBeNull();
  });

  it('does not fabricate a marker when the backend omits coordinates', () => {
    expect(normalizeImagePlacementMarker({ label: 'جایگزین' })).toBeNull();
  });
});

describe('Studio session creation', () => {
  it('sends the no-image choice when retrying an opted-out session', async () => {
    const roomImage = new File(['room'], 'room.png', { type: 'image/png' });

    const result = await createRedesignSession(roomImage, {
      skipImageGeneration: true,
    });

    expect(result).toEqual({
      success: true,
      data: { sessionId: 'session-1', status: 'pending' },
    });
    expect(apiUploadMock).toHaveBeenCalledWith(
      '/recommendations/sessions/',
      roomImage,
      'room_image',
      { skip_image_generation: 'true' },
      undefined,
    );
  });
});
