"use client"
import { useRef, useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { ChatMessage } from "@/lib/types/chat"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { fetchChatMessages } from "@/lib/actions/chat"
import { Button } from "@/components/ui/button"
import { GuestChatForm } from "./guest-chat-form"

interface BaseChatProps {
  sessionId: string
  isReadOnly?: boolean
  currentUser?: { id: string } | null
  onSendMessage?: (content: string) => Promise<void>
  isEnabled: boolean
}

export function BaseChat({ sessionId, isReadOnly = false, currentUser, onSendMessage, isEnabled }: BaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestChatFormOpen, setIsGuestChatFormOpen] = useState(false)
  const [guestName, setGuestName] = useState<string | null>(null)

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

  const handleJoinAsGuest = (name: string) => {
    setGuestName(name)
    setIsGuestChatFormOpen(false)
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
          {isReadOnly && (
            <Badge variant="outline" className="text-xs">
              Read Only
            </Badge>
          )}
          {guestName && (
            <Badge variant="outline" className="text-xs">
              Guest: {guestName}
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
            {showMessages && messages.map((message) => <MessageItem key={message.id} message={message} isCurrentUser={currentUser?.id === message.user_id} />)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {!isReadOnly && onSendMessage ? (
        <div className="relative">
          {!isEnabled && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-sm text-muted-foreground">Chat is currently disabled</span>
            </div>
          )}
          <MessageInput onSend={onSendMessage} disabled={!currentUser || !isEnabled || !showMessages} />
        </div>
      ) : (
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
      )}
    </div>
  )
}
