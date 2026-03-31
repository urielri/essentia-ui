'use client'

/**
 * useBind — escritura con reducers tipados
 *
 * TodoInput solo despacha acciones; no lee el estado de los todos.
 * Al usar dispatch.add() no se produce suscripción al nodo 'todos',
 * por lo que este componente no se re-renderiza cuando la lista cambia.
 */

import { useDispatch } from '@repo/telar/react'
import { todosBind, type Priority } from '../../../state/todo'
import { useState } from 'react'

export function TodoInput() {
  const dispatch = useDispatch(todosBind)
  const [text, setText]         = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const handleAdd = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    dispatch.add({
      id:        crypto.randomUUID(),
      text:      trimmed,
      completed: false,
      priority,
    })

    setText('')
  }

  return (
    <div className="todo-input">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Nueva tarea..."
        className="todo-text-input"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="todo-priority-select"
      >
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
      </select>
      <button onClick={handleAdd} className="todo-add-btn">
        Agregar
      </button>
    </div>
  )
}
