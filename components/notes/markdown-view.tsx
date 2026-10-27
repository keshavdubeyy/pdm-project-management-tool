"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Reading view: the same markdown, rendered. */
export function MarkdownView({ source }: { source: string }) {
  if (!source.trim()) {
    return (
      <p className="text-meta text-muted-foreground">Nothing written yet.</p>
    )
  }
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // `node` is react-markdown's own prop; it must not reach the DOM.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
