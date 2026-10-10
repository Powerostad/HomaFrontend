import { describe, expect, it } from 'vitest';
import app from '../../App.tsx?raw';
import page from './RoomRedesignPage.tsx?raw';

describe('conversational Studio wiring', () => {
  it('mounts the existing authenticated chat at the primary Studio and resumable session paths', () => {
    for (const path of ['studio', 'studio/chat/:sessionId', 'redesign/:sessionId?']) {
      expect(app).toMatch(new RegExp(`path="${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" element=\\{[\\s\\S]*?<ProtectedRoute fallback="modal">[\\s\\S]*?<RoomRedesignPage`));
    }
    expect(app).toContain('path="studio/upload" element={<StudioUploadPage />}');
    expect(app).toContain('path="studio/result/:jobId" element={<StudioResultPage />}');
  });

  it('keeps new sessions and the new-room action inside Studio', () => {
    expect(page).toContain('navigate(`/studio/chat/${chat.sessionId}`, { replace: true })');
    expect(page).toContain("navigate('/studio')");
    expect(page).toContain('chat.sendTurn({ text: draft })');
  });
});
