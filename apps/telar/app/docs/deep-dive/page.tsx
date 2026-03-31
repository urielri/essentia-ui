import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from '../MarkdownRenderer'

export const metadata = {
  title: 'Telar — Deep Dive',
}

export default function DeepDivePage() {
  const filePath = path.join(process.env.TELAR_DOCS_DIR!, 'DEEP_DIVE.md')
  const content  = fs.readFileSync(filePath, 'utf-8')
  return <MarkdownRenderer content={content} />
}
