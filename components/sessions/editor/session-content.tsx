import { DndContext, closestCenter, DragEndEvent, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./sortable-item"
import { SessionPreview } from "./session-preview"
import { CommitInfo } from "./commit-info"
import { SessionIdeas } from "./session-ideas"
import { SessionHeader } from "./session-header"
import { BlockRenderer } from "./block-renderer"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { FileChange, Block } from "@/lib/types/session"

interface SessionContentProps {
  theme?: string
  view: "edit" | "preview"
  setView: (view: "edit" | "preview") => void
  title: string
  setTitle: (title: string) => void
  blocks: Block[]
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  files: FileChange[]
  fullName: string
  listenForCommits: boolean
  setListenForCommits: (listen: boolean) => void
  handleRemoveCommit: () => void
  setCommitSelectorOpen: (open: boolean) => void
  sessionIdeas: string[]
  clearIdeas: () => void
  generateIdeas: (codeChanges: string) => void
  codeChanges: string
  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (event: DragEndEvent) => void
  generateMarkdownBlock: (block: Block) => void
  addNewBlock: (type: string, content?: string) => void
  removeBlock: (id: string) => void
  updateBlockContent: (id: string, content: string) => void
  updateBlockCollapsed: (id: string, collapsed: boolean) => void
  updateBlockFile: (id: string, file: string) => void
  uploadImage: (file: File, blockId: string) => Promise<void>
  openDiffDialog: (blockId: string) => void
  openLinkSelector: (blockId: string) => void
}

export function SessionContent({
  theme,
  view,
  setView,
  title,
  setTitle,
  blocks,
  commit,
  files,
  fullName,
  listenForCommits,
  setListenForCommits,
  handleRemoveCommit,
  setCommitSelectorOpen,
  sessionIdeas,
  clearIdeas,
  generateIdeas,
  codeChanges,
  sensors,
  handleDragEnd,
  generateMarkdownBlock,
  addNewBlock,
  removeBlock,
  updateBlockContent,
  updateBlockCollapsed,
  updateBlockFile,
  uploadImage,
  openDiffDialog,
  openLinkSelector,
}: SessionContentProps) {
  return (
    <div className="relative">
      <Button className="absolute top-4 right-1/2 translate-x-4 gap-0" size="sm" variant="outline" onClick={() => generateIdeas(codeChanges)}>
        <>
          <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
          AI Assist
        </>
      </Button>
      <div className="space-y-4 2xl:grid 2xl:grid-cols-2">
        <div className="pt-4 2xl:p-8 2xl:pt-4 space-y-4 2xl:h-screen 2xl:overflow-y-auto relative">
          {sessionIdeas.length > 0 && <SessionIdeas ideas={sessionIdeas} onClose={clearIdeas} />}
          <CommitInfo
            commit={commit}
            files={files}
            fullName={fullName}
            listenForCommits={listenForCommits}
            onListenChange={setListenForCommits}
            onRemoveCommit={handleRemoveCommit}
            onChooseCommit={() => setCommitSelectorOpen(true)}
          />
          <SessionHeader title={title} onTitleChange={setTitle} view={view} onViewChange={(v) => setView(v as "edit" | "preview")} />
          {view === "edit" ? (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <SortableItem key={block.id} block={block}>
                      <BlockRenderer
                        block={block}
                        theme={theme}
                        onRemoveBlock={removeBlock}
                        onGenerateMarkdown={generateMarkdownBlock}
                        onAddNewBlock={addNewBlock}
                        onUpdateContent={updateBlockContent}
                        onUpdateCollapsed={updateBlockCollapsed}
                        onUpdateFile={updateBlockFile}
                        onUploadImage={uploadImage}
                        onOpenDiffDialog={openDiffDialog}
                        onOpenLinkSelector={openLinkSelector}
                        fullName={fullName}
                      />
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {blocks
                .filter((s) => s.type === "markdown")
                .map((block) => (
                  <div key={block.id} className="not-prose">
                    {block.content}
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="hidden 2xl:block px-8 2xl:h-screen overflow-y-auto !mt-0">
          <SessionPreview title={title} blocks={blocks} theme={theme} fullName={fullName} commit={commit} />
        </div>
      </div>
    </div>
  )
}
