import { useState } from "react"
import { toast } from "sonner"
import { Block } from "@/lib/types/session"

interface UseImageUploadResult {
  isUploading: boolean
  uploadImage: (file: File, blockId: string) => Promise<void>
}

export function useImageUpload(
  blocks: Block[],
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (file: File, blockId: string) => {
    setIsUploading(true)
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
    } finally {
      setIsUploading(false)
    }
  }

  return { isUploading, uploadImage }
} 