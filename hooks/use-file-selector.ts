import { FileChange, SessionBlock } from "@/lib/types/session"

interface UseFileSelectorResult {
  handleDiffSelection: (
    selections: { type: "code" | "diff" | "commit-links"; file: FileChange }[],
    activeBlockId: string,
    commitSha: string,
    fullName: string,
    blocks: SessionBlock[]
  ) => SessionBlock[]
  handleLinkSelection: (
    selectedFiles: FileChange[],
    activeBlockId: string,
    commitSha: string,
    fullName: string,
    blocks: SessionBlock[]
  ) => SessionBlock[]
  getExistingDiffFiles: (blocks: SessionBlock[], activeBlockId: string | undefined) => string[]
}

export function useFileSelector(): UseFileSelectorResult {
  const handleDiffSelection = (
    selections: { type: "code" | "diff" | "commit-links"; file: FileChange }[],
    activeBlockId: string,
    commitSha: string,
    fullName: string,
    blocks: SessionBlock[]
  ) => {
    const index = blocks.findIndex((s: SessionBlock) => s.id === activeBlockId)
    const newBlocks = [...blocks]
    const activeBlock = newBlocks[index]

    // Group file-link selections into a single commit-links block
    const fileLinks = selections
      .filter((s) => s.type === "commit-links")
      .map((s) => ({
        sha: commitSha,
        filename: s.file.filename,
      }))

    if (fileLinks.length > 0) {
      if (activeBlock?.type === "commit-links" && activeBlock.commits) {
        // Merge new links with existing ones, avoiding duplicates
        const existingFilenames = new Set(activeBlock.commits.map((c: { filename: string }) => c.filename))
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
  }

  const handleLinkSelection = (
    selectedFiles: FileChange[],
    activeBlockId: string,
    commitSha: string,
    fullName: string,
    blocks: SessionBlock[]
  ) => {
    const index = blocks.findIndex((s: SessionBlock) => s.id === activeBlockId)
    const activeBlock = blocks[index]

    if (activeBlock?.type === "commit-links") {
      const existingCommits = activeBlock.commits || []
      const newLinks = selectedFiles.map((file: FileChange) => ({
        sha: commitSha,
        filename: file.filename,
      }))

      return blocks.map((block: SessionBlock, i: number) =>
        i === index
          ? {
              ...block,
              content: [...existingCommits, ...newLinks].map((link: { sha: string; filename: string }) => `[${link.filename}](https://github.com/${fullName}/blob/${link.sha}/${link.filename})`).join("\n\n"),
              commits: [...existingCommits, ...newLinks],
            }
          : block
      )
    }
    return blocks
  }

  const getExistingDiffFiles = (blocks: SessionBlock[], activeBlockId: string | undefined) => {
    return blocks.find((s) => s.id === activeBlockId)?.type === "diff" 
      ? blocks.filter((s) => s.type === "diff").map((s) => s.file?.filename || "") 
      : []
  }

  return {
    handleDiffSelection,
    handleLinkSelection,
    getExistingDiffFiles
  }
} 