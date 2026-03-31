'use client'

import { useRef } from 'react'
import { TelarRootProvider as TelarRoot } from '@repo/telar/react'
import { useKnot, useBind, useDispatch } from '@repo/telar/react'
import { installedAppsKnot, recentAppsBind, type App } from '../../state/apps'

// ─── Contador de renders visible ─────────────────────────────────────────────

function RenderBadge({ label }: { label: string }) {
  const count = useRef(0)
  count.current += 1
  return (
    // suppressHydrationWarning: el contador difiere intencionalmente entre
    // servidor (#1) y cliente en Strict Mode (#2). No es un bug real.
    <span
      suppressHydrationWarning
      style={{
        background: count.current === 1 ? '#1f6feb' : '#b45309',
        color: '#fff',
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: '999px',
        fontFamily: 'monospace',
      }}
    >
      {label} #{count.current}
    </span>
  )
}

// ─── Componente A — lee installedAppsKnot ─────────────────────────────────────

function InstalledApps() {
  const [apps, setApps] = useKnot(installedAppsKnot)

  const addApp = () => {
    const name = `App ${apps.length + 1}`
    setApps((prev) => [...prev, { id: crypto.randomUUID(), name }])
  }

  return (
    <div style={card}>
      <div style={cardHeader}>
        <strong>installedAppsKnot</strong>
        <RenderBadge label="InstalledApps" />
      </div>
      <ul style={list}>
        {apps.map((a) => <li key={a.id} style={item}>{a.name}</li>)}
      </ul>
      <button style={btn} onClick={addApp}>+ Instalar app</button>
    </div>
  )
}

// ─── Componente B — lee recentAppsBind ───────────────────────────────────────

function RecentApps() {
  const [recent, dispatch] = useBind(recentAppsBind)

  return (
    <div style={card}>
      <div style={cardHeader}>
        <strong>recentAppsBind</strong>
        <RenderBadge label="RecentApps" />
      </div>
      {recent.length === 0
        ? <p style={{ color: '#8b949e', margin: 0 }}>Sin apps recientes</p>
        : <ul style={list}>
            {recent.map((a) => <li key={a.id} style={item}>{a.name}</li>)}
          </ul>
      }
      {recent.length > 0 && (
        <button style={{ ...btn, background: '#6e2c2c' }} onClick={() => dispatch.clear()}>
          Limpiar recientes
        </button>
      )}
    </div>
  )
}

// ─── Componente C — solo escribe en recentAppsBind (sin leer) ────────────────

function AppLauncher() {
  const [apps]   = useKnot(installedAppsKnot)
  const dispatch = useDispatch(recentAppsBind)

  return (
    <div style={card}>
      <div style={cardHeader}>
        <strong>AppLauncher</strong>
        <small style={{ color: '#8b949e' }}>lee installedAppsKnot · useDispatch(recentAppsBind)</small>
        <RenderBadge label="AppLauncher" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {apps.map((a) => (
          <button key={a.id} style={btn} onClick={() => dispatch.open(a)}>
            Abrir {a.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AppsPage() {
  return (
    <TelarRoot>
      <div style={page}>
        <h1 style={title}>Experimento de re-renders</h1>
        <p style={subtitle}>
          El badge cambia a <span style={{ color: '#b45309' }}>naranja</span> cuando
          el componente se re-renderiza. Observá qué cambia al interactuar con cada sección.
        </p>

        <div style={grid}>
          <InstalledApps />
          <RecentApps />
          <AppLauncher />
        </div>
      </div>
    </TelarRoot>
  )
}

// ─── Estilos inline ───────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0d1117',
  padding: '3rem 1.5rem',
  color: '#e6edf3',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  marginBottom: '0.5rem',
  color: '#f0f6fc',
}

const subtitle: React.CSSProperties = {
  color: '#8b949e',
  marginBottom: '2rem',
  lineHeight: 1.6,
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
}

const card: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '8px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const list: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const item: React.CSSProperties = {
  color: '#cdd9e5',
  fontSize: '0.9rem',
}

const btn: React.CSSProperties = {
  background: '#21262d',
  border: '1px solid #30363d',
  color: '#e6edf3',
  padding: '0.4rem 0.85rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
}
