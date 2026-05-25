// src/context/StatementContext.tsx
import { createContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { MergedStatementData, StatementData } from '@/types/statement'
import { parseStatement } from '@/lib/parser'
import { mergeStatements } from '@/lib/merger'
import { buildDemoData } from '@/lib/demoData'
import type { Lang } from '@/i18n'

export interface FileEntry {
  name: string
  statement: StatementData
  error?: string
}

interface StatementContextValue {
  files: FileEntry[]
  merged: MergedStatementData | null
  isDemo: boolean
  lang: Lang
  darkMode: boolean
  masked: boolean
  addFiles: (csvTexts: { name: string; text: string }[]) => void
  removeFile: (name: string) => void
  loadDemo: () => void
  setLang: (lang: Lang) => void
  setDarkMode: (dark: boolean) => void
  setMasked: (masked: boolean) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const StatementContext = createContext<StatementContextValue | null>(null)

export function StatementProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [demoMerged, setDemoMerged] = useState<MergedStatementData | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [darkMode, setDarkMode] = useState(true)
  const [masked, setMasked] = useState(false)

  const realMerged: MergedStatementData | null = useMemo(() => {
    const validStatements = files.filter((f) => !f.error).map((f) => f.statement)
    return validStatements.length > 0 ? mergeStatements(validStatements) : null
  }, [files])

  const merged = realMerged ?? demoMerged
  const isDemo = realMerged === null && demoMerged !== null

  const addFiles = useCallback((inputs: { name: string; text: string }[]) => {
    setDemoMerged(null)
    setFiles((prev) => {
      const next = [...prev]
      for (const { name, text } of inputs) {
        if (next.find((f) => f.name === name)) continue
        try {
          const statement = parseStatement(text)
          next.push({ name, statement })
        } catch (e) {
          next.push({
            name,
            statement: null as unknown as StatementData,
            error: (e as Error).message,
          })
        }
      }
      return next
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  const loadDemo = useCallback(() => {
    setFiles([])
    setDemoMerged(buildDemoData())
  }, [])

  return (
    <StatementContext.Provider
      value={{
        files,
        merged,
        isDemo,
        lang,
        darkMode,
        masked,
        addFiles,
        removeFile,
        loadDemo,
        setLang,
        setDarkMode,
        setMasked,
      }}
    >
      {children}
    </StatementContext.Provider>
  )
}
