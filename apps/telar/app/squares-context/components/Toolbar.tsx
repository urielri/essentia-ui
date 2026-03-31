'use client'

import { useSquares } from '../context/squares-context'

export function Toolbar() {
  const { state, dispatch } = useSquares()

  return (
    <header className="squares-toolbar">
      <p className="squares-toolbar-title">Context API — performance demo</p>
      <span className="squares-count">{state.squares.length} cuadrados</span>
      <div className="squares-toolbar-spacer" />
      <button className="squares-add-btn" onClick={() => dispatch({ type: 'ADD' })}>
        + Agregar
      </button>
    </header>
  )
}
