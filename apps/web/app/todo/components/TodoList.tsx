'use client'

/**
 * useThread — lista filtrada (estado derivado)
 *
 * TodoList consume filteredTodosThread, que depende de 'todos' y 'filter'.
 * El grafo reactivo recalcula la lista solo cuando alguna dependencia cambia.
 */

import { useThread } from '@repo/telar/react'
import { filteredTodosThread } from '../../../state/todo'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const visible = useThread(filteredTodosThread)

  if (visible.length === 0) {
    return <p className="todo-empty">No hay tareas para mostrar.</p>
  }

  return (
    <ul className="todo-list">
      {visible.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
