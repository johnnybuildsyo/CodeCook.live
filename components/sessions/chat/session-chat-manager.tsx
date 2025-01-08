import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MessageCircle } from "lucide-react"
import { ChatWindow } from "./chat-window"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SessionChatManagerProps {
  sessionId: string
  initialChatEnabled: boolean
}

export function SessionChatManager({ sessionId, initialChatEnabled }: SessionChatManagerProps) {
  const [isChatEnabled, setIsChatEnabled] = useState(initialChatEnabled)

  const handleToggleChat = async () => {
    const supabase = createClient()
    const newChatEnabled = !isChatEnabled
    console.log("Toggling chat:", { newChatEnabled })

    const { error } = await supabase.from("sessions").update({ chat_enabled: newChatEnabled }).eq("id", sessionId)

    if (error) {
      console.error("Failed to toggle chat:", error)
      toast.error("Failed to toggle chat")
      return
    }

    setIsChatEnabled(newChatEnabled)
    if (!newChatEnabled) {
      toast.success("Chat disabled")
    }
  }

  // Sync chat state with database
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Session update:", payload)
          setIsChatEnabled(payload.new.chat_enabled)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return (
    <>
      <div className="flex items-center gap-2 ml-2">
        <Switch checked={isChatEnabled} onCheckedChange={handleToggleChat} className="data-[state=checked]:bg-green-500" />
        <Label className="text-sm flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          Chat
        </Label>
      </div>

      {isChatEnabled && (
        <ChatWindow
          key="chat-window"
          sessionId={sessionId}
          onClose={() => {
            console.log("Chat window close triggered")
            setIsChatEnabled(false)
            handleToggleChat()
          }}
        />
      )}
    </>
  )
}
