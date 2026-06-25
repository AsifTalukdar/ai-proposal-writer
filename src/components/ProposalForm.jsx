import { useState, useRef } from 'react'
import { generateContent } from '../services/ai'
import { TONES, PROPOSAL_TYPES, COOLDOWN_MS } from '../config/constants'

export default function ProposalForm({ onResult, loading, setLoading }) {
  const [form, setForm] = useState({
    type: 'Upwork Proposal',
    tone: 'professional',
    name: '',
    clientName: '',
    skills: '',
    jobDescription: ''
  })
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const abortRef = useRef(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.jobDescription.trim()) {
      setError('Paste a job description first.')
      return
    }
    if (cooldown > 0) {
      setError(`Wait ${cooldown}s before next generation.`)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setCooldown(Math.ceil(COOLDOWN_MS / 1000))

    const iv = setInterval(() => {
      setCooldown(p => {
        if (p <= 1) { clearInterval(iv); return 0 }
        return p - 1
      })
    }, 1000)

    try {
      const text = await generateContent(form, ctrl.signal)
      onResult(text, form)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Generation failed.')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  return (
    <form onSubmit={submit} className="glass p-6 md:p-8 animate-slide-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Create Proposal or Email</h2>
        <p className="text-sm text-slate-400 mt-1">
          Paste a job description → get a polished, personalized proposal in seconds.
        </p>
      </div>

      <div className="space-y-5">
        {/* Row 1: Type + Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="input-field"
            >
              {PROPOSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('tone', t.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.tone === t.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Name, Client, Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Rahman"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Client Name</label>
            <input
              value={form.clientName}
              onChange={e => set('clientName', e.target.value)}
              placeholder="John"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Skills</label>
            <input
              value={form.skills}
              onChange={e => set('skills', e.target.value)}
              placeholder="React, SEO, HR..."
              className="input-field"
            />
          </div>
        </div>

        {/* Row 3: Job Description */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-300">Job Description</label>
            <span className="text-xs text-slate-500">{form.jobDescription.length} / 5000</span>
          </div>
          <textarea
            value={form.jobDescription}
            onChange={e => set('jobDescription', e.target.value)}
            rows={7}
            placeholder="Paste the full job description from Upwork, Fiverr, or any platform..."
            className="input-field resize-none"
            required
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            🔒 Your data stays in your browser. API calls are server-secured.
          </p>
          <button
            type="submit"
            disabled={loading || cooldown > 0 || !form.jobDescription.trim()}
            className="btn-primary w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Writing...
              </>
            ) : cooldown > 0 ? (
              `Wait ${cooldown}s`
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}