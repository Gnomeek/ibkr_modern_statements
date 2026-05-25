// src/hooks/useStatement.ts
import { useContext } from 'react'
import { StatementContext } from '@/context/StatementContext'

export function useStatement() {
  const ctx = useContext(StatementContext)
  if (!ctx) throw new Error('useStatement must be used inside StatementProvider')
  return ctx
}
