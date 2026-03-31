import fs from 'fs'
import path from 'path'
import { MarkdownRenderer } from '../MarkdownRenderer'

export const metadata = {
  title: 'Telar — README',
}

export default function ReadmePage() {
  const filePath = path.join(process.env.TELAR_DOCS_DIR!, 'README.md')
  const content  = fs.readFileSync(filePath, 'utf-8')
  return <MarkdownRenderer content={content} />
}
