// src/pages/UploadPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatement } from '../hooks/useStatement'
import { createT } from '../i18n'
import UploadZone from '../components/upload/UploadZone'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function UploadPage() {
  const { files, merged, removeFile, lang, setLang, loadDemo } = useStatement()
  const t = createT(lang)
  const navigate = useNavigate()
  const [showHint, setShowHint] = useState(false)

  const validFiles = files.filter(f => !f.error)

  function handleDemo() {
    loadDemo()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">IBKR Modern Statements</h1>
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        {/* Drop zone */}
        <UploadZone />

        {/* Demo button — only shown when no files uploaded */}
        {files.length === 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <button
              onClick={handleDemo}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors"
            >
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-mono">{t('demoLabel')}</span>
              {t('tryDemo')}
            </button>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map(f => (
              <li key={f.name} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  {f.error
                    ? <p className="text-xs text-red-400 mt-0.5">{f.error}</p>
                    : <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(f.statement.periodStart)} ~ {formatDate(f.statement.periodEnd)}
                      </p>
                  }
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-gray-500 hover:text-red-400 text-sm ml-4 transition-colors"
                >
                  {t('remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Overlap badge */}
        {merged?.hasOverlap && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-400 text-sm">
            ⚠ {t('overlapDetected')}
          </div>
        )}

        {/* Analyze button */}
        {validFiles.length > 0 && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {t('analyze')} →
          </button>
        )}

        {/* How to export hint */}
        <div>
          <button
            onClick={() => setShowHint(v => !v)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showHint ? '▾' : '▸'} {t('howToExport')}
          </button>
          {showHint && (
            <div className="mt-3 bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
              <p>1. {t('exportStep1')}</p>
              <p>2. {t('exportStep2')}</p>
              <p>3. {t('exportStep3')}</p>
              <p>4. {t('exportStep4')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
