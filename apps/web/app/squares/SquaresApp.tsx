'use client'

import { TelarRootProvider as TelarRoot } from '@repo/telar/react'
import { Toolbar }    from './components/Toolbar'
import { SquareGrid } from './components/SquareGrid'
import './squares.css'

export function SquaresApp() {
  return (
    <TelarRoot>
      <div className="squares-page">
        <Toolbar />
        <SquareGrid />
      </div>
    </TelarRoot>
  )
}
