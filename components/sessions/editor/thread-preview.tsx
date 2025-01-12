import { Textarea } from "@/components/ui/textarea"
import { MAX_POST_LENGTH, type ThreadPost } from "@/lib/bluesky/format"
import Image from "next/image"
import { convertImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, SquareCheck } from "lucide-react"
import { useState } from "react"
import { copyToClipboardWithFeedback } from "@/lib/utils/markdown"
import { toast } from "sonner"

interface ThreadPreviewProps {
  posts: ThreadPost[]
  onPostChange: (index: number, content: string) => void
}

export function ThreadPreview({ posts, onPostChange }: ThreadPreviewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function handleCopyPost(index: number) {
    const post = posts[index]
    const postText = `${post.text}\n${index + 1}/${posts.length}`
    await copyToClipboardWithFeedback(postText, () => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
    toast.success("Post copied to clipboard!")
  }

  return (
    <div className="flex flex-col gap-8 max-h-[500px] overflow-y-auto py-5">
      {posts.map((post, index) => (
        <div key={index} className="py-3 px-px relative">
          <div className="absolute -top-2 right-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleCopyPost(index)} className="h-7 text-xs">
              {copiedIndex === index ? <SquareCheck className="h-3 w-3 mr-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copiedIndex === index ? "Copied!" : "Copy Post"}
            </Button>
            <div className="text-xs font-medium border text-muted-foreground bg-muted px-3 py-1 rounded-sm">
              Post {index + 1} of {posts.length}
            </div>
          </div>
          <Textarea value={post.text} onChange={(e) => onPostChange(index, e.target.value)} className="min-h-[100px] text-sm leading-relaxed" placeholder="Post content..." />
          <div className="grid grid-cols-2 gap-2">
            <div>
              {post.images && post.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.images.map((image, imageIndex) => (
                    <div key={imageIndex} className="relative group">
                      <Image width={64} height={64} src={convertImageUrl(image.url)} alt={image.alt} className="h-16 w-16 object-cover rounded border" />
                      {image.alt && <div className="absolute inset-0 bg-black/75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded overflow-hidden">{image.alt}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-right">
              {post.text.length}/{MAX_POST_LENGTH} characters
              {post.images && ` • ${post.images.length} ${post.images.length === 1 ? "image" : "images"}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
