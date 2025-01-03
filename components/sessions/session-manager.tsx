"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./editor/sortable-item"
import { AIConnect } from "./editor/ai-connect"
import { SessionPreview } from "./editor/session-preview"
import { SessionProvider } from "./editor/session-context"
import { CommitInfo } from "./editor/commit-info"
import { DiffSelector } from "./editor/diff-selector"
import { FileChange } from "@/lib/types/session"
import { SessionIdeas } from "./editor/session-ideas"
import type { Session } from "@/lib/types/session"
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
import { useFileSelector } from "@/hooks/use-file-selector"
import { BlockRenderer } from "./editor/block-renderer"

interface SessionManagerProps {
  projectId: string
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  fullName: string
  session: Session
  onUnmount?: () => Promise<void>
}

export function SessionManager({ projectId, commit: initialCommit, fullName, session, onUnmount }: SessionManagerProps) {
  const { theme } = useTheme()
  const params = useParams()
  const username = typeof params.username === "string" ? params.username : ""
  const projectSlug = typeof params.projectId === "string" ? params.projectId : ""
  const [title, setTitle] = useState(session?.title || "")
  const [files, setFiles] = useState<FileChange[]>([])
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [aiEnabled] = useState(true)
  const [initialBlocks] = useState(session?.blocks)
  const [commit, setCommit] = useState(initialCommit)
  const [listenForCommits, setListenForCommits] = useState(!initialCommit.sha)

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
  const { handleDiffSelection, handleLinkSelection, getExistingDiffFiles } = useFileSelector()

  // Update commit polling effect
  useEffect(() => {
    async function fetchDiff() {
      console.log("Fetching diff for commit:", commit.sha)
      const response = await fetch(`/api/github/commits/${commit.sha}/diff?repo=${encodeURIComponent(fullName)}`)
      const data = await response.json()
      setFiles(data)
    }

    if (commit.sha) {
      fetchDiff()
    } else if (listenForCommits) {
      console.log("Starting commit polling for repo:", fullName)
      const pollInterval = setInterval(async () => {
        try {
          console.log("Polling for new commits...")
          const response = await fetch(`/api/github/commits/latest?repo=${encodeURIComponent(fullName)}`)
          const data = await response.json()
          console.log("Poll response:", data)

          if (data?.commit?.sha && data.commit.sha !== commit.sha) {
            console.log("New commit found:", data.commit)
            setCommit({
              sha: data.commit.sha,
              message: data.commit.message,
              author_name: data.commit.author.name,
              authored_at: data.commit.author.date,
            })
          }
        } catch (error) {
          console.error("Error polling for commits:", error)
        }
      }, 20000)

      return () => clearInterval(pollInterval)
    }
  }, [commit.sha, fullName, listenForCommits])

  useEffect(() => {
    const handleBeforeUnload = () => {
      onUnmount?.()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      onUnmount?.()
    }
  }, [onUnmount])

  const handleRemoveCommit = () => {
    setCommit({
      sha: "",
      message: "",
      author_name: "",
      authored_at: "",
    })
    setFiles([])
  }

  return (
    <SessionProvider>
      <div className="w-full flex gap-4 justify-between items-center px-8 pb-4 border-b">
        <h3 className="text-2xl font-bold">Live Session</h3>
        <AIConnect enabled={aiEnabled} />
        <BlueskyButton postUri={session?.bluesky_post_uri} onPublish={openBlueskyDialog} />
        <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        <EndSessionButton username={username} projectSlug={projectSlug} sessionId={session.id} />
      </div>
      <div className="space-y-4 2xl:grid 2xl:grid-cols-2">
        <div className="2xl:p-8 space-y-4 2xl:h-screen 2xl:overflow-y-auto">
          {sessionIdeas.length > 0 && <SessionIdeas ideas={sessionIdeas} onClose={clearIdeas} />}

          <CommitInfo commit={commit} files={files} fullName={fullName} listenForCommits={listenForCommits} onListenChange={setListenForCommits} onRemoveCommit={handleRemoveCommit} />

          <SessionHeader title={title} onTitleChange={setTitle} onGenerateIdeas={() => generateIdeas(codeChanges)} view={view} onViewChange={(v) => setView(v as "edit" | "preview")} />

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

      <DiffSelector
        open={diffDialogOpen}
        onClose={closeDiffDialog}
        files={files}
        existingFiles={getExistingDiffFiles(blocks, activeBlockId)}
        onSelect={(selections) => {
          setBlocks(handleDiffSelection(selections, activeBlockId!, commit.sha, fullName, blocks))
          closeDiffDialog()
        }}
      />

      <CommitLinkSelector
        open={linkSelectorOpen}
        onClose={closeLinkSelector}
        files={files}
        existingLinks={blocks.find((s) => s.id === activeBlockId)?.commits || []}
        onSelect={(selectedFiles) => {
          setBlocks(handleLinkSelection(selectedFiles, activeBlockId!, commit.sha, fullName, blocks))
          closeLinkSelector()
        }}
      />

      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={closeBlueskyDialog} title={title} blocks={blocks} projectFullName={fullName} />
    </SessionProvider>
  )
}
