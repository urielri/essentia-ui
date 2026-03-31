'use client'

/**
 * TelarDevTools
 *
 * Panel flotante que observa el todoStateThread en tiempo real usando
 * useThread. Cada vez que el estado cambia, detecta qué mutó y guarda
 * un snapshot histórico.
 *
 * No modifica el estado bajo ninguna circunstancia — solo lectura.
 */

import { useThread } from '@repo/telar/react'
import { todoStateThread, type TodoState } from '../../../state/todo'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type MutationType =
  | 'ADD_TODO'
  | 'REMOVE_TODO'
  | 'TOGGLE_TODO'
  | 'CHANGE_FILTER'

type HistoryEntry = {
  id: string
  ts: number
  type: MutationType
  /** Primitiva de Telar que originó la mutación */
  primitive: 'useBind' | 'useKnot'
  description: string
  snapshot: TodoState
  expanded: boolean
}

// ─── Mutation detector ───────────────────────────────────────────────────────

function detectMutation(
  prev: TodoState,
  next: TodoState,
): Omit<HistoryEntry, 'id' | 'ts' | 'expanded'> | null {
  if (prev === next) return null

  if (prev.filter !== next.filter) {
    return {
      type:        'CHANGE_FILTER',
      primitive:   'useKnot',
      description: `filter  "${prev.filter}" → "${next.filter}"`,
      snapshot:    next,
    }
  }

  if (next.todos.length > prev.todos.length) {
    const added = next.todos.at(-1)!
    return {
      type:        'ADD_TODO',
      primitive:   'useBind',
      description: `"${added.text}" · prioridad ${added.priority}`,
      snapshot:    next,
    }
  }

  if (next.todos.length < prev.todos.length) {
    const removed = prev.todos.find(
      (t) => !next.todos.some((n) => n.id === t.id),
    )
    return {
      type:        'REMOVE_TODO',
      primitive:   'useBind',
      description: `"${removed?.text ?? '?'}"`,
      snapshot:    next,
    }
  }

  for (const todo of next.todos) {
    const prevTodo = prev.todos.find((t) => t.id === todo.id)
    if (prevTodo && prevTodo.completed !== todo.completed) {
      return {
        type:        'TOGGLE_TODO',
        primitive:   'useBind',
        description: `"${todo.text}"  →  ${todo.completed ? '✓ completada' : '○ pendiente'}`,
        snapshot:    next,
      }
    }
  }

  return null
}

// ─── JSON syntax highlighter ─────────────────────────────────────────────────

function syntaxHighlight(value: unknown): string {
  const raw = JSON.stringify(value, null, 2)

  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="dv-key">${match}</span>`
          : `<span class="dv-string">${match}</span>`
      }
      if (/true|false/.test(match))
        return `<span class="dv-bool">${match}</span>`
      if (/null/.test(match)) return `<span class="dv-null">${match}</span>`
      return `<span class="dv-number">${match}</span>`
    },
  )
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE: Record<MutationType, { label: string; color: string }> = {
  ADD_TODO:      { label: 'ADD',    color: '#10b981' },
  REMOVE_TODO:   { label: 'DEL',    color: '#ef4444' },
  TOGGLE_TODO:   { label: 'TOGGLE', color: '#f59e0b' },
  CHANGE_FILTER: { label: 'FILTER', color: '#8b5cf6' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre
      className="dv-json"
      dangerouslySetInnerHTML={{ __html: syntaxHighlight(value) }}
    />
  )
}

function PanelHeader({
  tab,
  onTab,
  historyCount,
  onClose,
}: {
  tab: 'state' | 'history'
  onTab: (t: 'state' | 'history') => void
  historyCount: number
  onClose: () => void
}) {
  return (
    <div className="dv-header">
      <div className="dv-title">
        <span className="dv-dot" />
        <span>Telar DevTools</span>
        <span className="dv-context-tag">todoStateThread</span>
      </div>
      <div className="dv-tabs">
        <button
          className={`dv-tab ${tab === 'state' ? 'active' : ''}`}
          onClick={() => onTab('state')}
        >
          Estado
        </button>
        <button
          className={`dv-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => onTab('history')}
        >
          Historial
          {historyCount > 0 && (
            <span className="dv-tab-badge">{historyCount}</span>
          )}
        </button>
      </div>
      <button className="dv-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}

function StateTab({ state }: { state: TodoState }) {
  return (
    <div className="dv-body">
      <div className="dv-section-label">
        <span className="dv-live-dot" /> En vivo
      </div>
      <JsonBlock value={state} />
    </div>
  )
}

function HistoryTab({
  history,
  onToggleExpand,
  onClear,
}: {
  history: HistoryEntry[]
  onToggleExpand: (id: string) => void
  onClear: () => void
}) {
  if (history.length === 0) {
    return (
      <div className="dv-body dv-empty">
        <span>Sin mutaciones registradas.</span>
        <small>Interactúa con la lista para ver cambios aquí.</small>
      </div>
    )
  }

  return (
    <div className="dv-body">
      <div className="dv-history-toolbar">
        <span className="dv-section-label">{history.length} mutaciones</span>
        <button className="dv-clear-btn" onClick={onClear}>
          Limpiar
        </button>
      </div>
      <div className="dv-history">
        {history.map((entry, i) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            isLatest={i === 0}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </div>
  )
}

function HistoryItem({
  entry,
  isLatest,
  onToggleExpand,
}: {
  entry: HistoryEntry
  isLatest: boolean
  onToggleExpand: (id: string) => void
}) {
  const badge = BADGE[entry.type]
  const time  = new Date(entry.ts).toLocaleTimeString('es', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className={`dv-entry ${isLatest ? 'latest' : ''}`}>
      <div className="dv-entry-row">
        <span className="dv-badge" style={{ background: badge.color }}>
          {badge.label}
        </span>
        <span className="dv-hook">{entry.primitive}</span>
        <span className="dv-time">{time}</span>
        <button
          className="dv-expand-btn"
          onClick={() => onToggleExpand(entry.id)}
          title="Ver snapshot"
        >
          {entry.expanded ? '▲' : '▼'}
        </button>
      </div>
      <div className="dv-entry-desc">{entry.description}</div>
      {entry.expanded && (
        <div className="dv-snapshot">
          <div className="dv-snapshot-label">Snapshot</div>
          <JsonBlock value={entry.snapshot} />
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TelarDevTools() {
  const state = useThread(todoStateThread)

  const [open, setOpen]     = useState(false)
  const [tab, setTab]       = useState<'state' | 'history'>('state')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [pulse, setPulse]   = useState(false)

  const prevRef = useRef(state)

  useEffect(() => {
    const mutation = detectMutation(prevRef.current, state)
    if (mutation) {
      setHistory((h) =>
        [
          {
            ...mutation,
            id:       crypto.randomUUID(),
            ts:       Date.now(),
            expanded: false,
          },
          ...h,
        ].slice(0, 100),
      )
      setPulse(true)
    }
    prevRef.current = state
  }, [state])

  useEffect(() => {
    if (!pulse) return
    const t = setTimeout(() => setPulse(false), 600)
    return () => clearTimeout(t)
  }, [pulse])

  const toggleExpand = useCallback((id: string) => {
    setHistory((h) =>
      h.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e)),
    )
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return (
    <>
      <button
        className={`dv-fab ${open ? 'dv-fab--open' : ''} ${pulse ? 'dv-fab--pulse' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Telar DevTools"
      >
        {open ? '✕' : <DevToolsIcon />}
        {!open && history.length > 0 && (
          <span className="dv-fab-badge">{history.length}</span>
        )}
      </button>

      {open && (
        <div className="dv-panel">
          <PanelHeader
            tab={tab}
            onTab={setTab}
            historyCount={history.length}
            onClose={() => setOpen(false)}
          />
          {tab === 'state' ? (
            <StateTab state={state} />
          ) : (
            <HistoryTab
              history={history}
              onToggleExpand={toggleExpand}
              onClear={clearHistory}
            />
          )}
        </div>
      )}
    </>
  )
}

function DevToolsIcon(): ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}
