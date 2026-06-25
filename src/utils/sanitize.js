export function sanitize(input, maxLength = 5000) {
  if (typeof input !== 'string') return ''

  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/"""/g, '"')
    .trim()
    .slice(0, maxLength)
}
