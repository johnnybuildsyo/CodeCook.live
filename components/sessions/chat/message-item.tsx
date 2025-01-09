"use client"

import { ChatMessage } from "@/lib/types/chat"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { User } from "lucide-react"

interface MessageItemProps {
  message: ChatMessage
  isCurrentUser: boolean
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  console.log({ message })
  const formattedTime = format(new Date(message.created_at), "h:mm a")
  const avatarUrl = message.profile?.avatar_url

  console.log("MessageItem", { message, isCurrentUser })

  return (
    <div className={cn("flex gap-2 mb-4", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} />
        ) : (
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={cn("flex flex-col max-w-[80%] pb-2", isCurrentUser ? "items-end" : "items-start")}>
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5 -mt-3">{formattedTime}</div>
        <div className={cn("rounded text-sm px-2 py-1", isCurrentUser ? "bg-foreground text-background" : "bg-muted")}>{message.content}</div>
      </div>
    </div>
  )
}
