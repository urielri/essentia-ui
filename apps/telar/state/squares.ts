import { bind, thread } from '@repo/telar'
import type { BindDef, Reducers } from '@repo/telar'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SquareState = {
  color: string
  text:  string
}

// ─── Colores ──────────────────────────────────────────────────────────────────

export const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#06b6d4', '#a855f7', '#10b981',
  '#dc2626', '#2563eb', '#7c3aed', '#0891b2',
]

export function nextColor(current: string): string {
  const idx = COLORS.indexOf(current)
  return COLORS[(idx + 1) % COLORS.length]!
}

// ─── Lista de IDs ─────────────────────────────────────────────────────────────

let counter = 200

function generateIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `sq-${i}`)
}

function newId(): string {
  return `sq-${++counter}`
}

/**
 * Nodo maestro: solo trackea el orden y existencia de los cuadrados.
 * Solo se modifica al agregar o eliminar — nunca al cambiar color o texto.
 * SquareGrid se suscribe solo a este nodo.
 */
export const squareIdsBind = bind({
  key:     'squareIds',
  default: generateIds(200),
  reducers: {
    add:    (state)             => [...state, newId()],
    remove: (state, id: string) => state.filter(i => i !== id),
  },
})

export const squareCountThread = thread({
  key: 'squareCount',
  get: ({ read }) => read(squareIdsBind).length,
})

// ─── Estado por cuadrado ──────────────────────────────────────────────────────

type SquareReducers = Reducers<SquareState> & {
  setColor: (state: SquareState, color: string) => SquareState
  setText:  (state: SquareState, text: string)  => SquareState
}

type SquareBind = BindDef<SquareState, SquareReducers>

const squareBindCache = new Map<string, SquareBind>()

/**
 * Retorna el bind independiente de un cuadrado.
 * Cada cuadrado tiene su propio nodo en el store — cambiar el color de sq-5
 * solo notifica al SquareItem de sq-5, sin afectar a ningún otro componente.
 */
export function getSquareBind(id: string): SquareBind {
  if (!squareBindCache.has(id)) {
    const idx = parseInt(id.replace('sq-', ''), 10)
    squareBindCache.set(id, bind({
      key:     `square-state-${id}`,
      default: { color: COLORS[idx % COLORS.length]!, text: '' },
      reducers: {
        setColor: (state, color: string) => ({ ...state, color }),
        setText:  (state, text: string)  => ({ ...state, text }),
      },
    }))
  }
  return squareBindCache.get(id)!
}
