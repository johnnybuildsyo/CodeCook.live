import { useRef, useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { ChatMessage } from "@/lib/types/chat"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface BaseChatProps {
  sessionId: string
  isReadOnly?: boolean
  currentUser?: { id: string } | null
  onSendMessage?: (content: string) => Promise<void>
}

export function BaseChat({ sessionId, isReadOnly = false, currentUser, onSendMessage }: BaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)

  // Add subscription to chat_enabled status
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`session-${sessionId}-chat-status`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setIsEnabled(payload.new.chat_enabled)
        }
      )
      .subscribe()

    // Get initial status
    supabase
      .from("sessions")
      .select("chat_enabled")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setIsEnabled(data.chat_enabled)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize chat and subscriptions
  useEffect(() => {
    setMounted(true)
    fetchMessages()

    // Subscribe to new messages if not read-only
    if (!isReadOnly) {
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
          (payload) => {
            setMessages((current) => [...current, payload.new as ChatMessage])
            supabase
              .from("chat_messages")
              .select(
                `
                *,
                profile:profiles!chat_messages_user_id_fkey (
                  avatar_url
                )
              `
              )
              .eq("id", payload.new.id)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  setMessages((current) => current.map((msg) => (msg.id === data.id ? (data as ChatMessage) : msg)))
                }
              })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      // Set up polling for read-only mode
      const pollInterval = setInterval(fetchMessages, 2000)
      return () => clearInterval(pollInterval)
    }
  }, [sessionId, isReadOnly])

  const fetchMessages = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        `
        *,
        profile:profiles!chat_messages_user_id_fkey (
          avatar_url
        )
      `
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMessages(data as ChatMessage[])
    }
  }

  if (!mounted) return null

  console.log("messages", messages)

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
        </div>
      </div>

      <div className="grow h-full overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} isCurrentUser={currentUser?.id === message.user_id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isReadOnly && onSendMessage && (
        <div className="relative">
          {!isEnabled && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-sm text-muted-foreground">Chat is currently disabled</span>
            </div>
          )}
          <MessageInput onSend={onSendMessage} disabled={!currentUser || !isEnabled} />
        </div>
      )}
    </div>
  )
}
