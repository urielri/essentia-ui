'use client'

/**
 * useKnot — lectura y escritura
 *
 * TodoFilter necesita leer el filtro actual (para resaltar el botón activo)
 * y escribirlo cuando el usuario hace clic. useKnot retorna [value, setter],
 * análogo a useState pero conectado al grafo reactivo de Telar.
 */

import { useKnot } from '@repo/telar/react'
import { filterKnot, type Filter } from '../../../state/todo'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'Todas'      },
  { value: 'active',    label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

export function TodoFilter() {
  const [filter, setFilter] = useKnot(filterKnot)

  return (
    <div className="todo-filter">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setFilter(value)}
          className={`filter-btn ${filter === value ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
