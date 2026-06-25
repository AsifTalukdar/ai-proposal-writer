import { useEffect, useRef, useState } from 'react'
import { generateContent } from '../services/ai'
import { TONES, PROPOSAL_TYPES, MAX_JOB_DESC, COOLDOWN_MS } from '../config/constants'

export default function ProposalForm({ onGenerated, onResult, setLoading, loading }) {
  const [form, setForm] = useState({
    type: 'Upwork Proposal',
    tone: 'professional',
    name: '',
    clientName: '',
    skills: '',
    jobDescription: ''
  })

  const [error, setError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const abortRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const inCooldown = cooldownUntil > now

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.jobDescription.trim()) {
      setError('Please paste a job description first.')
      return
    }
    if (form.jobDescription.length > MAX_JOB_DESC) {
      setError(`Keep job description under ${MAX_JOB_DESC} characters.`)
      return
    }
    if (inCooldown) {
      setError(`Please wait ${remaining}s before generating again.`)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setCooldownUntil(Date.now() + COOLDOWN_MS)
    if (typeof setLoading === 'function') setLoading(true)

    try {
      const text = await generateContent(form, controller.signal)
      if (typeof onGenerated === 'function') onGenerated(text, form)
      if (typeof onResult === 'function') onResult(text, form)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request cancelled.')
      } else {
        setError(err.message || 'Something went wrong.')
      }
    } finally {
      if (typeof setLoading === 'function') setLoading(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => abortRef.current?.abort()

  return (
    <section className="glass p-6 md:p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Create New Proposal</h2>
        <p className="text-slate-400 text-sm">
          Paste a job description and generate a polished proposal or outreach message.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="input">
              {PROPOSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(tone => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tone: tone.value }))}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${form.tone === tone.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                >
                  {tone.emoji} {tone.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahman"
              className="input"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              placeholder="e.g. John"
              className="input"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, SEO, HR..."
              className="input"
              maxLength={300}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Job Description
            <span className={`font-normal ml-2 ${form.jobDescription.length > MAX_JOB_DESC ? 'text-red-400' : 'text-slate-500'}`}>
              ({form.jobDescription.length}/{MAX_JOB_DESC})
            </span>
          </label>
          <textarea
            name="jobDescription"
            value={form.jobDescription}
            onChange={handleChange}
            rows={7}
            placeholder="Paste the client's job description here..."
            className="input resize-none"
            required
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
          <div className="text-xs text-slate-500">
            Secure server-side OpenRouter integration via Vercel
          </div>
          <div className="flex gap-3">
            {loading && (
              <button type="button" onClick={handleCancel} className="btn-ghost">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || inCooldown || !form.jobDescription.trim()}
              className="btn flex items-center justify-center gap-2 min-w-[180px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Writing...
                </>
              ) : inCooldown ? `Wait ${remaining}s` : 'Generate'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}