const CONFIG = {
  UPSTREAM_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_URL: 'https://api.openai.com/v1/chat/completions',
  TIMEOUT_MS: 25000,
  MAX_BODY_SIZE: 1024 * 50,
  MAX_MESSAGES: 5,
  MAX_CONTENT_LENGTH: 6000,
  MAX_TOKENS_LIMIT: 2000,
  ALLOWED_MODELS: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-3.5-turbo',
    'mistralai/mistral-7b-instruct:free',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'google/gemini-pro-1.5'
  ],
  ALLOWED_ROLES: ['system', 'user', 'assistant'],
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 10,
  APP_TITLE: 'ProposalAI'
}

const rateLimitStore = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const rec = rateLimitStore.get(ip)
  if (!rec || now - rec.start > CONFIG.RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { start: now, count: 1 })
    return { ok: true, remaining: CONFIG.RATE_LIMIT_MAX - 1 }
  }
  rec.count++
  if (rec.count > CONFIG.RATE_LIMIT_MAX) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((rec.start + CONFIG.RATE_LIMIT_WINDOW_MS - now) / 1000)
    }
  }
  return { ok: true, remaining: CONFIG.RATE_LIMIT_MAX - rec.count }
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, r] of rateLimitStore) {
    if (now - r.start > CONFIG.RATE_LIMIT_WINDOW_MS * 2) rateLimitStore.delete(ip)
  }
}, 120000)

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown'
}

function originAllowed(req) {
  const appUrl = process.env.APP_URL || ''
  if (!appUrl) return true
  const origins = [appUrl, appUrl.replace(/\/$/, ''), 'http://localhost:5173', 'http://localhost:3000']
  const o = req.headers.origin || ''
  const r = req.headers.referer || ''
  return origins.some(a => o.startsWith(a) || r.startsWith(a))
}

function clean(s, max) {
  if (typeof s !== 'string') return ''
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/[<>]/g, '').trim().slice(0, max)
}

function validate(body) {
  const e = []
  if (!body || typeof body !== 'object') return ['Invalid body.']
  if (!body.model || !CONFIG.ALLOWED_MODELS.includes(body.model))
    e.push(`Model not allowed. Use: ${CONFIG.ALLOWED_MODELS[0]}`)
  if (!Array.isArray(body.messages) || body.messages.length === 0)
    e.push('Messages required.')
  if (Array.isArray(body.messages) && body.messages.length > CONFIG.MAX_MESSAGES)
    e.push(`Max ${CONFIG.MAX_MESSAGES} messages.`)
  if (Array.isArray(body.messages)) {
    body.messages.forEach((m, i) => {
      if (!CONFIG.ALLOWED_ROLES.includes(m?.role)) e.push(`Msg ${i}: bad role.`)
      if (typeof m?.content !== 'string' || !m.content.trim()) e.push(`Msg ${i}: empty content.`)
      if (typeof m?.content === 'string' && m.content.length > CONFIG.MAX_CONTENT_LENGTH)
        e.push(`Msg ${i}: too long.`)
    })
  }
  if (body.temperature !== undefined && (isNaN(+body.temperature) || +body.temperature < 0 || +body.temperature > 2))
    e.push('Temperature must be 0-2.')
  if (body.max_tokens !== undefined && (isNaN(+body.max_tokens) || +body.max_tokens < 1 || +body.max_tokens > CONFIG.MAX_TOKENS_LIMIT))
    e.push(`Max tokens: 1-${CONFIG.MAX_TOKENS_LIMIT}.`)
  return e
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Cache-Control', 'no-store')

  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })
  if (!originAllowed(req)) return res.status(403).json({ error: 'Unauthorized origin.' })

  const ip = getIP(req)
  const rl = checkRateLimit(ip)
  res.setHeader('X-RateLimit-Remaining', rl.remaining)
  if (!rl.ok) {
    res.setHeader('Retry-After', rl.retryAfter)
    return res.status(429).json({ error: `Rate limited. Retry in ${rl.retryAfter}s.` })
  }

  // Resolve API key supporting both direct OpenAI and OpenRouter
  const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || ''
  if (!key) {
    return res.status(500).json({
      error: 'Server misconfigured: Missing OPENAI_API_KEY or OPENROUTER_API_KEY in your .env.local file.'
    })
  }

  const errors = validate(req.body)
  if (errors.length) return res.status(400).json({ error: 'Validation failed.', details: errors })

  const messages = req.body.messages.map(m => ({
    role: m.role,
    content: clean(m.content, CONFIG.MAX_CONTENT_LENGTH)
  }))

  // Determine if using OpenAI direct URL vs OpenRouter
  const isOpenAI = Boolean(process.env.OPENAI_API_KEY) || key.startsWith('sk-proj-') || (key.startsWith('sk-') && !key.startsWith('sk-or-v1-'))
  const targetUrl = isOpenAI ? CONFIG.OPENAI_URL : CONFIG.UPSTREAM_URL

  let targetModel = req.body.model
  if (isOpenAI && targetModel.startsWith('openai/')) {
    targetModel = targetModel.replace('openai/', '')
  }
  if (isOpenAI && targetModel.includes('mistral')) {
    targetModel = 'gpt-4o-mini' // fallback to OpenAI default if mistral was passed
  }

  const payload = {
    model: targetModel,
    messages,
    temperature: req.body.temperature ?? 0.75,
    max_tokens: Math.min(Number(req.body.max_tokens) || 900, CONFIG.MAX_TOKENS_LIMIT)
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS)

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }
    if (!isOpenAI) {
      headers['HTTP-Referer'] = process.env.APP_URL || 'https://proposalai.vercel.app'
      headers['X-Title'] = CONFIG.APP_TITLE
    }

    const up = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })

    const data = await up.json().catch(() => null)
    if (!up.ok) {
      const errMsg = data?.error?.message || data?.error || 'AI request failed.'
      return res.status(up.status).json({ error: typeof errMsg === 'string' ? errMsg : 'AI request failed.' })
    }

    const content = data?.choices?.[0]?.message?.content
    if (!content) return res.status(502).json({ error: 'No content returned.' })

    return res.status(200).json({
      choices: [{ message: { role: 'assistant', content: content.trim() } }],
      usage: data.usage || null
    })
  } catch (err) {
    if (err.name === 'AbortError')
      return res.status(504).json({ error: 'AI timed out. Try again.' })
    return res.status(500).json({ error: 'Unexpected error.' })
  } finally {
    clearTimeout(timer)
  }
}
