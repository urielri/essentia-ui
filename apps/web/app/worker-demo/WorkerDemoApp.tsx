'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { TelarRootProvider, TelarPersistence, useKnot, useBind } from '@repo/telar/react'
import { createTelarWorker, invalidatePersistedStore } from '@repo/telar/worker'
import { themeKnot, noteKnot, counterBind, nextTheme, PERSISTED_NODES, THEMES } from '../../state/worker-demo'
import './worker-demo.css'

// ─── Worker singleton ─────────────────────────────────────────────────────────
// Se crea una sola vez por tab y persiste entre navegaciones del mismo tab.
// En SSR (server), typeof window === 'undefined' → retorna undefined.

let workerSingleton: Worker | undefined

function getWorker(): Worker | undefined {
  if (typeof window === 'undefined') return undefined
  if (!workerSingleton) workerSingleton = createTelarWorker()
  return workerSingleton
}

// ─── Demo content ─────────────────────────────────────────────────────────────

function DemoContent({ workerReady }: { workerReady: boolean }) {
  const [theme, setTheme] = useKnot(themeKnot)
  const [note,  setNote]  = useKnot(noteKnot)
  const [count, dispatch] = useBind(counterBind)

  return (
    <div className="wd-demo">

      {/* Status */}
      <div className="wd-status">
        <span className={`wd-status-dot ${workerReady ? 'active' : ''}`} />
        {workerReady ? 'Worker conectado — IndexedDB activo' : 'Conectando Worker...'}
      </div>

      {/* Tema */}
      <section className="wd-section">
        <p className="wd-label">Tema</p>
        <button
          className="wd-color-swatch"
          style={{ background: theme }}
          onClick={() => setTheme(nextTheme(theme))}
          title="Click para cambiar"
        />
        <p className="wd-hint">Click para cambiar · se persiste en IndexedDB</p>
      </section>

      {/* Nota */}
      <section className="wd-section">
        <p className="wd-label">Nota</p>
        <textarea
          className="wd-textarea"
          value={note}
          placeholder="Escribí algo..."
          onChange={e => setNote(e.target.value)}
        />
      </section>

      {/* Contador */}
      <section className="wd-section">
        <p className="wd-label">Contador</p>
        <div className="wd-counter">
          <button onClick={() => dispatch.decrement()}>−</button>
          <span suppressHydrationWarning>{count}</span>
          <button onClick={() => dispatch.increment()}>+</button>
          <button onClick={() => dispatch.reset()} style={{ fontSize: '0.65rem', width: 'auto', padding: '0 0.6rem' }}>
            reset
          </button>
        </div>
      </section>

    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function WorkerDemoApp() {
  const workerRef    = useRef<Worker | undefined>(undefined)
  const [ready, setReady] = useState(false)

  // Worker se crea una sola vez en el cliente
  if (!workerRef.current) {
    workerRef.current = getWorker()
  }

  // Detectar cuando el Worker envió el snapshot (= IndexedDB listo)
  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'snapshot') setReady(true)
    }

    worker.addEventListener('message', onMessage)
    return () => worker.removeEventListener('message', onMessage)
  }, [])

  return (
    <TelarRootProvider>
      <TelarPersistence
        worker={workerRef.current}
        persistedNodes={PERSISTED_NODES}
        storeVersion="1"
        nodeConstraints={{
          'wd-theme':   { allowedValues: THEMES },
          'wd-note':    { maxLength: 10_000 },
          'wd-counter': { min: 0, max: 9_999 },
        }}
      >
      <div className="wd-page">

        <header className="wd-header">
          <h1>Worker + IndexedDB</h1>
          <p>
            Modificá cualquier valor, luego recargá la página o navegá a otra ruta y volvé.
            El estado persiste porque el Worker escribe en IndexedDB en cada cambio.
            Al cerrar el tab o el navegador los datos se descartan (modo <code>session</code>).
          </p>
        </header>

        <DemoContent workerReady={ready} />

        <footer className="wd-footer">
          <p className="wd-label">Probar navegación MPA</p>
          <div className="wd-links">
            <Link href="/squares">→ /squares</Link>
            <Link href="/squares-context">→ /squares-context</Link>
            <Link href="/docs">→ /docs</Link>
          </div>

          <p className="wd-label" style={{ marginTop: '1.5rem' }}>Invalidar store</p>
          <div className="wd-links">
            <button
              className="wd-btn-danger"
              onClick={() => {
                const w = workerRef.current
                if (w) invalidatePersistedStore(w)
              }}
            >
              Borrar todo
            </button>
            <button
              className="wd-btn-danger"
              onClick={() => {
                const w = workerRef.current
                if (w) invalidatePersistedStore(w, ['wd-counter'])
              }}
            >
              Borrar contador
            </button>
          </div>
          <p className="wd-hint">Recargá la página después para verificar.</p>
        </footer>

      </div>
      </TelarPersistence>
    </TelarRootProvider>
  )
}
