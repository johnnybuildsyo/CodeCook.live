"use client"

import { useState, useEffect } from "react"
import { BaseChat } from "./base-chat"
import { getAuthUser } from "@/lib/actions/auth"
import { sendChatMessage } from "@/lib/actions/chat"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react"

interface ChatDrawerProps {
  sessionId: string
  isReadOnly?: boolean
}

export function ChatDrawer({ sessionId, isReadOnly = false }: ChatDrawerProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      const { user, profile } = await getAuthUser()
      if (user && profile) {
        setCurrentUser({ id: profile.id })
      }
    }

    initUser()
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!currentUser) return
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

        <div className={cn("fixed top-20 right-0  h-[calc(100vh-80px)] w-80 transition-all duration-300 ease-in-out", isOpen ? "translate-x-0" : "translate-x-80")}>
          <BaseChat sessionId={sessionId} isReadOnly={isReadOnly} currentUser={currentUser} onSendMessage={!isReadOnly ? handleSendMessage : undefined} />
        </div>
      </div>
    </>
  )
}
