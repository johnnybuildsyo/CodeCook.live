import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { getLanguageFromFilename } from "@/lib/utils"
import { CommitLink as CommitLinkComponent } from "./commit-link"
import { CommitDiff } from "./editor/commit-diff"
import { Block } from "@/lib/types/session"

type SessionContentProps = {
  title: string
  blocks: Block[]
  theme?: string
  fullName: string
  showDate?: boolean
  created_at?: string
  commit_shas?: string[]
}

export function SessionContent({ title, blocks, theme, fullName, showDate, created_at, commit_shas }: SessionContentProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        {showDate && created_at && commit_shas && (
          <div className="text-xs font-mono flex items-center space-x-2 pb-2">
            <span>{new Date(created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span>{commit_shas.length} commits</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {blocks.map((block) => (
          <div className="session-block" key={block.id}>
            {block.type === "markdown" && (
              <div className="prose dark:prose-invert">
                <ReactMarkdown>{block.content || ""}</ReactMarkdown>
              </div>
            )}
            {block.type === "code" && block.file && (
              <div className="relative font-mono text-sm bg-muted rounded-lg mb-4">
                <div className="text-xs text-muted-foreground p-4 pb-0">{block.file.filename}</div>
                <div className="overflow-auto">
                  <SyntaxHighlighter language={getLanguageFromFilename(block.file.filename)} style={theme === "dark" ? oneDark : oneLight} customStyle={{ margin: 0, background: "transparent" }}>
                    {block.file.newValue}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
            {block.type === "diff" && block.file && <CommitDiff files={[block.file]} defaultRenderDiff={true} theme={theme} />}
            {block.type === "commit-links" && block.commits && fullName && (
              <div className="not-prose flex flex-col gap-1">
                {block.commits.map((link) => (
                  <div key={link.filename}>
                    <CommitLinkComponent filename={link.filename} sha={link.sha} fullName={fullName} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
