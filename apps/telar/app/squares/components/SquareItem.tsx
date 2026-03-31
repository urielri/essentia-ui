'use client'

import { useRef } from 'react'
import { useBind, useDispatch } from '@repo/telar/react'
import { squareIdsBind, getSquareBind, nextColor } from '../../../state/squares'

/**
 * Renderiza un único cuadrado.
 *
 * — Lee y escribe su propio estado vía `getSquareBind(id)`: un nodo
 *   independiente en el store. Cambiar el color de este cuadrado NO afecta
 *   a ningún otro componente — solo este SquareItem recibe notify.
 *
 * — Para eliminar usa `useDispatch(squareIdsBind)`: escribe en el nodo
 *   de la lista sin suscribirse a sus cambios.
 *
 * El badge "r:N" muestra cuántas veces se re-renderizó este componente.
 */
export function SquareItem({ id }: { id: string }) {
  const [square, dispatch]  = useBind(getSquareBind(id))
  const listDispatch        = useDispatch(squareIdsBind)
  const renders             = useRef(0)
  renders.current++

  return (
    <div
      className="square"
      style={{ background: square.color }}
      onClick={() => dispatch.setColor(nextColor(square.color))}
    >
      <span className="square-renders" suppressHydrationWarning>
        r:{renders.current}
      </span>

      <button
        className="square-delete"
        onClick={e => { e.stopPropagation(); listDispatch.remove(id) }}
        aria-label="Eliminar"
      >
        ×
      </button>

      <input
        className="square-input"
        value={square.text}
        placeholder="texto"
        onClick={e => e.stopPropagation()}
        onChange={e => dispatch.setText(e.target.value)}
      />
    </div>
  )
}
