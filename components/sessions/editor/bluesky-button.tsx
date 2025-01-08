import { Button } from "@/components/ui/button"
import { BlueskyIcon } from "@/components/icons/bluesky"
import { SquareArrowOutUpRight } from "lucide-react"

interface BlueskyButtonProps {
  postUri?: string | null
  onPublish: () => void
}

export function BlueskyButton({ postUri, onPublish }: BlueskyButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        if (postUri) {
          // Convert AT Protocol URI to Bluesky web URL
          const [, , did, , postId] = postUri.split("/")
          window.open(`https://bsky.app/profile/${did}/post/${postId}`, "_blank")
        } else {
          onPublish()
        }
      }}
    >
      <BlueskyIcon className="h-4 w-4 mr-1 text-blue-500" />
      {postUri ? (
        <span className="flex items-center gap-1">
          <span>View on Bluesky</span>
          <SquareArrowOutUpRight className="h-3 w-3 scale-75 opacity-70" />
        </span>
      ) : (
        "Publish"
      )}
    </Button>
  )
}
