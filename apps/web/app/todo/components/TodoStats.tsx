'use client'

/**
 * useThread — solo lectura (estado derivado)
 *
 * TodoStats consume statsThread, un nodo derivado que calcula totales
 * a partir del grafo. Solo se re-renderiza cuando los conteos cambian;
 * nunca expone un setter (es de solo lectura por diseño).
 */

import { useThread } from '@repo/telar/react'
import { statsThread } from '../../../state/todo'

export function TodoStats() {
  const { total, active, completed } = useThread(statsThread)

  return (
    <div className="todo-stats">
      <span className="stat">
        <strong>{total}</strong> total
      </span>
      <span className="stat active">
        <strong>{active}</strong> pendientes
      </span>
      <span className="stat done">
        <strong>{completed}</strong> completadas
      </span>
    </div>
  )
}
