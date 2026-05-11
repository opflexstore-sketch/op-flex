/** Prefix root-absolute public paths with Vite `base` (e.g. /op-flex/ on GitHub Pages). */
export function publicUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  const baseTrim = base.replace(/\/$/, '');
  if (!path.startsWith('/')) {
    return `${base}${path}`.replace(/\/{2,}/g, '/');
  }
  if (!baseTrim) return path;
  return `${baseTrim}${path}`;
}
