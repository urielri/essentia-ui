import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from '../MarkdownRenderer'

export const metadata = {
  title: 'Telar — Diagrama del grafo',
}

export default function GraphPage() {
  const filePath = path.join(process.env.TELAR_DOCS_DIR!, 'GRAPH.md')
  const content  = fs.readFileSync(filePath, 'utf-8')
  return <MarkdownRenderer content={content} />
}
