import { useState } from "react"

interface UseDialogManagerResult {
  activeBlockId: string | undefined
  diffDialogOpen: boolean
  linkSelectorOpen: boolean
  blueskyDialogOpen: boolean
  openDiffDialog: (blockId: string) => void
  closeDiffDialog: () => void
  openLinkSelector: (blockId: string) => void
  closeLinkSelector: () => void
  openBlueskyDialog: () => void
  closeBlueskyDialog: () => void
}

export function useDialogManager(): UseDialogManagerResult {
  const [activeBlockId, setActiveBlockId] = useState<string>()
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)
  const [linkSelectorOpen, setLinkSelectorOpen] = useState(false)
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false)

  const openDiffDialog = (blockId: string) => {
    setActiveBlockId(blockId)
    setDiffDialogOpen(true)
  }

  const closeDiffDialog = () => {
    setDiffDialogOpen(false)
    setActiveBlockId(undefined)
  }

  const openLinkSelector = (blockId: string) => {
    setActiveBlockId(blockId)
    setLinkSelectorOpen(true)
  }

  const closeLinkSelector = () => {
    setLinkSelectorOpen(false)
    setActiveBlockId(undefined)
  }

  const openBlueskyDialog = () => {
    setBlueskyDialogOpen(true)
  }

  const closeBlueskyDialog = () => {
    setBlueskyDialogOpen(false)
  }

  return {
    activeBlockId,
    diffDialogOpen,
    linkSelectorOpen,
    blueskyDialogOpen,
    openDiffDialog,
    closeDiffDialog,
    openLinkSelector,
    closeLinkSelector,
    openBlueskyDialog,
    closeBlueskyDialog
  }
} 