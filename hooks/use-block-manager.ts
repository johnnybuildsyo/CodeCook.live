import { useState } from "react"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Block } from "@/lib/types/session"
import { DEFAULT_SESSION_BLOCKS } from "@/components/sessions/editor/utils"
import { getStreamingText } from "@/app/api/ai/util"
import { generateBlockPrompt } from "@/lib/ai/sessions/prompts"

interface UseBlockManagerProps {
  initialBlocks?: Block[]
  title: string
  codeChanges: string
}

interface UseBlockManagerResult {
  blocks: Block[]
  handleDragEnd: (event: DragEndEvent) => void
  generateMarkdownBlock: (block: Block) => Promise<void>
  addNewBlock: (afterId: string) => void
  removeBlock: (blockId: string) => void
  updateBlockContent: (blockId: string, content: string) => void
  updateBlockCollapsed: (blockId: string, isCollapsed: boolean) => void
  updateBlockFile: (blockId: string, newValue: string) => void
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
}

export function useBlockManager({ initialBlocks, title, codeChanges }: UseBlockManagerProps): UseBlockManagerResult {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks || DEFAULT_SESSION_BLOCKS)

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

  const generateMarkdownBlock = async (block: Block) => {
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

  const addNewBlock = (afterId: string) => {
    setBlocks((current) => {
      const index = current.findIndex((s) => s.id === afterId)
      const newBlocks = [...current]
      newBlocks.splice(index + 1, 0, {
        id: crypto.randomUUID(),
        type: "markdown",
        content: "",
        role: "implementation",
      })
      return newBlocks
    })
  }

  const removeBlock = (blockId: string) => {
    setBlocks((s) => s.filter((item) => item.id !== blockId))
  }

  const updateBlockContent = (blockId: string, content: string) => {
    setBlocks((s) => s.map((item) => (item.id === blockId ? { ...item, content } : item)))
  }

  const updateBlockCollapsed = (blockId: string, isCollapsed: boolean) => {
    setBlocks((s) => s.map((item) => (item.id === blockId ? { ...item, isCollapsed } : item)))
  }

  const updateBlockFile = (blockId: string, newValue: string) => {
    setBlocks((s) =>
      s.map((item) =>
        item.id === blockId && item.type === "code" ? { ...item, file: { ...item.file!, newValue } } : item
      )
    )
  }

  return {
    blocks,
    handleDragEnd,
    generateMarkdownBlock,
    addNewBlock,
    removeBlock,
    updateBlockContent,
    updateBlockCollapsed,
    updateBlockFile,
    setBlocks
  }
} 