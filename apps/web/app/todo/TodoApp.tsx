'use client'

import { TelarRoot } from '@repo/telar/react'
import { TodoInput }      from './components/TodoInput'
import { TodoFilter }     from './components/TodoFilter'
import { TodoStats }      from './components/TodoStats'
import { TodoList }       from './components/TodoList'
import { TelarDevTools }  from './components/TelarDevTools'

/**
 * TodoApp envuelve la aplicación con TelarRoot.
 * Todos los componentes hijos comparten la misma store reactiva.
 *
 * TelarRoot crea un store aislado por árbol React — sin singletons globales.
 */
export function TodoApp() {
  return (
    <TelarRoot>
      <div className="todo-app">
        <header className="todo-header">
          <h1>To Do List</h1>
          <p className="todo-subtitle">Demo de manejo de estado con Telar</p>
        </header>

        <section className="todo-section">
          <h2 className="section-title">
            <code>useBind</code> — escritura con reducers
          </h2>
          <p className="section-desc">
            Agrega tareas usando <code>dispatch.add()</code>. El componente no
            se re-renderiza al leer el estado de los todos.
          </p>
          <TodoInput />
        </section>

        <section className="todo-section">
          <h2 className="section-title">
            <code>useKnot</code> — lectura y escritura
          </h2>
          <p className="section-desc">
            Cambia el filtro activo. Lee el valor actual para resaltar el botón
            seleccionado y escribe cuando el usuario hace clic.
          </p>
          <TodoFilter />
        </section>

        <section className="todo-section">
          <h2 className="section-title">
            <code>useThread</code> — solo lectura (derivado)
          </h2>
          <p className="section-desc">
            Muestra estadísticas derivadas del grafo reactivo. Se recalcula
            automáticamente cuando cambia <code>todos</code>.
          </p>
          <TodoStats />
        </section>

        <section className="todo-section">
          <h2 className="section-title">Lista + acciones por item</h2>
          <p className="section-desc">
            <strong>TodoList</strong> usa <code>useThread</code> para la lista
            filtrada. Cada <strong>TodoItem</strong> usa <code>useBind</code>{' '}
            para toggle/delete sin leer el estado completo.
          </p>
          <TodoList />
        </section>
      </div>

      {/* DevTools: fuera del flujo de la app, fixed position */}
      <TelarDevTools />
    </TelarRoot>
  )
}
