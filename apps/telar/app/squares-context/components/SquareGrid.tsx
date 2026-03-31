'use client'

import { useRef } from 'react'
import { useSquares } from '../context/squares-context'
import { SquareItem } from './SquareItem'

/**
 * Renderiza la grilla.
 *
 * Consume el contexto completo — re-renderiza ante cualquier cambio
 * en cualquier cuadrado, incluso si solo cambió el color de uno.
 */
export function SquareGrid() {
  const { state } = useSquares()
  const renders   = useRef(0)
  renders.current++

  return (
    <>
      <div style={{
        padding:    '0.5rem 1.5rem',
        fontFamily: 'SFMono-Regular, Consolas, monospace',
        fontSize:   '0.7rem',
        color:      '#8b949e',
      }}>
        grid r:<span suppressHydrationWarning>{renders.current}</span>
        {' · '}{state.squares.length} cuadrados
      </div>
      <div className="squares-grid">
        {state.squares.map(s => <SquareItem key={s.id} id={s.id} />)}
      </div>
    </>
  )
}
