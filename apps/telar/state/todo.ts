import { knot, thread, bind } from '@repo/telar'

export type Priority = 'low' | 'medium' | 'high'
export type Filter = 'all' | 'active' | 'completed'

export type Todo = {
  id: string
  text: string
  completed: boolean
  priority: Priority
}

export type TodoState = {
  todos: Todo[]
  filter: Filter
}

// ─── Knots (estado atómico) ───────────────────────────────────────────────────

export const filterKnot = knot<Filter>({
  key: 'filter',
  default: 'all',
})

export const todosBind = bind({
  key: 'todos',
  default: [
    { id: '1', text: 'Aprender Telar state management', completed: false, priority: 'high' as Priority },
    { id: '2', text: 'Construir un mini To Do list',    completed: true,  priority: 'medium' as Priority },
    { id: '3', text: 'Explorar knot, thread y bind',   completed: false, priority: 'high' as Priority },
  ] as Todo[],
  reducers: {
    add:    (state, todo: Todo)   => [...state, todo],
    toggle: (state, id: string)   => state.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
    remove: (state, id: string)   => state.filter((t) => t.id !== id),
  },
})

// ─── Threads (estado derivado) ────────────────────────────────────────────────

export const filteredTodosThread = thread({
  key: 'filteredTodos',
  get: ({ read }) => {
    const todos   = read(todosBind)
    const filter  = read(filterKnot)
    if (filter === 'active')    return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) =>  t.completed)
    return todos
  },
})

export const statsThread = thread({
  key: 'stats',
  get: ({ read }) => {
    const todos     = read(todosBind)
    const total     = todos.length
    const completed = todos.filter((t) => t.completed).length
    return { total, completed, active: total - completed }
  },
})

/** Thread combinado: expone el estado completo como un único objeto.
 *  Usado por TelarDevTools para observar y detectar mutaciones. */
export const todoStateThread = thread<TodoState>({
  key: 'todoState',
  get: ({ read }) => ({
    todos:  read(todosBind),
    filter: read(filterKnot),
  }),
})
