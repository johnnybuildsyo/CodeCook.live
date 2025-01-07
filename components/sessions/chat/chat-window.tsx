"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { ChatMessage } from "@/lib/types/chat"
import { createClient } from "@/lib/supabase/client"

interface ChatWindowProps {
  sessionId: string
  onClose: () => void
}

export function ChatWindow({ sessionId, onClose }: ChatWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Set initial position after mount
  useEffect(() => {
    console.log("ChatWindow mount effect")
    setMounted(true)

    // Delay position setting to ensure window dimensions are available
    requestAnimationFrame(() => {
      const x = Math.max(window.innerWidth - 400, 20)
      const y = Math.max(window.innerHeight - 640, 20)
      console.log("Setting initial position:", { x, y })
      setPosition({ x, y })
    })

    // Get current user
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log("Current user:", user)
        setCurrentUser({ id: user.id })
      }
    })

    // Fetch initial messages
    fetchMessages()

    // Subscribe to new messages
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
          console.log("New message received:", payload)
          // Fetch the complete message with profile data
          const { data } = await supabase
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

          if (data) {
            setMessages((current) => [...current, data as ChatMessage])
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const fetchMessages = async () => {
    const supabase = createClient()
    console.log("Fetching messages for session:", sessionId)

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

    if (error) {
      console.error("Error fetching messages:", error)
      return
    }

    console.log("Fetched messages:", data)
    if (data) {
      setMessages(data as ChatMessage[])
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentUser) return

    const supabase = createClient()
    console.log("Sending message:", { content, sessionId, userId: currentUser.id })

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: currentUser.id,
      content,
    })

    if (error) {
      console.error("Failed to send message:", error)
    }
  }

  useEffect(() => {
    // Keep window within viewport bounds
    const updatePosition = () => {
      if (windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect()
        const newX = Math.min(Math.max(0, position.x), window.innerWidth - rect.width)
        const newY = Math.min(Math.max(0, position.y), window.innerHeight - (isCollapsed ? 40 : rect.height))
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY })
        }
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [position, isCollapsed])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest("button")) return
    setIsDragging(true)
    const rect = windowRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  // Don't render until mounted
  if (!mounted) {
    console.log("ChatWindow not mounted yet")
    return null
  }

  console.log("ChatWindow rendering with position:", position)

  return (
    <div
      ref={windowRef}
      className={cn("fixed bg-background border-2 border-primary rounded-lg shadow-lg overflow-hidden", "transition-all duration-200 ease-in-out z-[100]", isDragging && "opacity-90")}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: 380,
        height: isCollapsed ? "auto" : 480,
      }}
    >
      <div className="flex items-center justify-between p-3 border-b bg-primary/10 cursor-move select-none" onMouseDown={handleMouseDown}>
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4" />
          Chat
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/20" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col h-[calc(100%-48px)]">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} isCurrentUser={currentUser?.id === message.user_id} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput onSend={handleSendMessage} disabled={!currentUser} />
        </div>
      )}
    </div>
  )
}
