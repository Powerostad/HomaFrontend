import { parseArm, type ComparisonArm } from './comparison';

/** Read extracted export files locally. No ZIP dependency, server upload or model. */
export async function importRenderFiles(files: File[]): Promise<ComparisonArm> {
  if (files.length > 30 || files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) throw new Error('too_large');
  const request = files.find(file => file.name === 'request.json');
  if (!request) throw new Error('request_missing');
  const raw = JSON.parse(await request.text()) as { format?: string; references?: { file: string; sha256?: string; selections?: { name?: string }[] }[]; additional_original?: string };
  if (raw.format !== 'homa-image-export-v1' || !Array.isArray(raw.references) || !raw.references.length) throw new Error('request_invalid');
  const arm = parseArm(raw);
  let productIndex = 0;
  for (let index = 0; index < raw.references.length; index++) {
    const ref = raw.references[index];
    const file = files.find(file => file.name === ref.file.split('/').pop());
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) throw new Error('reference_missing');
    if (ref.sha256) {
      const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      if (Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('') !== ref.sha256) throw new Error('reference_changed');
    }
    const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
    if (index === 0) arm.originalImage = src;
    for (let i = 0; i < (ref.selections?.length || 0); i++) { if (arm.products[productIndex]) arm.products[productIndex].image = src; productIndex += 1; }
  }
  if (raw.additional_original) {
    const original = files.find(file => file.name === raw.additional_original!.split('/').pop());
    if (!original || !['image/png', 'image/jpeg', 'image/webp'].includes(original.type) || original.size > 12 * 1024 * 1024) throw new Error('original_missing');
    arm.originalImage = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(original); });
  }
  return arm;
}
