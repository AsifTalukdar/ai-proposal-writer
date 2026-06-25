import { useMemo } from 'react'
import { useCopy } from '../hooks/useCopy'

export default function OutputBox({ text, meta, loading }) {
  const { copied, copy } = useCopy()

  const stats = useMemo(() => {
    if (!text) return null
    const words = text.trim().split(/\s+/).filter(Boolean).length
    return { words, chars: text.length }
  }, [text])

  if (!text && !loading) {
    return (
      <div className="glass p-8 min-h-[320px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">Your proposal will appear here</p>
        <p className="text-sm text-slate-500 mt-1">Fill the form and click Generate</p>
      </div>
    )
  }

  return (
    <div className="glass p-6 md:p-8 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {meta?.type || 'Proposal'}
          </span>
          <span className="badge bg-slate-700/50 text-slate-300 border border-slate-600/50 capitalize">
            {meta?.tone || 'professional'}
          </span>
        </div>
        {text && (
          <button onClick={() => copy(text)} className="btn-ghost text-sm flex items-center gap-1.5">
            {copied ? (
              <><svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[220px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="animate-pulse text-sm">Crafting your proposal...</p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed text-[15px]">
            {text}
          </div>
        )}
      </div>

      {/* Footer */}
      {stats && !loading && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{stats.words} words · {stats.chars} chars</span>
          <span>Ready to paste</span>
        </div>
      )}
    </div>
  )
}