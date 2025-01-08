"use client"

import { useState, useEffect } from "react"
import { BaseChat } from "./base-chat"
import { getAuthUser } from "@/lib/actions/auth"
import { sendChatMessage } from "@/lib/actions/chat"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LoadingAnimation } from "@/components/ui/loading-animation"

interface ChatDrawerProps {
  sessionId: string
  isReadOnly?: boolean
}

export function ChatDrawer({ sessionId, isReadOnly = false }: ChatDrawerProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [isUserReady, setIsUserReady] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      const { user, profile } = await getAuthUser()
      if (user && profile) {
        setCurrentUser({ id: profile.id })
      }
      setIsUserReady(true)
    }

    initUser()

    // Get initial chat enabled status and subscribe to changes
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

  const handleSendMessage = async (content: string) => {
    if (!currentUser || !isEnabled) return
    await sendChatMessage(sessionId, content)
  }

  return (
    <>
      <div className={cn("flex-shrink-0 relative transition-all duration-300 ease-in-out", isOpen ? "w-80 border-l" : "w-0")}>
        <Button
          aria-label={isOpen ? "Hide chat" : "Show chat"}
          variant="ghost"
          className={cn("fixed top-[88px] transition-all duration-300 ease-in-out px-2", isOpen ? "right-[328px]" : "right-2")}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ArrowRightFromLine className="h-4 w-4" /> : <ArrowLeftFromLine className="h-4 w-4" />}
        </Button>

        <div className={cn("fixed top-20 right-0 h-[calc(100vh-80px)] w-80 transition-all duration-300 ease-in-out", isOpen ? "translate-x-0" : "translate-x-80")}>
          {isUserReady ? (
            <BaseChat sessionId={sessionId} isReadOnly={isReadOnly} currentUser={currentUser} onSendMessage={!isReadOnly ? handleSendMessage : undefined} isEnabled={isEnabled} />
          ) : (
            <div className="p-8">
              <LoadingAnimation />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
