import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateSessionMarkdown } from "@/lib/utils/markdown"
import { Block } from "@/lib/types/session"

interface CopyMarkdownProps {
  title: string
  blocks: Block[]
  sessionUrl: string
  disabled?: boolean
}

export function CopyMarkdown({ title, blocks, sessionUrl, disabled }: CopyMarkdownProps) {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      const markdownContent = generateSessionMarkdown(title, blocks, sessionUrl)
      await navigator.clipboard.writeText(markdownContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy content:", err)
    }
  }

  return (
    <Button size="sm" disabled={disabled} className={cn("border bg-blue-500 hover:bg-blue-500/90 text-white hover:text-white", disabled && "opacity-50 cursor-not-allowed")} onClick={copyToClipboard}>
      {isCopied ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4 mr-2" />}
      {isCopied ? "Copied!" : "Copy Markdown"}
    </Button>
  )
}
