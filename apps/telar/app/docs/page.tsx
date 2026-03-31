import Link from 'next/link'

export const metadata = {
  title: 'Telar — Documentación',
}

const docs = [
  {
    href: '/docs/guide',
    title: 'Guía de implementación',
    description: 'Setup, primitivas, hooks, patrones de performance, SSR y errores comunes.',
    tag: 'IMPLEMENTATION_GUIDE.md',
  },
  {
    href: '/docs/readme',
    title: 'README',
    description: 'Inicio rápido, las tres primitivas, hooks y casos de uso.',
    tag: 'README.md',
  },
  {
    href: '/docs/core',
    title: 'Core',
    description: 'Documentación técnica de cada función en src/core/: tipos, store, grafo.',
    tag: 'CORE.md',
  },
  {
    href: '/docs/deep-dive',
    title: 'Deep Dive',
    description: 'Análisis profundo: BFS, epochs, dirty set, SSR, comparación con alternativas.',
    tag: 'DEEP_DIVE.md',
  },
  {
    href: '/docs/graph',
    title: 'Diagrama del grafo',
    description: 'Diagramas ASCII del grafo de dependencias, propagación, ciclo de vida y flujos.',
    tag: 'GRAPH.md',
  },
]

export default function DocsIndexPage() {
  return (
    <div>
      <div className="docs-index-header">
        <h1 className="docs-index-title">Documentación</h1>
        <p className="docs-index-subtitle">
          Guías técnicas, referencias de API y diagramas del sistema.
        </p>
      </div>
      <div className="docs-index-grid">
        {docs.map((doc) => (
          <Link key={doc.href} href={doc.href} className="docs-index-card">
            <p className="docs-index-card-title">{doc.title}</p>
            <p className="docs-index-card-desc">{doc.description}</p>
            <span className="docs-index-card-tag">{doc.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
