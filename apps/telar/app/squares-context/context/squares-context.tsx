'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Square = {
  id:    string
  color: string
  text:  string
}

type State = {
  squares: Square[]
}

type Action =
  | { type: 'ADD' }
  | { type: 'REMOVE';    id: string }
  | { type: 'SET_COLOR'; id: string; color: string }
  | { type: 'SET_TEXT';  id: string; text: string }

// ─── Colores ──────────────────────────────────────────────────────────────────

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#06b6d4', '#a855f7', '#10b981',
  '#dc2626', '#2563eb', '#7c3aed', '#0891b2',
]

export function nextColor(current: string): string {
  const idx = COLORS.indexOf(current)
  return COLORS[(idx + 1) % COLORS.length]!
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let counter = 200

function generateSquares(count: number): Square[] {
  return Array.from({ length: count }, (_, i) => ({
    id:    `sq-${i}`,
    color: COLORS[i % COLORS.length]!,
    text:  '',
  }))
}

function makeSquare(): Square {
  const id = `sq-${++counter}`
  return { id, color: COLORS[counter % COLORS.length]!, text: '' }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function squaresReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { squares: [...state.squares, makeSquare()] }
    case 'REMOVE':
      return { squares: state.squares.filter(s => s.id !== action.id) }
    case 'SET_COLOR':
      return {
        squares: state.squares.map(s =>
          s.id === action.id ? { ...s, color: action.color } : s
        ),
      }
    case 'SET_TEXT':
      return {
        squares: state.squares.map(s =>
          s.id === action.id ? { ...s, text: action.text } : s
        ),
      }
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ContextValue = {
  state:    State
  dispatch: React.Dispatch<Action>
}

const SquaresContext = createContext<ContextValue | null>(null)

export function SquaresProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(squaresReducer, undefined, () => ({
    squares: generateSquares(200),
  }))

  return (
    <SquaresContext.Provider value={{ state, dispatch }}>
      {children}
    </SquaresContext.Provider>
  )
}

export function useSquares(): ContextValue {
  const ctx = useContext(SquaresContext)
  if (!ctx) throw new Error('useSquares must be used inside <SquaresProvider>')
  return ctx
}
