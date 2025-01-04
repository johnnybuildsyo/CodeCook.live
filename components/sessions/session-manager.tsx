"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./editor/sortable-item"
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
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChatWindow } from "./chat/chat-window"
import { MessageCircle } from "lucide-react"

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
  const [listenForCommits, setListenForCommits] = useState(!initialCommit.sha)
  const [listenStartTime, setListenStartTime] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isChatEnabled, setIsChatEnabled] = useState(session?.chat_enabled ?? false)

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
      console.log("Has commit SHA, fetching diff...")
      fetchDiff()
    } else if (listenForCommits) {
      const startTime = new Date().toISOString()
      console.log("Starting commit polling at:", startTime)
      console.log("Repo:", fullName)
      setListenStartTime(startTime)

      // Initial check
      const checkForCommits = async () => {
        try {
          console.log("Checking for new commits since:", startTime)
          const response = await fetch(`/api/github/commits/latest?repo=${encodeURIComponent(fullName)}&since=${startTime}`)
          const data = await response.json()
          console.log("Poll response data:", data)

          if (data?.commit?.sha && data.commit.sha !== commit.sha) {
            console.log("New commit detected:", {
              sha: data.commit.sha,
              message: data.commit.message,
              currentSha: commit.sha,
            })
            setCommit({
              sha: data.commit.sha,
              message: data.commit.message,
              author_name: data.commit.author.name,
              authored_at: data.commit.author.date,
            })
          } else {
            console.log("No new commits found")
          }
        } catch (error) {
          console.error("Error polling for commits:", error)
        }
      }

      // Run initial check
      checkForCommits()

      // Set up interval
      const pollInterval = setInterval(checkForCommits, 20000)
      console.log("Polling interval set up")

      return () => {
        console.log("Cleaning up polling interval")
        clearInterval(pollInterval)
      }
    } else {
      console.log("Not listening for commits")
    }
  }, [commit.sha, fullName, listenForCommits])

  // Handle listen state changes
  useEffect(() => {
    if (listenForCommits && !listenStartTime) {
      setListenStartTime(new Date().toISOString())
    }
  }, [listenForCommits, listenStartTime])

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
    console.log("Removing commit and starting to listen")
    setCommit({
      sha: "",
      message: "",
      author_name: "",
      authored_at: "",
    })
    setFiles([])
    setListenForCommits(true)
  }

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/${username}/${projectSlug}/session/${session.id}`
    navigator.clipboard.writeText(url)
    toast.success("Share link copied to clipboard")
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleToggleChat = async () => {
    const supabase = createClient()
    const newChatEnabled = !isChatEnabled
    console.log("Toggling chat:", { newChatEnabled })

    const { error } = await supabase.from("sessions").update({ chat_enabled: newChatEnabled }).eq("id", session.id)

    if (error) {
      console.error("Failed to toggle chat:", error)
      toast.error("Failed to toggle chat")
      return
    }

    setIsChatEnabled(newChatEnabled)
    toast.success(newChatEnabled ? "Chat enabled" : "Chat disabled")
  }

  // Sync chat state with database
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          console.log("Session update:", payload)
          setIsChatEnabled(payload.new.chat_enabled)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.id])

  // Add console log for render
  console.log("Rendering SessionManager:", { isChatEnabled, sessionChatEnabled: session?.chat_enabled })

  return (
    <SessionProvider>
      <div className="w-full flex gap-4 justify-between items-center xl:px-8 pb-4 xl:border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold mr-2">Live Session</h3>
          <BlueskyButton postUri={session?.bluesky_post_uri} onPublish={openBlueskyDialog} />
          <Button className="bg-blue-500/90 hover:bg-blue-500 text-white" onClick={handleCopyShareLink}>
            <Share2 className={cn("h-4 w-4 mr-1", isCopied && "mr-2")} />
            {isCopied ? "Copied" : "Share Link"}
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <Switch checked={isChatEnabled} onCheckedChange={handleToggleChat} className="data-[state=checked]:bg-green-500" />
            <Label className="text-sm flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              Chat
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SaveStatus saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
          <EndSessionButton username={username} projectSlug={projectSlug} sessionId={session.id} />
        </div>
      </div>
      <div className="relative">
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

        {isChatEnabled && (
          <ChatWindow
            key="chat-window"
            sessionId={session.id}
            onClose={() => {
              console.log("Chat window close triggered")
              setIsChatEnabled(false)
              handleToggleChat()
            }}
          />
        )}
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
