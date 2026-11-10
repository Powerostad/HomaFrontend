import { describe, expect, it } from 'vitest';
import app from '../../App.tsx?raw';
import page from './RoomRedesignPage.tsx?raw';

describe('conversational Studio wiring', () => {
  it('shares the deferred-auth entry and session boundary while retaining legacy job routes', () => {
    for (const path of ['studio', 'studio/chat/:sessionId']) {
      expect(app).toMatch(new RegExp(`path="${path}" element=\\{[^}]*?<StudioStartPage`));
    }
    expect(app).toContain('path="studio/hosts" element={<StudioStartPage host />}');
    expect(app).toContain('path="studio/upload" element={<StudioUploadPage />}');
    expect(app).toContain('path="studio/result/:jobId" element={<StudioResultPage />}');
  });

  it('keeps new sessions and the new-room action inside Studio', () => {
    expect(page).toContain('navigate(`/studio/chat/${chat.sessionId}`, { replace: true })');
    expect(page).toContain("navigate('/studio')");
    expect(page).toContain('chat.sendTurn({ text: draft })');
  });
});
