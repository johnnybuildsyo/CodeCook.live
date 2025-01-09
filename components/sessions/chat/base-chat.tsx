"use client"
import { useRef, useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { ChatMessage } from "@/lib/types/chat"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { fetchChatMessages, sendChatMessage, sendGuestChatMessage, createGuestChatUser } from "@/lib/actions/chat"
import { Button } from "@/components/ui/button"
import { GuestChatForm } from "./guest-chat-form"
import { toast } from "sonner"

interface BaseChatProps {
  sessionId: string
  currentUser?: { id: string } | null
  isEnabled: boolean
}

export function BaseChat({ sessionId, currentUser, isEnabled }: BaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestChatFormOpen, setIsGuestChatFormOpen] = useState(false)
  const [guestUser, setGuestUser] = useState<{ id: string; name: string } | null>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessagesFromDB = async () => {
    setIsLoading(true)
    // Always use server action for initial fetch to avoid auth issues
    const { messages: newMessages, error } = await fetchChatMessages(sessionId)
    if (!error && newMessages) {
      setMessages(newMessages)
    }
    setIsLoading(false)
  }

  // Initialize chat and subscriptions
  useEffect(() => {
    setMounted(true)
    fetchMessagesFromDB()

    // Use realtime subscription for all users
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Use server action to fetch the complete message with profile info
          const { messages: newMessages } = await fetchChatMessages(sessionId)
          if (newMessages) {
            const newMessage = newMessages.find((msg) => msg.id === payload.new.id)
            if (newMessage) {
              setMessages((current) => [...current, newMessage])
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  if (!mounted) return null

  const showMessages = !isLoading

  const handleJoinAsGuest = async (name: string, captchaToken: string) => {
    const { error, guestUser: newGuestUser } = await createGuestChatUser(sessionId, name, captchaToken)

    if (error || !newGuestUser) {
      throw new Error(error || "Failed to create guest user")
    }

    setGuestUser({
      id: newGuestUser.id,
      name: newGuestUser.name,
    })
    setIsGuestChatFormOpen(false)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    try {
      let error
      if (currentUser) {
        console.log("Sending message as authenticated user:", { userId: currentUser.id, content })
        const result = await sendChatMessage(sessionId, content)
        error = result.error
      } else if (guestUser) {
        console.log("Sending message as guest:", { guestUserId: guestUser.id, content })
        const result = await sendGuestChatMessage(sessionId, guestUser.id, content)
        error = result.error
      }

      if (error) {
        console.error("Error sending message:", error)
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Unexpected error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  return (
    <div className="border-l flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </h3>
          {!isEnabled && (
            <Badge variant="secondary" className="text-xs">
              Disabled
            </Badge>
          )}
          {guestUser && (
            <Badge variant="outline" className="text-xs">
              Guest: {guestUser.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="grow h-full overflow-y-auto p-4">
        {isGuestChatFormOpen ? (
          <div className="h-full flex items-center justify-center">
            <GuestChatForm onJoinAsGuest={handleJoinAsGuest} onCancel={() => setIsGuestChatFormOpen(false)} />
          </div>
        ) : (
          <>
            {showMessages &&
              messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  previousMessage={index > 0 ? messages[index - 1] : undefined}
                  isCurrentUser={currentUser ? currentUser.id === message.user_id : guestUser ? guestUser.id === message.guest_user_id : false}
                />
              ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {!currentUser && !guestUser ? (
        <div className="border-t p-4 bg-muted/50">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Join the live conversation</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsGuestChatFormOpen(true)}>
                Join as Guest
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {!isEnabled && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-sm text-muted-foreground">Chat is currently disabled</span>
            </div>
          )}
          <MessageInput onSend={handleSendMessage} disabled={!isEnabled || !showMessages} />
        </div>
      )}
    </div>
  )
}
