"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { ChatMessage } from "@/lib/types/chat"
import { createClient } from "@/lib/supabase/client"
import { getAuthUser } from "@/lib/actions/auth"
import { sendChatMessage } from "@/lib/actions/chat"

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
    const initializeChat = async () => {
      console.log("ChatWindow mount effect")
      setMounted(true)

      // Delay position setting to ensure window dimensions are available
      requestAnimationFrame(() => {
        const x = Math.max(window.innerWidth - 400, 20)
        const y = Math.max(window.innerHeight - 640, 20)
        console.log("Setting initial position:", { x, y })
        setPosition({ x, y })
      })

      // Get current user using server action
      console.log("[Admin] Getting authenticated user...")
      const { user, profile } = await getAuthUser()
      if (user && profile) {
        console.log("[Admin] Authenticated user found:", { userId: user.id, profileId: profile.id })
        setCurrentUser({ id: profile.id })
      } else {
        console.log("[Admin] No authenticated user or profile found")
        setCurrentUser(null)
      }

      const supabase = createClient()

      // Subscribe to auth state changes
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event) => {
        console.log("[Admin] Auth state changed:", event)
        // Re-fetch user using server action on auth changes
        const { user, profile } = await getAuthUser()
        if (user && profile) {
          console.log("[Admin] Authenticated user found after state change:", { userId: user.id, profileId: profile.id })
          setCurrentUser({ id: profile.id })
        } else {
          console.log("[Admin] No authenticated user or profile found after state change")
          setCurrentUser(null)
        }
      })

      // Fetch initial messages
      fetchMessages()

      // Subscribe to new messages
      console.log("[Admin] Setting up subscription for session:", sessionId)
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
            console.log("[Admin] Realtime event received:", payload)
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
                if (error) {
                  console.error("[Admin] Error fetching profile data:", error)
                  return
                }
                if (data) {
                  setMessages((current) => current.map((msg) => (msg.id === data.id ? (data as ChatMessage) : msg)))
                }
              })
          }
        )
        .subscribe()

      return () => {
        console.log("[Admin] Cleaning up subscriptions")
        supabase.removeChannel(channel)
        authSubscription?.unsubscribe()
      }
    }

    initializeChat()
  }, [sessionId])

  const fetchMessages = async () => {
    const supabase = createClient()
    console.log("[Admin] Fetching messages for session:", sessionId)

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
      console.error("[Admin] Error fetching messages:", error)
      return
    }

    console.log("[Admin] Fetched messages:", data)
    if (data) {
      setMessages(data as ChatMessage[])
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentUser) {
      console.error("[Admin] Cannot send message: No current user")
      return
    }

    console.log("[Admin] Sending message:", { content, sessionId })
    const { message, error } = await sendChatMessage(sessionId, content)

    if (error) {
      console.error("[Admin] Failed to send message:", error)
    } else {
      console.log("[Admin] Message sent successfully:", message)
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
