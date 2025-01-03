import { Button } from "@/components/ui/button"
import { ChevronsLeft } from "lucide-react"
import { PauseCircleIcon } from "@heroicons/react/24/solid"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface EndSessionButtonProps {
  username: string
  projectSlug: string
  sessionId: string
}

export function EndSessionButton({ username, projectSlug, sessionId }: EndSessionButtonProps) {
  const router = useRouter()
  const [isEnding, setIsEnding] = useState(false)

  const handleEndSession = async () => {
    setIsEnding(true)
    const supabase = createClient()
    await supabase.from("sessions").update({ is_live: false }).eq("id", sessionId)
    router.push(`/${username}/${projectSlug}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="flex flex-col items-center h-auto gap-0.5" onClick={handleEndSession} disabled={isEnding}>
        <span className="flex items-center gap-1">
          <PauseCircleIcon className={`h-3 w-3 ${isEnding ? "animate-pulse text-muted-foreground" : ""}`} />
          {isEnding ? "Ending Session..." : "End Session"}
        </span>
        <span className="text-[10px] font-mono font-light flex items-center gap-0.5">
          <ChevronsLeft className="h-3 w-3 opacity-50" /> back to project
        </span>
      </Button>
    </div>
  )
}
