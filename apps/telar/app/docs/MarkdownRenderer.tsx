'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './docs.css'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="docs-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
