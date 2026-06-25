const CONFIG = {
  UPSTREAM_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_URL: 'https://api.openai.com/v1/chat/completions',
  TIMEOUT_MS: 30000,
  MAX_BODY_SIZE: 1024 * 50,
  MAX_MESSAGES: 5,
  MAX_CONTENT_LENGTH: 6000,
  MAX_TOKENS_LIMIT: 2000,
  ALLOWED_MODELS: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-3.5-turbo',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-4-31b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'openai/gpt-oss-20b:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini'
  ],
  ALLOWED_ROLES: ['system', 'user', 'assistant'],
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 15,
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
    e.push(`Model not allowed. Use: ${CONFIG.ALLOWED_MODELS[3]}`)
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

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim() || ''
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || ''

  const useOpenRouter = Boolean(openRouterKey) && openRouterKey.startsWith('sk-or-')
  const key = useOpenRouter ? openRouterKey : openAiKey

  if (!key) {
    return res.status(500).json({
      error: 'Server misconfigured: Missing OPENROUTER_API_KEY or OPENAI_API_KEY in your .env.local file.'
    })
  }

  const errors = validate(req.body)
  if (errors.length) return res.status(400).json({ error: 'Validation failed.', details: errors })

  const messages = req.body.messages.map(m => ({
    role: m.role,
    content: clean(m.content, CONFIG.MAX_CONTENT_LENGTH)
  }))

  const isOpenAI = !useOpenRouter
  const targetUrl = isOpenAI ? CONFIG.OPENAI_URL : CONFIG.UPSTREAM_URL

  let targetModel = req.body.model

  // If using OpenRouter and frontend passed paid/deprecated models, auto-switch to active free Llama 3.3 70B!
  if (useOpenRouter && (targetModel.includes('gpt') || targetModel.includes('claude') || targetModel.includes('mistral') || targetModel.includes('qwen') || targetModel.includes('gemini'))) {
    targetModel = 'meta-llama/llama-3.3-70b-instruct:free'
  }

  // If using OpenAI direct and frontend passed free model, auto-switch to gpt-4o-mini
  if (isOpenAI && targetModel.includes(':free')) {
    targetModel = 'gpt-4o-mini'
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
    if (useOpenRouter) {
      headers['HTTP-Referer'] = process.env.APP_URL || 'https://proposalai.vercel.app'
      headers['X-Title'] = CONFIG.APP_TITLE
    }

    let up = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })

    let data = await up.json().catch(() => null)

    // SELF-HEALING FALLBACK: If OpenRouter deprecated a model or says "No endpoints found", auto-retry active verified free models!
    if (!up.ok && useOpenRouter && (data?.error?.message?.includes('No endpoints found') || up.status === 404)) {
      const fallbackFreeModels = [
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-4-31b-it:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'openai/gpt-oss-20b:free'
      ]
      for (const fbModel of fallbackFreeModels) {
        if (fbModel === payload.model) continue
        console.log(`Retrying OpenRouter with verified live free model: ${fbModel}`)
        payload.model = fbModel
        up = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: ctrl.signal
        })
        data = await up.json().catch(() => null)
        if (up.ok) break
      }
    }

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
