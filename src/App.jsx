import { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import ProposalForm from './components/ProposalForm'
import OutputBox from './components/OutputBox'
import History from './components/History'
import { useLocalStorage } from './hooks/useLocalStorage'
import { MAX_HISTORY } from './config/constants'

export default function App() {
  const [output, setOutput] = useState('')
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useLocalStorage('proposal_history', [])

  const handleResult = useCallback((text, form) => {
    setOutput(text)
    setMeta({ type: form.type, tone: form.tone })
    setHistory(prev => [
      {
        id: Date.now(),
        date: new Date().toLocaleString(),
        preview: text.slice(0, 140) + (text.length > 140 ? '...' : ''),
        fullText: text,
        type: form.type,
        tone: form.tone
      },
      ...prev
    ].slice(0, MAX_HISTORY))
  }, [setHistory])

  const handleLoad = useCallback((item) => {
    setOutput(item.fullText)
    setMeta({ type: item.type, tone: item.tone })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDelete = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }, [setHistory])

  const handleClear = useCallback(() => {
    if (confirm('Delete all saved proposals?')) {
      setHistory([])
    }
  }, [setHistory])

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-blue-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Win More Freelance Jobs
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            Paste any job description → get a perfect, personalized proposal or cold email in seconds.
          </p>
        </div>

        {/* Form */}
        <ProposalForm
          onResult={handleResult}
          loading={loading}
          setLoading={setLoading}
        />

        {/* Output + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <OutputBox text={output} meta={meta} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <History
              items={history}
              onLoad={handleLoad}
              onDelete={handleDelete}
              onClear={handleClear}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pt-8 pb-4 border-t border-slate-800/50">
          Built for freelancers in Bangladesh & worldwide · Powered by OpenRouter · Secured on Vercel
        </footer>
      </main>
    </div>
  )
}