// Existing React routes only; no catalogue data is fetched.
const publicPaths = new Set(['/', '/hosts', '/explore', '/collaboration', '/contact', '/faq', '/support', '/privacy', '/terms']);
const redirects = { '/gallery': '/explore', '/shop': '/explore', '/studio/start': '/studio', '/try-on': '/explore', '/try-on/upload': '/explore', '/try-on/progress': '/explore', '/try-on/result': '/explore' };
const privatePaths = /^(?:\/(?:upload|precheck|processing|confirmation|result|error|product-not-found|basket)|\/redesign(?:\/[^/]+)?|\/s\/[^/]+|\/studio(?:\/(?:hosts|upload|progress|projects|accommodation-test)|\/(?:chat|result|project)\/[^/]+)?|\/try-on\/[^/]+\/(?:upload|progress|result)|\/account\/(?:gallery(?:\/[^/]+)?|orders|settings))$/;
export function documentRoute(pathname) {
  if (/%(?:2f|5c|00)/i.test(pathname) || pathname.includes('\\')) return { status: 404 };
  const path = pathname.replace(/\/+$/, '') || '/';
  if (redirects[path]) return { status: 308, location: redirects[path] };
  if (publicPaths.has(path)) return { status: 200, path, public: true };
  if (privatePaths.test(path)) return { status: 200, path, public: false };
  return { status: 404 };
}
