import Link from 'next/link'
import './docs.css'

const NAV = [
  { href: '/docs',           label: 'Inicio',              tag: 'índice'              },
  { href: '/docs/guide',     label: 'Guía de implementación', tag: 'IMPLEMENTATION_GUIDE.md' },
  { href: '/docs/readme',    label: 'README',              tag: 'README.md'           },
  { href: '/docs/core',      label: 'Core',                tag: 'CORE.md'             },
  { href: '/docs/deep-dive', label: 'Deep Dive',           tag: 'DEEP_DIVE.md'        },
  { href: '/docs/graph',     label: 'Grafo',               tag: 'GRAPH.md'            },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-shell">
      <nav className="docs-sidebar">
        <Link href="/" className="docs-sidebar-back">← Dashboard</Link>
        <p className="docs-sidebar-label">Documentación</p>
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className="docs-nav-link">
            {item.label}
            <span className="docs-nav-tag">{item.tag}</span>
          </Link>
        ))}
      </nav>
      <main className="docs-main">
        {children}
      </main>
    </div>
  )
}
