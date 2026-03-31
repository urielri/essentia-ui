import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from '../MarkdownRenderer'

export const metadata = {
  title: 'Telar — Guía de implementación',
}

export default function GuidePage() {
  const filePath = path.join(process.env.TELAR_DOCS_DIR!, 'IMPLEMENTATION_GUIDE.md')
  const content  = fs.readFileSync(filePath, 'utf-8')
  return <MarkdownRenderer content={content} />
}
