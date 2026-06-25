export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black">
            P
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">ProposalAI</h1>
            <p className="text-xs text-slate-400 -mt-1">Cold Email & Proposal Writer</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Secure API Mode
        </div>
      </div>
    </nav>
  )
}
