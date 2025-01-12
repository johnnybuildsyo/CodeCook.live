import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyToClipboardWithFeedback } from "@/lib/utils/markdown"

interface CopyLinkProps {
  url: string
  variant?: "outline" | "outline2"
  className?: string
}

export function CopyLink({ url, variant = "outline", className }: CopyLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}${url}`
    await copyToClipboardWithFeedback(fullUrl, setCopied)
  }

  return (
    <Button onClick={handleCopy} variant={variant} size="sm" className={cn("gap-2", className)}>
      {copied ? <Check className="h-3 w-3" /> : <Link className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  )
}
