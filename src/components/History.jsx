import { useCopy } from '../hooks/useCopy'

export default function History({ items, onLoad, onDelete, onClear }) {
  const { copied, copy } = useCopy(1500)

  if (!items.length) {
    return (
      <div className="glass p-6 min-h-[320px] flex flex-col items-center justify-center text-center">
        <svg className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-400">No saved proposals</p>
        <p className="text-xs text-slate-500 mt-1">Generate and save your first one</p>
      </div>
    )
  }

  return (
    <div className="glass p-5 flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Saved History</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
            {items.length}
          </span>
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
        {items.map(item => (
          <div
            key={item.id}
            className="group p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                  {item.type?.split(' ')[0]}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded capitalize">
                  {item.tone}
                </span>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 line-clamp-3 mb-2.5 leading-relaxed">
              {item.preview}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600">{item.date}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copy(item.fullText)}
                  className="text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => onLoad(item)}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Load →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}