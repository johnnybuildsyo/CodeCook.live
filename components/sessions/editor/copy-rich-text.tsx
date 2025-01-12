import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CopySlash } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyRichTextProps {
  htmlContent: string // The HTML string to render and copy
  disabled?: boolean
}

const CopyRichText: React.FC<CopyRichTextProps> = ({ htmlContent, disabled }) => {
  const [isCopied, setIsCopied] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async () => {
    if (renderRef.current) {
      try {
        // Create a new ClipboardItem with HTML content
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([renderRef.current.innerHTML], { type: "text/html" }),
          "text/plain": new Blob([renderRef.current.innerText], { type: "text/plain" }),
        })
        await navigator.clipboard.write([clipboardItem])
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy content:", err)
      }
    }
  }

  return (
    <div>
      <Button
        size="sm"
        disabled={disabled}
        className={cn("border bg-blue-500 hover:bg-blue-500/90 text-white hover:text-white", disabled && "opacity-50 cursor-not-allowed")}
        onClick={copyToClipboard}
      >
        <CopySlash className={cn("h-4 w-4", isCopied && "mr-3")} />
        {isCopied ? "Copied Text" : "Copy Rich Text"}
      </Button>
      <div
        ref={renderRef}
        style={{
          position: "absolute",
          left: "-9999px", // Hide the rendered content off-screen
          visibility: "hidden",
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}

export default CopyRichText
