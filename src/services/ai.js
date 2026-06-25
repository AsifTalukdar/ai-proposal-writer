import { MODEL } from '../config/constants'
import { sanitize } from '../utils/sanitize'

const TONE_INSTRUCTIONS = {
  professional: 'Formal, polished, structured, calm, and persuasive.',
  friendly:     'Warm, conversational, confident, and approachable.',
  aggressive:   'Bold, highly confident, direct, and results-driven without sounding rude.'
}

export async function generateContent(form, signal) {
  const jobDesc    = sanitize(form.jobDescription, 5000)
  const name       = sanitize(form.name, 100)
  const clientName = sanitize(form.clientName, 100)
  const skills     = sanitize(form.skills, 300)
  const tone       = sanitize(form.tone, 20)
  const type       = sanitize(form.type, 50)

  if (!jobDesc) throw new Error('Job description is required.')

  const systemPrompt = `You are an elite freelance proposal strategist. You help freelancers write natural, high-converting, polished English proposals and cold emails. Your writing is specific, concise, client-focused, and never generic.`

  const userPrompt = `Write a ${type} in perfect English.

Tone: ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional}

Freelancer Name: ${name || 'The freelancer'}
Client Name: ${clientName || 'there'}
Core Skills: ${skills || 'Relevant professional skills'}

Job Description / Context:
"""
${jobDesc}
"""

Rules:
1. Start with a strong personalized hook.
2. Never say "I am writing to apply" or "I read your job post."
3. Show understanding of the client's actual need.
4. Offer a clear and credible solution.
5. Mention relevant proof naturally.
6. End with a soft call to action.
7. Keep it concise and practical.
8. Use short paragraphs.
9. Output only the final proposal/email text.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  const combinedSignal = signal
    ? new AbortController()
    : null

  if (signal && combinedSignal) {
    signal.addEventListener('abort', () => combinedSignal.abort())
    controller.signal.addEventListener('abort', () => combinedSignal.abort())
  }

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        temperature: 0.75,
        max_tokens: 900
      }),
      signal: combinedSignal ? combinedSignal.signal : controller.signal
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const msg = data?.error || `Request failed (${res.status})`
      throw new Error(msg)
    }

    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('No content returned.')

    return content.trim()
  } finally {
    clearTimeout(timeout)
  }
}