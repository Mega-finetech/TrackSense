export function resolveApiUrl(value: string | undefined, fallback: string): string {
  if (!value?.trim()) return fallback;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    // Accept either the server origin or the documented /api base.
    url.pathname = url.pathname.replace(/\/+$/, '') || '/api';
    return url.toString().replace(/\/$/, '');
  } catch { return ''; }
}
