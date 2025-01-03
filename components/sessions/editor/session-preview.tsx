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
      <div className="space-y-8 border-l pl-8 pb-8 min-h-full">
        <div className="prose dark:prose-invert text-muted-foreground pt-8">
          <h2 className="text-muted-foreground">Cook up a New Code Session</h2>
          <p>A great session typically includes:</p>
          <ul>
            <li>A clear title describing what we’re building</li>
            <li>An introduction explaining the problem or feature.</li>
            <li>Technical details about your implementation as you go.</li>
            <li>Share your code as you go, and get feedback from the community.</li>
            <li>Finish with a summary of where you ended up and what you’re doing next.</li>
          </ul>
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
