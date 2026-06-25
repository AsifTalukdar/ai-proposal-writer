export function sanitize(text, maxLen = 5000) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen)
}