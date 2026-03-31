import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import './dashboard.css'

const DEMOS = [
  {
    href:  '/profile-demo',
    title: 'Profile + Preview',
    desc:  'SSR prefetch con React Server Components, Suspense streaming y skeleton. Theme persistido en sessionStorage.',
    tags:  ['RSC', 'Suspense', 'uiCache'],
  },
  {
    href:  '/worker-demo',
    title: 'Worker + IndexedDB',
    desc:  'Persistencia MPA con Dedicated Worker. Cifrado AES-256-GCM. Estado que sobrevive recargas y navegación.',
    tags:  ['Worker', 'IndexedDB', 'AES-GCM'],
  },
  {
    href:  '/todo',
    title: 'Todo List',
    desc:  'Gestión de lista con knots, threads derivados y bind con reducers tipados.',
    tags:  ['knot', 'thread', 'bind'],
  },
  {
    href:  '/squares',
    title: 'Squares',
    desc:  'Estado reactivo compartido entre múltiples componentes sin prop drilling.',
    tags:  ['reactive', 'shared state'],
  },
]

const DOCS = [
  {
    href:  '/docs',
    title: 'Documentación',
    desc:  'Guías de implementación, referencia del core, deep dive técnico y diagramas del grafo de dependencias.',
    tags:  ['CORE', 'API', 'Guías'],
  },
]

export default function DashboardPage() {
  return (
    <div className="db-page">
      <header className="db-header">
        <div className="db-header-inner">
          <div>
            <h1 className="db-logo">Telar</h1>
            <p className="db-tagline">Estado reactivo para React</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="db-main">
        <p className="db-section-label">Demos</p>
        <div className="db-grid">
          {DEMOS.map(demo => (
            <Link key={demo.href} href={demo.href} className="db-card">
              <h2 className="db-card-title">{demo.title}</h2>
              <p className="db-card-desc">{demo.desc}</p>
              <div className="db-tags">
                {demo.tags.map(tag => (
                  <span key={tag} className="db-tag">{tag}</span>
                ))}
              </div>
              <span className="db-card-arrow">→</span>
            </Link>
          ))}
        </div>
        <p className="db-section-label" style={{ marginTop: '2rem' }}>Referencias</p>
        <div className="db-grid">
          {DOCS.map(doc => (
            <Link key={doc.href} href={doc.href} className="db-card">
              <h2 className="db-card-title">{doc.title}</h2>
              <p className="db-card-desc">{doc.desc}</p>
              <div className="db-tags">
                {doc.tags.map(tag => (
                  <span key={tag} className="db-tag">{tag}</span>
                ))}
              </div>
              <span className="db-card-arrow">→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
