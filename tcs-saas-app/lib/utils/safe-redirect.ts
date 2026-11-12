/** Only accept local paths; reject URL parser normalization tricks. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) return '/'
    const url = new URL(value, 'https://local.invalid')
    if (url.origin !== 'https://local.invalid') return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
