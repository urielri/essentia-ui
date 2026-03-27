import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from './MarkdownRenderer'

export const metadata = {
  title: 'Telar — Documentación técnica del core',
}

export default function CoreDocsPage() {
  const filePath = path.join(process.cwd(), '../../packages/telar/CORE.md')
  const content  = fs.readFileSync(filePath, 'utf-8')

  return (
    <main className="docs-page">
      <MarkdownRenderer content={content} />
    </main>
  )
}
