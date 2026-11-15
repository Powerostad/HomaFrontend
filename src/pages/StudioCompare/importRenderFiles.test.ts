// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { importRenderFiles } from './importRenderFiles';

it('maps extracted reference photos to their selected products without creating a rendered image', async () => {
  const raw = { format: 'homa-image-export-v1', prompt: 'FULL UNCHANGED PROMPT', references: [
    { file: 'images/reference-01.png' }, { file: 'images/reference-02.png', selections: [{ name: 'فرش' }] },
  ] };
  const request = new File([JSON.stringify(raw)], 'request.json', { type: 'application/json' });
  // jsdom File does not implement text(); browsers do.
  Object.defineProperty(request, 'text', { value: async () => JSON.stringify(raw) });
  const original = new File(['original'], 'reference-01.png', { type: 'image/png' });
  const product = new File(['product'], 'reference-02.png', { type: 'image/png' });
  const arm = await importRenderFiles([request, original, product]);
  expect(arm.originalImage).toBe('data:image/png;base64,b3JpZ2luYWw=');
  expect(arm.products[0].image).toBe('data:image/png;base64,cHJvZHVjdA==');
  expect(arm.resultImage).toBeNull();
  expect(arm.prompt).toBe(raw.prompt);
  await expect(importRenderFiles([request, original])).rejects.toThrow('reference_missing');
});
