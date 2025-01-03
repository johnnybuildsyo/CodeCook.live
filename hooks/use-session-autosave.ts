import { useState, useEffect, useCallback } from "react"
import { SessionBlock } from "@/lib/types/session"
import { upsertSession } from "@/app/api/sessions/actions"

interface UseSessionAutosaveProps {
  projectId: string
  commitSha: string
  sessionId?: string
  title: string
  blocks: SessionBlock[]
}

interface AutosaveState {
  status: "saved" | "saving" | "error"
  lastSavedAt: Date | null
}

export function useSessionAutosave({ 
  projectId, 
  commitSha, 
  sessionId, 
  title, 
  blocks 
}: UseSessionAutosaveProps): AutosaveState {
  const [saveState, setSaveState] = useState<AutosaveState>({
    status: "saved",
    lastSavedAt: null
  })

  const debouncedSave = useCallback(
    async (title: string, blocks: SessionBlock[]) => {
      setSaveState(prev => ({ ...prev, status: "saving" }))
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
          commit_shas: [commitSha],
        }

        const { success } = await upsertSession(projectId, sessionData, sessionId)
        if (success) {
          setSaveState({ status: "saved", lastSavedAt: new Date() })
        } else {
          setSaveState(prev => ({ ...prev, status: "error" }))
        }
      } catch (error) {
        console.error("Auto-save failed:", error)
        setSaveState(prev => ({ ...prev, status: "error" }))
      }
    },
    [projectId, commitSha, sessionId]
  )

  useEffect(() => {
    if (!title) return // Don't auto-save if there's no title

    const timeoutId = setTimeout(() => {
      debouncedSave(title, blocks)
    }, 2000) // Wait 2 seconds after last change

    return () => clearTimeout(timeoutId)
  }, [title, blocks, debouncedSave])

  return saveState
} 