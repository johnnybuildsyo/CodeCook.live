import { SessionBlock } from "@/lib/types/session"
import { SessionProvider } from "./session-context"
import { SessionContent } from "../session-content"

interface SessionPreviewProps {
  title: string
  blocks: SessionBlock[]
  theme?: string
  fullName: string
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
}

export function SessionPreview({ title, blocks, theme, fullName }: SessionPreviewProps) {
  const isEmpty = !title && blocks.every((block) => (block.type === "markdown" ? !block.content : false))

  if (isEmpty) {
    return (
      <div className="space-y-8 border-l pl-8 pb-8">
        <div className="prose dark:prose-invert text-muted-foreground">
          <h2 className="text-muted-foreground">Create Your Session</h2>
          <p>A great session typically includes:</p>
          <ul>
            <li>A clear title describing the changes</li>
            <li>An introduction explaining the problem or feature</li>
            <li>Technical details about your implementation</li>
            <li>Relevant code snippets or diffs</li>
            <li>A summary of the impact and next steps</li>
          </ul>
          <p>Start by adding a title and writing in the markdown blocks. You can also add code snippets and diffs using the buttons below each block.</p>
        </div>
      </div>
    )
  }

  return (
    <SessionProvider defaultView="preview">
      <div className="border-l p-8 min-h-full">
        <SessionContent title={title} blocks={blocks} theme={theme} fullName={fullName} />
      </div>
    </SessionProvider>
  )
}
