"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { SessionProvider } from "./editor/session-context"
import { DiffSelector } from "./editor/diff-selector"
import { FileChange } from "@/lib/types/session"
import type { Session } from "@/lib/types/session"
import { CommitLinkSelector } from "./editor/commit-link-selector"
import { useParams } from "next/navigation"
import { SaveStatus } from "./editor/save-status"
import { EndSessionButton } from "./editor/end-session-button"
import { useSessionAutosave } from "@/hooks/use-session-autosave"
import { useFileReferences } from "@/hooks/use-file-references"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useSessionIdeas } from "@/hooks/use-session-ideas"
import { useDialogManager } from "@/hooks/use-dialog-manager"
import { useBlockManager } from "@/hooks/use-block-manager"
import { useFileSelector } from "@/hooks/use-file-selector"
import { Button } from "@/components/ui/button"
import { MegaphoneIcon, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboardWithFeedback } from "@/lib/utils/markdown"
import { ChatToggle } from "./chat/chat-toggle"
import { CommitSelectorDialog } from "./editor/commit-selector-dialog"
import { useCommitPolling } from "../../hooks/use-commit-polling"
import { useSessionHandlers } from "../../hooks/use-session-handlers"
import { SessionContent } from "./editor/session-content"
import { CopyLink } from "./editor/copy-link"
import { ShareDialog } from "./editor/share-dialog"

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
  const [initialBlocks] = useState(session?.blocks)
  const [commit, setCommit] = useState(initialCommit)
  const [listenForCommits, setListenForCommits] = useState(false)
  const [isAnnouncementCopied, setIsAnnouncementCopied] = useState(false)
  const [commitSelectorOpen, setCommitSelectorOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const sessionUrl = `/${username}/${projectSlug}/sessions/${session.id}`

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
      setBlocks((current) => current)
    }
  }, [codeChanges, setBlocks])

  const { activeBlockId, diffDialogOpen, linkSelectorOpen, openDiffDialog, closeDiffDialog, openLinkSelector, closeLinkSelector } = useDialogManager()

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

  // Use custom hook for commit polling
  useCommitPolling({
    commit,
    setCommit,
    fullName,
    listenForCommits,
    setFiles,
  })

  // Use custom hook for session handlers
  const { handleRemoveCommit, handleCommitSelect } = useSessionHandlers({
    setCommit,
    setFiles,
    setListenForCommits,
    setCommitSelectorOpen,
  })

  const handleCopyAnnouncement = async () => {
    const sessionUrl = `${window.location.origin}/${username}/${projectSlug}/sessions/${session.id}`
    const chatEnabled = session.chat_enabled ?? false
    const chatText = chatEnabled ? " (now with chat!)" : ""
    const announcementText = `I'm starting up a live #buildinpublic CodeCook coding session${chatText} => "${title}" at ${sessionUrl}`
    await copyToClipboardWithFeedback(announcementText, setIsAnnouncementCopied)
  }

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

  return (
    <SessionProvider>
      <div className="w-full flex gap-4 justify-between items-center 2xl:px-4 pb-4 xl:border-b">
        <div className="flex items-center gap-2">
          <div className="flex flex-col justify-start items-start w-[175px]">
            <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
          </div>
          <CopyLink url={sessionUrl} />
          <Button onClick={() => setShareDialogOpen(true)} variant="outline2" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!title.trim()}
            className={cn("border-blue-500/90 text-blue-500 hover:bg-blue-500/90 hover:text-white", !title.trim() && "opacity-50 cursor-not-allowed")}
            onClick={handleCopyAnnouncement}
          >
            <MegaphoneIcon className={cn("h-4 w-4 -rotate-12 scale-110", isAnnouncementCopied && "mr-1")} />
            {isAnnouncementCopied ? "Copied" : "Announce"}
          </Button>
          <div className="pl-2">
            <ChatToggle sessionId={session.id} initialEnabled={session.chat_enabled ?? false} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <EndSessionButton username={username} projectSlug={projectSlug} sessionId={session.id} />
        </div>
      </div>
      <SessionContent
        theme={theme}
        view={view}
        setView={setView}
        title={title}
        setTitle={setTitle}
        blocks={blocks}
        commit={commit}
        files={files}
        fullName={fullName}
        listenForCommits={listenForCommits}
        setListenForCommits={setListenForCommits}
        handleRemoveCommit={handleRemoveCommit}
        setCommitSelectorOpen={setCommitSelectorOpen}
        sessionIdeas={sessionIdeas}
        clearIdeas={clearIdeas}
        generateIdeas={generateIdeas}
        codeChanges={codeChanges}
        sensors={sensors}
        handleDragEnd={handleDragEnd}
        generateMarkdownBlock={generateMarkdownBlock}
        addNewBlock={addNewBlock}
        removeBlock={removeBlock}
        updateBlockContent={updateBlockContent}
        updateBlockCollapsed={updateBlockCollapsed}
        updateBlockFile={updateBlockFile}
        uploadImage={uploadImage}
        openDiffDialog={openDiffDialog}
        openLinkSelector={openLinkSelector}
      />

      <CommitSelectorDialog open={commitSelectorOpen} onOpenChange={setCommitSelectorOpen} fullName={fullName} onSelect={handleCommitSelect} />

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

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={title}
        blocks={blocks}
        sessionUrl={sessionUrl}
        postUri={session?.bluesky_post_uri || undefined}
        projectFullName={fullName}
      />
    </SessionProvider>
  )
}
