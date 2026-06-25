export function sanitize(str, max = 5000) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .trim()
    .slice(0, max);
}