@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    @apply bg-slate-950 text-slate-100 antialiased font-sans;
    margin: 0;
    min-width: 320px;
  }
  button, input, textarea, select { font: inherit; }
}

@layer components {
  .glass {
    @apply bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl;
  }
  .input-field {
    @apply w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3
           text-slate-100 placeholder-slate-500
           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
           transition-all duration-200;
  }
  .btn-primary {
    @apply px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600
           hover:from-blue-500 hover:to-indigo-500
           text-white font-semibold rounded-xl
           shadow-lg shadow-blue-900/20
           transition-all duration-200 active:scale-95
           disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100;
  }
  .btn-ghost {
    @apply px-4 py-2 bg-slate-800 hover:bg-slate-700
           border border-slate-700 text-slate-200
           rounded-xl transition-all duration-200;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold;
  }
}

.scrollbar-thin::-webkit-scrollbar { width: 5px; }
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(100,116,139,0.4);
  border-radius: 20px;
}
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}