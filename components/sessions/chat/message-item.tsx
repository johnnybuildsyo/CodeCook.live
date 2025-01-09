"use client"

import { ChatMessage } from "@/lib/types/chat"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, differenceInMinutes } from "date-fns"
import { User } from "lucide-react"

interface MessageItemProps {
  message: ChatMessage
  isCurrentUser: boolean
  previousMessage?: ChatMessage
}

export function MessageItem({ message, isCurrentUser, previousMessage }: MessageItemProps) {
  const formattedTime = format(new Date(message.created_at), "h:mm a")
  const avatarUrl = message.profile?.avatar_url
  const name = message.guest_chat_users?.name || message.profile?.name || message.profile?.username || "Unknown User"

  // Check if this message is part of a sequence from the same user within 10 minutes
  const isSameUser = previousMessage && ((message.user_id && message.user_id === previousMessage.user_id) || (message.guest_user_id && message.guest_user_id === previousMessage.guest_user_id))
  const isWithin10Minutes = previousMessage && Math.abs(differenceInMinutes(new Date(message.created_at), new Date(previousMessage.created_at))) < 10

  const showNameAndAvatar = !isSameUser || !isWithin10Minutes

  return (
    <div className={cn("flex gap-2 mb-4", isCurrentUser ? "flex-row-reverse" : "flex-row", !showNameAndAvatar && "-mt-4 mb-1")}>
      {showNameAndAvatar ? (
        <Avatar className="h-8 w-8">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} />
          ) : (
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      ) : (
        <div className="w-8" /> // Spacer to maintain alignment
      )}
      <div className={cn("flex flex-col max-w-[80%] pb-2", isCurrentUser ? "items-end" : "items-start")}>
        {showNameAndAvatar && (
          <div className="text-[10px] font-mono text-muted-foreground mb-0.5 -mt-3">
            <span className="font-medium text-foreground">{name}</span> • {formattedTime}
          </div>
        )}
        <div className={cn("rounded text-sm px-2 py-1", isCurrentUser ? "bg-foreground text-background" : "bg-muted")}>{message.content}</div>
      </div>
    </div>
  )
}
