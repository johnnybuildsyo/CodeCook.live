import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Block } from "@/lib/types/session"
import { generateSessionHTML } from "@/lib/utils/markdown"
import { Twitter, Copy } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import CopyRichText from "./copy-rich-text"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  blocks: Block[]
  sessionUrl: string
}

export function ShareDialog({ open, onOpenChange, title, blocks, sessionUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${window.location.origin}${sessionUrl}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTweetShare = () => {
    const tweetText = encodeURIComponent(`Check out my CodeCook session: "${title}" ${fullUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
          <DialogDescription>Share your coding session across different platforms</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className={cn("h-4 w-4 mr-2", copied && "text-green-500")} />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <CopyRichText htmlContent={generateSessionHTML(title, blocks, fullUrl)} disabled={!title.trim()} />
          </div>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleTweetShare}>
            <Twitter className="h-4 w-4 mr-2" />
            Share on Twitter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
