'use client'

import { SquaresProvider } from './context/squares-context'
import { Toolbar }         from './components/Toolbar'
import { SquareGrid }      from './components/SquareGrid'
import '../squares/squares.css'

export function SquaresContextApp() {
  return (
    <SquaresProvider>
      <div className="squares-page">
        <Toolbar />
        <SquareGrid />
      </div>
    </SquaresProvider>
  )
}
