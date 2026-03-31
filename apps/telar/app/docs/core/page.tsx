import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from '../MarkdownRenderer'

export const metadata = {
  title: 'Telar — Core',
}

export default function CoreDocsPage() {
  const filePath = path.join(process.env.TELAR_DOCS_DIR!, 'CORE.md')
  const content  = fs.readFileSync(filePath, 'utf-8')
  return <MarkdownRenderer content={content} />
}
