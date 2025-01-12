import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link, Check } from "lucide-react"
import { copyToClipboardWithFeedback } from "@/lib/utils/markdown"

interface CopyLinkProps {
  url: string
}

export function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}${url}`
    await copyToClipboardWithFeedback(fullUrl, setCopied)
  }

  return (
    <Button variant="outline2" onClick={handleCopy} size="sm">
      {copied ? <Check className="h-3 w-3" /> : <Link className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  )
}
