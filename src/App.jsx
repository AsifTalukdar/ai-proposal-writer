import { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import ProposalForm from './components/ProposalForm'
import OutputBox from './components/OutputBox'
import History from './components/History'
import { useLocalStorage } from './hooks/useLocalStorage'
import { MAX_HISTORY } from './config/constants'

function App() {
  const [text, setText] = useState('')
  const [meta, setMeta] = useState({ type: '', tone: '' })
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useLocalStorage('proposal_history', [])

  const handleGenerated = useCallback((generated, form) => {
    setText(generated)
    setMeta({ type: form.type, tone: form.tone })

    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      preview: generated.slice(0, 120) + (generated.length > 120 ? '...' : ''),
      fullText: generated,
      type: form.type,
      tone: form.tone
    }
    setItems(prev => [newItem, ...prev].slice(0, MAX_HISTORY))
  }, [setItems])

  const handleLoad = useCallback((item) => {
    setText(item.fullText)
    setMeta({ type: item.type, tone: item.tone })
  }, [])

  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [setItems])

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all saved proposals?')) setItems([])
  }, [setItems])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-4">
            Built for Bangladeshi & International Freelancers
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Write better proposals.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Win more freelance jobs.
            </span>
          </h1>
          <p className="mt-4 text-slate-400 text-sm md:text-base leading-relaxed">
            Paste a job post and generate a polished Upwork, Fiverr, PeoplePerHour,
            LinkedIn, or cold email message in seconds.
          </p>
        </section>

        <ProposalForm
          onGenerated={handleGenerated}
          setLoading={setLoading}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <OutputBox text={text} meta={meta} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <History
              items={items}
              onLoad={handleLoad}
              onDelete={handleDelete}
              onClear={handleClear}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
