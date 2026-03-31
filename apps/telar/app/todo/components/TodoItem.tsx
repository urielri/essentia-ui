'use client'

/**
 * useBind — acciones sobre un item
 *
 * TodoItem recibe los datos del todo como props (provistos por TodoList).
 * Solo despacha mutaciones (toggle / remove) sin suscribirse al estado
 * completo — no hay re-render extra al renderizar cada item de la lista.
 */

import { useDispatch } from '@repo/telar/react'
import { todosBind, type Todo } from '../../../state/todo'

const PRIORITY_LABELS: Record<Todo['priority'], string> = {
  low:    'Baja',
  medium: 'Media',
  high:   'Alta',
}

type Props = { todo: Todo }

export function TodoItem({ todo }: Props) {
  const dispatch = useDispatch(todosBind)

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => dispatch.toggle(todo.id)}
        className="todo-checkbox"
      />
      <span className="todo-text">{todo.text}</span>
      <span className={`todo-priority priority-${todo.priority}`}>
        {PRIORITY_LABELS[todo.priority]}
      </span>
      <button
        onClick={() => dispatch.remove(todo.id)}
        className="todo-delete-btn"
        aria-label="Eliminar"
      >
        ✕
      </button>
    </li>
  )
}
