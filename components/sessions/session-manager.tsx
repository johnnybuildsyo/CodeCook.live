"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "next-themes"
import { X, FileDiff, Plus, ChevronDown, ChevronUp, SparklesIcon } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./editor/sortable-item"
import { AIConnect } from "./editor/ai-connect"
import { SessionPreview } from "./editor/session-preview"
import { SessionProvider } from "./editor/session-context"
import { CommitInfo } from "./editor/commit-info"
import { ImageUpload } from "./editor/image-upload"
import { DiffSelector } from "./editor/diff-selector"
import { cn } from "@/lib/utils"
import { CommitDiff } from "./editor/commit-diff"
import { FileChange } from "@/lib/types/session"
import { SessionIdeas } from "./editor/session-ideas"
import type { Session } from "@/lib/types/session"
import { CommitLink } from "./commit-link"
import { CommitLinkSelector } from "./editor/commit-link-selector"
import { BlueskyShareDialog } from "./editor/bluesky-share-dialog"
import { useParams } from "next/navigation"
import { SaveStatus } from "./editor/save-status"
import { BlueskyButton } from "./editor/bluesky-button"
import { EndSessionButton } from "./editor/end-session-button"
import { SessionHeader } from "./editor/session-header"
import { useSessionAutosave } from "@/hooks/use-session-autosave"
import { useFileReferences } from "@/hooks/use-file-references"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useSessionIdeas } from "@/hooks/use-session-ideas"
import { useDialogManager } from "@/hooks/use-dialog-manager"
import { useBlockManager } from "@/hooks/use-block-manager"

interface SessionManagerProps {
  projectId: string
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  fullName: string
  session?: Session & {
    bluesky_post_uri?: string | null
  }
}

export function SessionManager({ projectId, commit, fullName, session }: SessionManagerProps) {
  const { theme } = useTheme()
  const params = useParams()
  const username = typeof params.username === "string" ? params.username : ""
  const projectSlug = typeof params.projectId === "string" ? params.projectId : ""
  const [title, setTitle] = useState(session?.title || "")
  const [files, setFiles] = useState<FileChange[]>([])
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [aiEnabled] = useState(true)
  const [initialBlocks] = useState(session?.blocks)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { blocks, handleDragEnd, generateMarkdownBlock, addNewBlock, removeBlock, updateBlockContent, updateBlockCollapsed, updateBlockFile, setBlocks } = useBlockManager({
    initialBlocks,
    title,
    codeChanges: "",
  })

  const { codeChanges } = useFileReferences(blocks, files)

  // Update block manager when code changes update
  useEffect(() => {
    if (codeChanges) {
      setBlocks((current) => current) // Trigger a re-render with latest codeChanges
    }
  }, [codeChanges, setBlocks])

  const { activeBlockId, diffDialogOpen, linkSelectorOpen, blueskyDialogOpen, openDiffDialog, closeDiffDialog, openLinkSelector, closeLinkSelector, openBlueskyDialog, closeBlueskyDialog } =
    useDialogManager()

  const { status: saveStatus, lastSavedAt } = useSessionAutosave({
    projectId,
    commitSha: commit.sha,
    sessionId: session?.id,
    title,
    blocks,
  })

  const { uploadImage } = useImageUpload(blocks, setBlocks)
  const { sessionIdeas, generateIdeas, clearIdeas } = useSessionIdeas()

  // Fetch diff when component mounts
  useEffect(() => {
    async function fetchDiff() {
      const response = await fetch(`/api/github/commits/${commit.sha}/diff?repo=${encodeURIComponent(fullName)}`)
      const data = await response.json()
      setFiles(data)
    }
    fetchDiff()
  }, [commit.sha, fullName])

  return (
    <SessionProvider>
      <div className="w-full flex gap-4 justify-between items-center px-8 pb-4 border-b">
        <h3 className="text-2xl font-bold">Live Session</h3>
        <AIConnect enabled={aiEnabled} />
        <BlueskyButton postUri={session?.bluesky_post_uri} onPublish={openBlueskyDialog} />
        <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        <EndSessionButton username={username} projectSlug={projectSlug} />
      </div>
      <div className="space-y-4 2xl:grid 2xl:grid-cols-2">
        <div className="2xl:p-8 space-y-4 2xl:h-screen 2xl:overflow-y-auto">
          {sessionIdeas.length > 0 && <SessionIdeas ideas={sessionIdeas} onClose={clearIdeas} />}

          <CommitInfo commit={commit} files={files} fullName={fullName} />

          <SessionHeader title={title} onTitleChange={setTitle} onGenerateIdeas={() => generateIdeas(codeChanges)} view={view} onViewChange={(v) => setView(v as "edit" | "preview")} />

          {view === "edit" ? (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <SortableItem key={block.id} block={block}>
                      {block.type === "markdown" && (
                        <div className="relative mt-2">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="h-6 w-6 p-0 border-yellow-500/30 hover:animate-pulse" onClick={() => generateMarkdownBlock(block)}>
                              <SparklesIcon className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </div>
                          <Textarea
                            className="mb-2"
                            value={block.content}
                            onChange={(e) => updateBlockContent(block.id, e.target.value)}
                            placeholder={
                              block.role === "intro"
                                ? "Start with what problem you're solving or what feature you're adding. What motivated these changes?"
                                : block.role === "summary"
                                  ? "Wrap up with the key benefits and any next steps. What impact will these changes have?"
                                  : "Explain the technical details. What approach did you take and why? What were the key decisions?"
                            }
                            rows={block.role === "implementation" ? 4 : 3}
                          />
                          <div className="flex gap-2">
                            <ImageUpload onUpload={(file) => uploadImage(file, block.id)} />
                            <Button variant="outline" size="sm" onClick={() => openDiffDialog(block.id)}>
                              <FileDiff className="h-4 w-4 mr-1" />
                              Add Code
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addNewBlock(block.id)}>
                              <Plus className="h-4 w-4 mr-1" />
                              New Block
                            </Button>
                          </div>
                        </div>
                      )}
                      {block.type === "diff" && block.file && (
                        <div className="relative">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <CommitDiff files={[block.file]} defaultRenderDiff={false} theme={theme} />
                        </div>
                      )}
                      {block.type === "code" && block.file && (
                        <div className="relative">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-mono text-sm bg-muted rounded-lg">
                            <div className={cn("flex justify-between items-center text-xs text-muted-foreground px-4", block.isCollapsed ? "py-1" : "py-2")}>
                              <span>{block.file.filename}</span>
                              <Button variant="ghost" size="sm" onClick={() => updateBlockCollapsed(block.id, !block.isCollapsed)}>
                                {block.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </Button>
                            </div>
                            {!block.isCollapsed && (
                              <div className="p-4 pt-0">
                                <Textarea
                                  value={block.file.newValue}
                                  onChange={(e) => updateBlockFile(block.id, e.target.value)}
                                  className="font-mono text-sm min-h-[200px] bg-transparent border-none focus-visible:ring-0 p-0 resize-none"
                                  spellCheck={false}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {block.type === "commit-links" && block.commits && (
                        <div className="relative">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="not-prose flex flex-col gap-1">
                            {block.commits.map((link) => (
                              <div key={link.filename}>
                                <CommitLink filename={link.filename} sha={link.sha} fullName={fullName} />
                              </div>
                            ))}
                            <div>
                              <button className="text-xs pl-4" onClick={() => openLinkSelector(block.id)}>
                                + add links
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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

      <DiffSelector
        open={diffDialogOpen}
        onClose={closeDiffDialog}
        files={files}
        existingFiles={blocks.find((s) => s.id === activeBlockId)?.type === "diff" ? blocks.filter((s) => s.type === "diff").map((s) => s.file?.filename || "") : []}
        onSelect={(selections) => {
          setBlocks((current) => {
            const index = current.findIndex((s) => s.id === activeBlockId)
            const newBlocks = [...current]
            const activeBlock = newBlocks[index]

            // Group file-link selections into a single commit-links block
            const fileLinks = selections
              .filter((s) => s.type === "commit-links")
              .map((s) => ({
                sha: commit.sha,
                filename: s.file.filename,
              }))

            if (fileLinks.length > 0) {
              if (activeBlock?.type === "commit-links" && activeBlock.commits) {
                // Merge new links with existing ones, avoiding duplicates
                const existingFilenames = new Set(activeBlock.commits.map((c) => c.filename))
                const uniqueNewLinks = fileLinks.filter((link) => !existingFilenames.has(link.filename))

                newBlocks[index] = {
                  ...activeBlock,
                  content: [...(activeBlock.commits || []), ...uniqueNewLinks].map((link) => `[${link.filename}](https://github.com/${fullName}/blob/${link.sha}/${link.filename})`).join("\n\n"),
                  commits: [...(activeBlock.commits || []), ...uniqueNewLinks],
                }
              } else {
                // Create new commit-links block
                newBlocks.splice(index + 1, 0, {
                  id: crypto.randomUUID(),
                  type: "commit-links",
                  content: fileLinks.map((link) => `[${link.filename}](https://github.com/${fullName}/blob/${link.sha}/${link.filename})`).join("\n\n"),
                  commits: fileLinks,
                })
              }
            }

            // Add remaining diff/code blocks
            selections
              .filter((s) => s.type !== "commit-links")
              .forEach((selection, i) => {
                if (selection.type === "code") {
                  newBlocks.splice(index + 1 + i, 0, {
                    id: crypto.randomUUID(),
                    type: "code",
                    content: selection.file.newValue,
                    file: selection.file,
                  })
                } else {
                  newBlocks.splice(index + 1 + i, 0, {
                    id: crypto.randomUUID(),
                    type: selection.type,
                    content: "",
                    file: selection.file,
                  })
                }
              })

            return newBlocks
          })
          closeDiffDialog()
        }}
      />

      <CommitLinkSelector
        open={linkSelectorOpen}
        onClose={closeLinkSelector}
        files={files}
        existingLinks={blocks.find((s) => s.id === activeBlockId)?.commits || []}
        onSelect={(selectedFiles) => {
          setBlocks((current) => {
            const index = current.findIndex((s) => s.id === activeBlockId)
            const activeBlock = current[index]

            if (activeBlock?.type === "commit-links") {
              const existingCommits = activeBlock.commits || []
              const newLinks = selectedFiles.map((file) => ({
                sha: commit.sha,
                filename: file.filename,
              }))

              return current.map((block, i) =>
                i === index
                  ? {
                      ...block,
                      content: [...existingCommits, ...newLinks].map((link) => `[${link.filename}](https://github.com/${fullName}/blob/${link.sha}/${link.filename})`).join("\n\n"),
                      commits: [...existingCommits, ...newLinks],
                    }
                  : block
              )
            }
            return current
          })
          closeLinkSelector()
        }}
      />

      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={closeBlueskyDialog} title={title} blocks={blocks} projectFullName={fullName} />
    </SessionProvider>
  )
}
