'use client'

import { useRef } from 'react'
import { useSquares, nextColor } from '../context/squares-context'

/**
 * Renderiza un único cuadrado.
 *
 * Consume el contexto completo via `useSquares()`.
 * Cada vez que CUALQUIER cuadrado cambia su color o texto, el contexto
 * emite un nuevo valor → TODOS los consumidores re-renderizan, incluyendo
 * este componente, aunque su propio color y texto no hayan cambiado.
 *
 * El badge "r:N" lo confirma: todos los contadores suben juntos.
 */
export function SquareItem({ id }: { id: string }) {
  const { state, dispatch } = useSquares()
  const square  = state.squares.find(s => s.id === id)
  const renders = useRef(0)
  renders.current++

  if (!square) return null

  return (
    <div
      className="square"
      style={{ background: square.color }}
      onClick={() => dispatch({ type: 'SET_COLOR', id, color: nextColor(square.color) })}
    >
      <span className="square-renders" suppressHydrationWarning>
        r:{renders.current}
      </span>

      <button
        className="square-delete"
        onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE', id }) }}
        aria-label="Eliminar"
      >
        ×
      </button>

      <input
        className="square-input"
        value={square.text}
        placeholder="texto"
        onClick={e => e.stopPropagation()}
        onChange={e => dispatch({ type: 'SET_TEXT', id, text: e.target.value })}
      />
    </div>
  )
}
