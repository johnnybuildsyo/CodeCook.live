import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ChatToggleProps {
  sessionId: string
  initialEnabled: boolean
}

export function ChatToggle({ sessionId, initialEnabled }: ChatToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)

  const handleToggle = async () => {
    const supabase = createClient()
    const newEnabled = !isEnabled

    const { error } = await supabase.from("sessions").update({ chat_enabled: newEnabled }).eq("id", sessionId)

    if (error) {
      toast.error("Failed to toggle chat")
      return
    }

    setIsEnabled(newEnabled)
    if (!newEnabled) {
      toast.success("Chat disabled")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={isEnabled} onCheckedChange={handleToggle} className="data-[state=checked]:bg-green-500" />
      <Label className="text-sm flex items-center gap-1.5">Chat</Label>
    </div>
  )
}
