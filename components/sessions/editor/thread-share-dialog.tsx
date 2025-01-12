import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Block } from "@/lib/types/session"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ThreadPreview } from "./thread-preview"
import { MAX_POST_LENGTH, type ThreadPost, formatBlueskyThread } from "@/lib/bluesky/format"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import { copyToClipboardWithFeedback } from "@/lib/utils/markdown"

interface ThreadShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  blocks: Block[]
  projectFullName?: string
}

export function ThreadShareDialog({ open, onOpenChange, title, blocks, projectFullName }: ThreadShareDialogProps) {
  const params = useParams()
  const username = params.username as string
  const projectId = params.projectId as string

  const [editedPosts, setEditedPosts] = useState<ThreadPost[]>([])
  const [isCopied, setIsCopied] = useState(false)

  const commonHashtags = ["buildinpublic", "codethread", "indiehacker", "webdev", "gamedev", "codecooking"]

  useEffect(() => {
    if (open) {
      const { posts } = formatBlueskyThread(title, blocks, projectFullName, username, projectId)
      setEditedPosts(posts)
    }
  }, [open, title, blocks, projectFullName, username, projectId])

  function addHashtag(tag: string) {
    if (editedPosts.length === 0) return

    setEditedPosts((currentPosts) => {
      const newPosts = [...currentPosts]
      const firstPost = newPosts[0]

      // Remove # if it was included
      tag = tag.replace(/^#/, "")

      // Check if hashtag already exists
      const hashtagPattern = new RegExp(`#${tag}\\b`, "i")
      if (hashtagPattern.test(firstPost.text)) return newPosts

      // Add hashtag to the end of the first post
      newPosts[0] = {
        ...firstPost,
        text: firstPost.text.trim() + `\n#${tag}`,
      }
      return newPosts
    })
  }

  function handlePostChange(index: number, content: string) {
    setEditedPosts((currentPosts) => {
      const newPosts = [...currentPosts]
      const currentPost = newPosts[index]

      // If content is empty and there are images
      if (!content.trim() && currentPost.images?.length) {
        // Find target post for images
        const targetIndex = index === 0 ? 1 : index - 1
        if (targetIndex < newPosts.length) {
          // Move images to target post
          newPosts[targetIndex] = {
            ...newPosts[targetIndex],
            images: [...(newPosts[targetIndex].images || []), ...(currentPost.images || [])],
          }
        }
      }

      // If content is empty, remove the post
      if (!content.trim() && (!currentPost.images?.length || index !== 0)) {
        return newPosts.filter((_, i) => i !== index)
      }

      // Otherwise update the post content
      newPosts[index] = { ...currentPost, text: content }
      return newPosts
    })
  }

  async function handleCopyThread() {
    const threadText = editedPosts.map((post, i) => `${post.text}\n${i + 1}/${editedPosts.length}`).join("\n\n---\n\n")
    await copyToClipboardWithFeedback(threadText, setIsCopied)
    toast.success("Thread copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 text-2xl font-bold">Share as Thread</div>
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="space-y-4">
            {editedPosts.length > 0 && (
              <div className="space-y-1">
                <Label className="pl-1">Add Hashtags</Label>
                <div className="flex flex-wrap gap-2">
                  {commonHashtags.map((tag) => (
                    <Button key={tag} type="button" variant="outline" size="sm" onClick={() => addHashtag(tag)} className="text-xs">
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <ThreadPreview posts={editedPosts} onPostChange={handlePostChange} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCopyThread} disabled={editedPosts.some((post) => post.text.length > MAX_POST_LENGTH)} className={cn(isCopied && "bg-green-500")}>
                <Copy className="h-4 w-4 mr-2" />
                {isCopied ? "Copied!" : "Copy Thread"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
