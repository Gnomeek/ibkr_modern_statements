// src/context/StatementContext.tsx
import { createContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { MergedStatementData, StatementData } from '../types/statement'
import { parseStatement } from '../lib/parser'
import { mergeStatements } from '../lib/merger'
import type { Lang } from '../i18n'

export interface FileEntry {
  name: string
  statement: StatementData
  error?: string
}

interface StatementContextValue {
  files: FileEntry[]
  merged: MergedStatementData | null
  lang: Lang
  darkMode: boolean
  addFiles: (csvTexts: { name: string; text: string }[]) => void
  removeFile: (name: string) => void
  setLang: (lang: Lang) => void
  setDarkMode: (dark: boolean) => void
}

export const StatementContext = createContext<StatementContextValue | null>(null)

export function StatementProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [lang, setLang] = useState<Lang>('en')
  const [darkMode, setDarkMode] = useState(true)

  const merged: MergedStatementData | null = useMemo(() => {
    const validStatements = files.filter(f => !f.error).map(f => f.statement)
    return validStatements.length > 0 ? mergeStatements(validStatements) : null
  }, [files])

  const addFiles = useCallback((inputs: { name: string; text: string }[]) => {
    setFiles(prev => {
      const next = [...prev]
      for (const { name, text } of inputs) {
        if (next.find(f => f.name === name)) continue
        try {
          const statement = parseStatement(text)
          next.push({ name, statement })
        } catch (e) {
          next.push({ name, statement: null as unknown as StatementData, error: (e as Error).message })
        }
      }
      return next
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
  }, [])

  return (
    <StatementContext.Provider value={{ files, merged, lang, darkMode, addFiles, removeFile, setLang, setDarkMode }}>
      {children}
    </StatementContext.Provider>
  )
}
