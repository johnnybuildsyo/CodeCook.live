import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Block } from "@/lib/types/session"
import { BlueskyIcon } from "@/components/icons/bluesky"
import { useEffect, useState } from "react"
import { connectBlueskyAccount, disconnectBlueskyAccount, getBlueskyConnection } from "@/app/api/bluesky/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ThreadPreview } from "./thread-preview"
import { MAX_POST_LENGTH, type ThreadPost, extractHandleFromUrl, formatBlueskyThread } from "@/lib/bluesky/format"
import { useParams } from "next/navigation"

interface BlueskyShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  blocks: Block[]
  projectFullName?: string
}

export function BlueskyShareDialog({ open, onOpenChange, title, blocks, projectFullName }: BlueskyShareDialogProps) {
  const params = useParams()
  const username = params.username as string
  const projectId = params.projectId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedHandle, setConnectedHandle] = useState<string | null>(null)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [editedPosts, setEditedPosts] = useState<ThreadPost[]>([])
  const [isPosting, setIsPosting] = useState(false)

  const commonHashtags = ["buildinpublic", "codethread", "indiehacker", "webdev", "gamedev", "codecooking"]

  useEffect(() => {
    if (open) {
      checkConnection()
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

  async function checkConnection() {
    setIsCheckingConnection(true)
    const connection = await getBlueskyConnection()
    if (connection) {
      setIsConnected(true)
      setConnectedHandle(connection.handle)
    } else {
      setIsConnected(false)
      setConnectedHandle(null)
    }
    setIsCheckingConnection(false)
  }

  function handleIdentifierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setIdentifier(extractHandleFromUrl(value))
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await connectBlueskyAccount(identifier, password)
      if (!result.success) {
        throw new Error(result.error)
      }
      await checkConnection()
      toast.success("Successfully connected to Bluesky!")
      setIdentifier("")
      setPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect to Bluesky")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDisconnect() {
    setIsLoading(true)
    try {
      const result = await disconnectBlueskyAccount()
      if (!result.success) {
        throw new Error(result.error)
      }
      setIsConnected(false)
      setConnectedHandle(null)
      toast.success("Successfully disconnected from Bluesky")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect from Bluesky")
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePost() {
    setIsPosting(true)
    try {
      const response = await fetch("/api/bluesky/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: editedPosts }),
      })

      const data = await response.json()
      if (!response.ok) {
        console.log({ posts: editedPosts, data })
        throw new Error(data.error || "Failed to post to Bluesky")
      }

      toast.success("Successfully posted to Bluesky!")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post to Bluesky")
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("transition-all duration-300 ease-in-out", isConnected ? "max-w-3xl" : "max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <BlueskyIcon className="h-5 w-5 text-blue-500" />
              Share to Bluesky
            </div>
            {isConnected && (
              <div className="flex items-center justify-between gap-4 pr-8 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">Connected as {connectedHandle}</span>
                </div>
                <button className="text-xs sm:text-sm text-red-500/70 py-1 h-auto" onClick={handleDisconnect} disabled={isLoading}>
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="space-y-4">
            {isCheckingConnection ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className="text-sm text-muted-foreground">Checking connection...</span>
                </div>
              </div>
            ) : isConnected ? (
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
                    <Button type="button" onClick={handlePost} disabled={isPosting || editedPosts.some((post) => post.text.length > MAX_POST_LENGTH)}>
                      {isPosting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Posting...</span>
                        </div>
                      ) : (
                        `Post Thread (${editedPosts.length} ${editedPosts.length === 1 ? "post" : "posts"})`
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Handle</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    placeholder="you@example.com or you.bsky.social"
                    required
                    autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">App Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your Bluesky app password"
                    required
                    autoComplete="new-password"
                    data-form-type="other"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create an app password at{" "}
                    <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener noreferrer" className="underline">
                      bsky.app/settings/app-passwords
                    </a>
                  </p>
                </div>
                <DialogFooter>
                  <div className="flex justify-end gap-4 w-full">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Connecting..." : "Connect Bluesky Account"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
