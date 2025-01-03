import { useMemo } from "react"
import { Block, FileChange } from "@/lib/types/session"
import { shouldExcludeFile } from "@/lib/utils"

interface UseFileReferencesResult {
  referencedFiles: Set<string>
  codeChanges: string
}

export function useFileReferences(blocks: Block[], files: FileChange[]): UseFileReferencesResult {
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
  const codeChanges = useMemo(() => {
    const fileArray = Array.isArray(files) ? files : []
    const relevantFiles = referencedFiles.size > 0 
      ? fileArray.filter((f) => referencedFiles.has(f.filename)) 
      : fileArray.filter((f) => !shouldExcludeFile(f.filename))
    
    const changes = relevantFiles
      .map((f) => `File: ${f.filename}\n\nChanges:\n${f.newValue}`)
      .join("\n\n---\n\n")

    // Truncate if too long
    return changes.length > 20000 ? changes.slice(0, 20000) + "...(truncated)" : changes
  }, [files, referencedFiles])

  return { referencedFiles, codeChanges }
} 