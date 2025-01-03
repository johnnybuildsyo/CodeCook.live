"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Sparkles, FileDiff, Plus, ChevronDown, ChevronUp, SparklesIcon, Circle, ChevronsLeft, SquareArrowOutUpRight } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "./editor/sortable-item"
import { AIConnect } from "./editor/ai-connect"
import { generateSessionIdeas } from "@/lib/ai/sessions/actions"
import { getStreamingText } from "@/app/api/ai/util"
import { toast } from "sonner"
import { readStreamableValue } from "ai/rsc"
import { SessionPreview } from "./editor/session-preview"
import { SessionProvider } from "./editor/session-context"
import { CommitInfo } from "./editor/commit-info"
import { ImageUpload } from "./editor/image-upload"
import { DiffSelector } from "./editor/diff-selector"
import { cn, shouldExcludeFile } from "@/lib/utils"
import { CommitDiff } from "./editor/commit-diff"
import { SessionBlock, FileChange } from "@/lib/types/session"
import { SessionIdeas } from "./editor/session-ideas"
import { generateBlockPrompt } from "@/lib/ai/sessions/prompts"
import type { Session } from "@/lib/types/session"
import { upsertSession } from "@/app/api/sessions/actions"
import { CommitLink } from "./commit-link"
import { CommitLinkSelector } from "./editor/commit-link-selector"
import { DEFAULT_SESSION_BLOCKS } from "./editor/utils"
import { BlueskyShareDialog } from "./editor/bluesky-share-dialog"
import { BlueskyIcon } from "@/components/icons/bluesky"
import { useParams } from "next/navigation"
import { PauseCircleIcon } from "@heroicons/react/24/solid"

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
  const { username, projectId: projectSlug } = useParams()
  const [title, setTitle] = useState(session?.title || "")
  const [files, setFiles] = useState<FileChange[]>([])
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [blocks, setBlocks] = useState<SessionBlock[]>(session?.blocks || DEFAULT_SESSION_BLOCKS)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const [aiEnabled] = useState(true)
  const [sessionIdeas, setSessionIdeas] = useState<string[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string>()
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)
  const [linkSelectorOpen, setLinkSelectorOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false)

  // Get filenames from code blocks
  const referencedFiles = useMemo(() => {
    const codeFilenames = new Set<string>()
    blocks.forEach((block) => {
      if (block.type === "code" || block.type === "diff") {
        if (block.file?.filename) {
          codeFilenames.add(block.file.filename)
        }
      } else if (block.type === "commit-links" && block.commits) {
        block.commits.forEach((link) => {
          codeFilenames.add(link.filename)
        })
      }
    })
    return codeFilenames
  }, [blocks])

  // If we have code blocks, only use those files. Otherwise, use all files.
  let codeChanges = useMemo(() => {
    const fileArray = Array.isArray(files) ? files : []
    const relevantFiles = referencedFiles.size > 0 ? fileArray.filter((f) => referencedFiles.has(f.filename)) : fileArray.filter((f) => !shouldExcludeFile(f.filename))
    return relevantFiles.map((f) => `File: ${f.filename}\n\nChanges:\n${f.newValue}`).join("\n\n---\n\n")
  }, [files, referencedFiles])

  // Truncate if too long
  codeChanges = codeChanges.length > 20000 ? codeChanges.slice(0, 20000) + "...(truncated)" : codeChanges

  // Fetch diff when component mounts
  useEffect(() => {
    async function fetchDiff() {
      const response = await fetch(`/api/github/commits/${commit.sha}/diff?repo=${encodeURIComponent(fullName)}`)
      const data = await response.json()
      setFiles(data)
    }
    fetchDiff()
  }, [commit.sha, fullName])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const generateIdeas = async () => {
    const { object } = await generateSessionIdeas(codeChanges)
    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject?.sessionIdeas) {
        setSessionIdeas(partialObject.sessionIdeas)
      }
    }
  }

  const generateMarkdownBlock = async (block: SessionBlock) => {
    const prompt = generateBlockPrompt({
      block,
      title,
      blocks,
      codeChanges,
    })

    const updateBlockContent = (content: string) => {
      setBlocks((current) => current.map((s) => (s.id === block.id ? { ...s, content: content } : s)))
    }

    await getStreamingText(prompt, updateBlockContent)
  }

  const handleImageUpload = async (file: File, blockId: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { image_url } = await response.json()

      setBlocks((current) => {
        const updatedBlocks = current.map((block) => {
          if (block.id === blockId && block.type === "markdown") {
            const imageMarkdown = `\n\n![](${image_url})`
            const updatedContent = block.content + imageMarkdown
            return {
              ...block,
              content: updatedContent,
            }
          }
          return block
        })
        return updatedBlocks
      })
    } catch (error) {
      console.error("Image upload failed:", error)
      toast.error("Failed to upload image. Please try again.")
    }
  }

  // Debounced auto-save handler
  const debouncedSave = useCallback(
    async (title: string, blocks: SessionBlock[]) => {
      setSaveStatus("saving")
      try {
        const cleanedBlocks = blocks.map((block): SessionBlock => {
          switch (block.type) {
            case "markdown":
              return {
                id: block.id,
                type: "markdown",
                content: block.content || "",
                role: block.role,
              }
            case "commit-links":
              return {
                id: block.id,
                type: "commit-links",
                content: block.content || "",
                commits: block.commits || [],
              }
            case "code":
              return {
                id: block.id,
                type: "code",
                content: block.content || "",
                filename: block.filename,
              }
            case "diff":
              return {
                id: block.id,
                type: "diff",
                content: block.content || "",
                file: block.file,
              }
            case "image":
              return {
                id: block.id,
                type: "image",
                content: block.content || "",
                imageUrl: block.imageUrl,
              }
          }
        })

        const sessionData = {
          title,
          blocks: cleanedBlocks,
          commit_shas: [commit.sha],
        }

        const { success } = await upsertSession(projectId, sessionData, session?.id)
        if (success) {
          setSaveStatus("saved")
          setLastSavedAt(new Date())
        } else {
          setSaveStatus("error")
        }
      } catch (error) {
        console.error("Auto-save failed:", error)
        setSaveStatus("error")
      }
    },
    [projectId, commit.sha, session?.id]
  )

  // Auto-save when content changes
  useEffect(() => {
    if (!title) return // Don't auto-save if there's no title

    const timeoutId = setTimeout(() => {
      debouncedSave(title, blocks)
    }, 2000) // Wait 2 seconds after last change

    return () => clearTimeout(timeoutId)
  }, [title, blocks, debouncedSave])

  return (
    <SessionProvider>
      <div className="w-full flex gap-4 justify-between items-center px-8 pb-4 border-b">
        <h3 className="text-2xl font-bold">Live Session</h3>
        <AIConnect enabled={aiEnabled} />
        <Button
          variant="outline"
          onClick={() => {
            if (session?.bluesky_post_uri) {
              // Convert AT Protocol URI to Bluesky web URL
              const [, , did, , postId] = session.bluesky_post_uri.split("/")
              window.open(`https://bsky.app/profile/${did}/post/${postId}`, "_blank")
            } else {
              setBlueskyDialogOpen(true)
            }
          }}
        >
          <BlueskyIcon className="h-4 w-4 mr-1 text-blue-500" />
          {session?.bluesky_post_uri ? (
            <span className="flex items-center gap-1">
              <span>View on Bluesky</span>
              <SquareArrowOutUpRight className="h-3 w-3 scale-75 opacity-70" />
            </span>
          ) : (
            "Publish to Bluesky"
          )}
        </Button>
        <div className="flex flex-col items-end gap-1 ml-auto">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 rounded-full scale-75 text-green-500 ring-4 ring-green-500/30" fill="currentColor" />
            <span className="text-xs text-muted-foreground">Connected</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {saveStatus === "saving" && <span>Updating...</span>}
            {saveStatus === "saved" && lastSavedAt && <span>Last updated at {new Date(lastSavedAt).toLocaleTimeString()}</span>}
            {saveStatus === "error" && <span className="text-destructive">Update failed</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="flex flex-col items-center">
            <Link href={`/${username}/${projectSlug}`} className="flex items-center text-xs h-auto">
              <span className="flex items-center gap-1">
                <PauseCircleIcon className="h-3 w-3" />
                End Session
              </span>
              <span className="text-[10px] font-mono font-light flex items-center gap-0.5">
                <ChevronsLeft className="h-3 w-3 opacity-50" /> back to project
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <div className="space-y-4 2xl:grid 2xl:grid-cols-2">
        <div className="2xl:p-8 space-y-4 2xl:h-screen 2xl:overflow-y-auto">
          {sessionIdeas.length > 0 && <SessionIdeas ideas={sessionIdeas} onClose={() => setSessionIdeas([])} />}

          <CommitInfo commit={commit} files={files} fullName={fullName} />

          <div className="flex gap-4 items-center py-4">
            <Input
              className="!text-2xl font-bold border-t-0 shadow-none border-l-0 border-r-0 rounded-none border-b-foreground/20 pl-1 !focus:outline-none !focus-visible:ring-0 focus:border-b-foreground !ring-0"
              placeholder="Session title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button variant="outline" onClick={generateIdeas}>
              <>
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                AI Assist
              </>
            </Button>
            <Tabs className="2xl:hidden" value={view} onValueChange={(v) => setView(v as "edit" | "preview")}>
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === "edit" ? (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <SortableItem key={block.id} block={block}>
                      {block.type === "markdown" && (
                        <div className="relative mt-2">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setBlocks((s) => s.filter((item) => item.id !== block.id))}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="h-6 w-6 p-0 border-yellow-500/30 hover:animate-pulse" onClick={() => generateMarkdownBlock(block)}>
                              <SparklesIcon className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </div>
                          <Textarea
                            className="mb-2"
                            value={block.content}
                            onChange={(e) => setBlocks((s) => s.map((item) => (item.id === block.id ? { ...item, content: e.target.value } : item)))}
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
                            <ImageUpload
                              onUpload={(file) => {
                                handleImageUpload(file, block.id)
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveBlockId(block.id)
                                setDiffDialogOpen(true)
                              }}
                            >
                              <FileDiff className="h-4 w-4 mr-1" />
                              Add Code
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBlocks((current) => {
                                  const index = current.findIndex((s) => s.id === block.id)
                                  const newBlocks = [...current]
                                  newBlocks.splice(index + 1, 0, {
                                    id: crypto.randomUUID(),
                                    type: "markdown",
                                    content: "",
                                    role: "implementation",
                                  })
                                  return newBlocks
                                })
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              New Block
                            </Button>
                          </div>
                        </div>
                      )}
                      {block.type === "diff" && block.file && (
                        <div className="relative">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setBlocks((s) => s.filter((item) => item.id !== block.id))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <CommitDiff files={[block.file]} defaultRenderDiff={false} theme={theme} />
                        </div>
                      )}
                      {block.type === "code" && block.file && (
                        <div className="relative">
                          <div className="flex flex-col gap-2 absolute -right-8 px-1">
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setBlocks((s) => s.filter((item) => item.id !== block.id))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-mono text-sm bg-muted rounded-lg">
                            <div className={cn("flex justify-between items-center text-xs text-muted-foreground px-4", block.isCollapsed ? "py-1" : "py-2")}>
                              <span>{block.file.filename}</span>
                              <Button variant="ghost" size="sm" onClick={() => setBlocks((s) => s.map((item) => (item.id === block.id ? { ...item, isCollapsed: !item.isCollapsed } : item)))}>
                                {block.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </Button>
                            </div>
                            {!block.isCollapsed && (
                              <div className="p-4 pt-0">
                                <Textarea
                                  value={block.file.newValue}
                                  onChange={(e) => setBlocks((s) => s.map((item) => (item.id === block.id ? { ...item, file: { ...item.file!, newValue: e.target.value } } : item)))}
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
                            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => setBlocks((s) => s.filter((item) => item.id !== block.id))}>
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
                              <button
                                className="text-xs pl-4"
                                onClick={() => {
                                  setActiveBlockId(block.id)
                                  setLinkSelectorOpen(true)
                                }}
                              >
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
        onClose={() => {
          setDiffDialogOpen(false)
          setActiveBlockId(undefined)
        }}
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
          setDiffDialogOpen(false)
          setActiveBlockId(undefined)
        }}
      />

      <CommitLinkSelector
        open={linkSelectorOpen}
        onClose={() => {
          setLinkSelectorOpen(false)
          setActiveBlockId(undefined)
        }}
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
        }}
      />

      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={setBlueskyDialogOpen} title={title} blocks={blocks} projectFullName={fullName} />
    </SessionProvider>
  )
}
