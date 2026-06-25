import { useCallback, useMemo } from 'react'
import { useCopy } from '../hooks/useCopy'

// Helper to convert Markdown (**bold**, *italic*, __underline__, ### headings, - lists) into Rich HTML
function renderRichTextHtml(rawText) {
  if (!rawText) return ''

  let html = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/^###\s+(.*)$/gm, '<strong class="block text-lg font-bold text-blue-300 mt-4 mb-1">$1</strong>')
  html = html.replace(/^##\s+(.*)$/gm, '<strong class="block text-xl font-extrabold text-blue-200 mt-5 mb-2">$1</strong>')
  html = html.replace(/^#\s+(.*)$/gm, '<strong class="block text-2xl font-black text-white mt-6 mb-2">$1</strong>')

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<u class="underline underline-offset-4 font-semibold text-blue-200">$1</u>')

  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-slate-200">$1</em>')

  html = html.replace(/^[-*]\s+(.*)$/gm, '<div class="flex items-start gap-2.5 my-1 pl-2"><span class="text-blue-400 font-bold mt-0.5">•</span><span class="flex-1">$1</span></div>')
  html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex items-start gap-2.5 my-1 pl-2"><span class="text-blue-400 font-bold mt-0.5">$1.</span><span class="flex-1">$2</span></div>')

  html = html.replace(/\n\n+/g, '<div class="h-4"></div>')
  html = html.replace(/\n/g, '<br/>')

  return html
}

// Helper for Word (.doc) and PDF rich export
function exportRichDocHtml(rawText) {
  if (!rawText) return ''
  let html = rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/^###\s+(.*)$/gm, '<h3 style="color:#1e40af; font-size:14pt; margin-top:16px; margin-bottom:6px;">$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2 style="color:#1e3a8a; font-size:16pt; margin-top:20px; margin-bottom:8px;">$1</h2>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>')
  html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>')
  html = html.replace(/_([^_]+)_/g, '<i>$1</i>')
  html = html.replace(/^[-*]\s+(.*)$/gm, '<li style="margin-left:20px; margin-bottom:4px;">$1</li>')
  html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<li style="margin-left:20px; margin-bottom:4px; list-style-type:decimal;">$2</li>')
  html = html.replace(/\n\n+/g, '<p style="margin-bottom:12px;"></p>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

export default function OutputBox({ text, meta, loading }) {
  const { copied, copy } = useCopy()

  const stats = useMemo(() => {
    if (!text) return null
    const words = text.trim().split(/\s+/).filter(Boolean).length
    return { words, chars: text.length }
  }, [text])

  const richHtmlContent = useMemo(() => renderRichTextHtml(text), [text])

  const handleDownloadDoc = useCallback(() => {
    if (!text) return
    const title = meta?.type ? meta.type.replace(/\s+/g, '_') : 'Proposal'
    const docFormattedBody = exportRichDocHtml(text)

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head><body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111111; padding: 20px;">`
    const footer = "</body></html>"
    const content = header + docFormattedBody + footer

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase()}_${Date.now()}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [text, meta])

  const handleDownloadPdf = useCallback(() => {
    if (!text) return
    const title = meta?.type || 'Proposal'
    const pdfFormattedBody = exportRichDocHtml(text)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.7; padding: 50px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 22px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 28px; }
            h2, h3 { color: #1e3a8a; margin-top: 24px; margin-bottom: 8px; }
            b { font-weight: 700; color: #0f172a; }
            i { font-style: italic; }
            u { text-decoration: underline; }
            li { margin-bottom: 6px; }
            p { margin-bottom: 16px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${title} (${meta?.tone || 'Professional'})</h1>
          <div>${pdfFormattedBody}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [text, meta])

  if (!text && !loading) {
    return (
      <div className="glass p-8 min-h-[320px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-300 font-semibold text-lg">Your generated proposal will appear here</p>
        <p className="text-sm text-slate-500 mt-1">Fill out the job details on the left and click Generate</p>
      </div>
    )
  }

  return (
    <div className="glass p-6 md:p-8 animate-fade-in flex flex-col shadow-2xl border border-slate-700/80">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-blue-500/15 text-blue-300 border border-blue-500/30 px-3 py-1 font-bold">
            {meta?.type || 'Proposal'}
          </span>
          <span className="badge bg-slate-800 text-slate-300 border border-slate-700 capitalize px-3 py-1">
            {meta?.tone || 'professional'}
          </span>
        </div>

        {text && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadDoc}
              title="Download Microsoft Word Document (.doc)"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              .DOC / Word
            </button>

            <button
              onClick={handleDownloadPdf}
              title="Save as PDF vector document"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              .PDF
            </button>

            <button
              onClick={() => copy(text)}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Text
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content rendered as stunning Rich Text */}
      <div className="flex-1 min-h-[260px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/40 rounded-xl backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4 shadow-lg shadow-blue-500/20" />
            <p className="animate-pulse text-sm font-semibold text-slate-300">Crafting your winning proposal...</p>
          </div>
        ) : (
          <div
            className="text-slate-100 leading-relaxed text-[15px] font-normal selection:bg-blue-500/40 p-2 space-y-1"
            dangerouslySetInnerHTML={{ __html: richHtmlContent }}
          />
        )}
      </div>

      {/* Footer */}
      {stats && !loading && (
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-3">
          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            📊 <strong className="text-slate-200">{stats.words}</strong> words · <strong className="text-slate-200">{stats.chars}</strong> characters
          </span>

          <div className="flex items-center gap-3">
            <button onClick={handleDownloadDoc} className="hover:text-blue-300 transition-colors flex items-center gap-1">
              <span>📥</span> Word (.doc)
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={handleDownloadPdf} className="hover:text-red-300 transition-colors flex items-center gap-1">
              <span>📄</span> PDF
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => copy(text)} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              {copied ? '✓ Copied to clipboard' : 'Copy Text'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}