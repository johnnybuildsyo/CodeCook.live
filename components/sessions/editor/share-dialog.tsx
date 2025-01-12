import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Block } from "@/lib/types/session"
import { generateSessionHTML } from "@/lib/utils/markdown"
import CopyRichText from "./copy-rich-text"
import { CopyLink } from "./copy-link"
import { CopyMarkdown } from "./copy-markdown"
import { BlueskyButton } from "./bluesky-button"
import { BlueskyShareDialog } from "./bluesky-share-dialog"
import { useState } from "react"
import { Waypoints } from "lucide-react"

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Share Session</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pb-4">
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">The easiest way to share, copy a link to your session:</p>
              <div className="scale-75">
                <CopyLink url={sessionUrl} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">You can also share your session to other publishing platforms by copying the content in different formats:</p>
              <div className="flex gap-2">
                <CopyRichText htmlContent={generateSessionHTML(title, blocks, fullUrl)} disabled={!title.trim()} />
                <CopyMarkdown title={title} blocks={blocks} sessionUrl={fullUrl} disabled={!title.trim()} />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-sm text-muted-foreground">Or you can share as a post thread:</p>
              <div className="flex gap-4">
                <BlueskyButton postUri={postUri} onPublish={() => setBlueskyDialogOpen(true)} />
                <Button size="sm" variant="outline">
                  <Waypoints className="h-4 w-4" />
                  Share as Post Thread
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={setBlueskyDialogOpen} title={title} blocks={blocks} projectFullName={projectFullName} />
    </>
  )
}
