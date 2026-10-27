import { format, parseCases, type ComparisonCase } from './comparison';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('homa-studio-comparison', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('workspaces');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}
export async function loadWorkspace(owner: string): Promise<ComparisonCase[] | null> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction('workspaces').objectStore('workspaces').get(owner);
    request.onsuccess = () => { try { resolve(request.result ? parseCases(request.result) : null); } catch (error) { reject(error); } };
    request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
async function writeWorkspace(owner: string, cases: ComparisonCase[]): Promise<void> {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspaces', 'readwrite');
    tx.objectStore('workspaces').put({ format, cases }, owner);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  }); } finally { db.close(); }
}
let writes = Promise.resolve();
export function saveWorkspace(owner: string, cases: ComparisonCase[]): Promise<void> {
  const next = writes.catch(() => {}).then(() => writeWorkspace(owner, cases));
  writes = next;
  return next;
}
