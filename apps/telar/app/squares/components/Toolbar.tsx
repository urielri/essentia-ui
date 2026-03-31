'use client'

import { useThread, useDispatch } from '@repo/telar/react'
import { squareCountThread, squareIdsBind } from '../../../state/squares'

/**
 * Toolbar con contador y botón de agregar.
 *
 * — `useThread(squareCountThread)` se re-renderiza cuando el conteo cambia
 *   (solo al agregar o eliminar cuadrados).
 * — `useDispatch(squareIdsBind)` permite agregar cuadrados sin suscribirse
 *   a la lista — no re-renderiza por cambios de color o texto.
 */
export function Toolbar() {
  const count    = useThread(squareCountThread)
  const dispatch = useDispatch(squareIdsBind)

  return (
    <header className="squares-toolbar">
      <p className="squares-toolbar-title">Telar — performance demo</p>
      <span className="squares-count">{count} cuadrados</span>
      <div className="squares-toolbar-spacer" />
      <button className="squares-add-btn" onClick={() => dispatch.add()}>
        + Agregar
      </button>
    </header>
  )
}
