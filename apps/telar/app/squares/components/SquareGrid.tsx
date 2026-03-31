'use client'

import { useRef } from 'react'
import { useBind } from '@repo/telar/react'
import { squareIdsBind } from '../../../state/squares'
import { SquareItem } from './SquareItem'

/**
 * Renderiza la grilla de cuadrados.
 *
 * Lee solo `squareIdsBind` — el nodo maestro que trackea IDs.
 * Solo se re-renderiza cuando se agrega o elimina un cuadrado.
 * Cambios de color o texto en cualquier cuadrado NO alcanzan este componente.
 *
 * El badge "grid r:N" confirma que SquareGrid no re-renderiza al cambiar
 * el estado interno de un cuadrado.
 */
export function SquareGrid() {
  const [ids]   = useBind(squareIdsBind)
  const renders = useRef(0)
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
        {' · '}{ids.length} cuadrados
      </div>
      <div className="squares-grid">
        {ids.map(id => <SquareItem key={id} id={id} />)}
      </div>
    </>
  )
}
