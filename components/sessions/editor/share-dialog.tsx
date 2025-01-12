import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Block } from "@/lib/types/session"
import { generateSessionHTML } from "@/lib/utils/markdown"
import { Twitter } from "lucide-react"
import CopyRichText from "./copy-rich-text"
import { CopyLink } from "./copy-link"
import { BlueskyButton } from "./bluesky-button"
import { BlueskyShareDialog } from "./bluesky-share-dialog"
import { useState } from "react"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  blocks: Block[]
  sessionUrl: string
  postUri?: string
  projectFullName: string
}

export function ShareDialog({ open, onOpenChange, title, blocks, sessionUrl, postUri, projectFullName }: ShareDialogProps) {
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false)
  const fullUrl = `${window.location.origin}${sessionUrl}`

  const handleTweetShare = () => {
    const tweetText = encodeURIComponent(`Check out my CodeCook session: "${title}" ${fullUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Session</DialogTitle>
            <DialogDescription>Share your coding session across different platforms</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <CopyLink url={sessionUrl} className="flex-1" />
              <CopyRichText htmlContent={generateSessionHTML(title, blocks, fullUrl)} disabled={!title.trim()} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleTweetShare}>
                <Twitter className="h-4 w-4 mr-2" />
                Share on Twitter
              </Button>
              <BlueskyButton postUri={postUri} onPublish={() => setBlueskyDialogOpen(true)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={setBlueskyDialogOpen} title={title} blocks={blocks} projectFullName={projectFullName} />
    </>
  )
}
