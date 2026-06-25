import { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import ProposalForm from './components/ProposalForm'
import OutputBox from './components/OutputBox'
import History from './components/History'
import { useLocalStorage } from './hooks/useLocalStorage'
import { MAX_HISTORY } from './config/constants'
import { generateContent } from './services/ai'

function App() {
  const [text, setText] = useState('') // Matches OutputBox 'text' prop
  const [meta, setMeta] = useState({ type: '', tone: '' })
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useLocalStorage('proposals_v2', []) // Matches History 'items' prop

  const handleGenerate = async (formData) => {
    setLoading(true)
    try {
      const result = await generateContent(formData)
      setText(result)
      setMeta({ type: formData.type, tone: formData.tone })

      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        preview: result.slice(0, 100) + '...',
        fullText: result,
        type: formData.type,
        tone: formData.tone
      }

      setItems(prev => [newEntry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProposalForm onSubmit={handleGenerate} loading={loading} />
          <OutputBox text={text} meta={meta} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <History 
            items={items} 
            onLoad={(item) => { setText(item.fullText); setMeta(item); }}
            onDelete={(id) => setItems(prev => prev.filter(i => i.id !== id))}
            onClear={() => window.confirm('Clear history?') && setItems([])}
          />
        </div>
      </main>
    </div>
  )
}

export default App
