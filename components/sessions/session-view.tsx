"use client"

import type { Session } from "@/lib/types/session"
import { useTheme } from "next-themes"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { SessionContent } from "./session-content"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "../ui/badge"
import { Circle } from "lucide-react"

interface SessionViewProps {
  session: Session
  fullName: string
  username: string
  projectId: string
}

export function SessionView({ session: initialSession, fullName, username, projectId }: SessionViewProps) {
  const { theme } = useTheme()
  const [isLive, setIsLive] = useState(initialSession.is_live)
  const [session, setSession] = useState(initialSession)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to session updates
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(payload.new as Session)
          setIsLive(payload.new.is_live)
        }
      )
      .subscribe()

    // Check for stale session every minute
    const checkStale = setInterval(async () => {
      const { data } = await supabase.from("sessions").select("updated_at, is_live").eq("id", session.id).single()

      if (data?.is_live) {
        const lastUpdate = new Date(data.updated_at).getTime()
        const now = new Date().getTime()
        const STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

        if (now - lastUpdate > STALE_THRESHOLD) {
          setIsLive(false)
        }
      }
    }, 60000)

    return () => {
      clearInterval(checkStale)
      supabase.removeChannel(channel)
    }
  }, [session.id])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Link href={`/${username}/${projectId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to project
        </Link>
        {isLive && (
          <Badge variant="secondary" className="bg-background ring-1 ring-green-500/50 py-2">
            <Circle className="h-4 w-4 rounded-full scale-75 text-green-500/50 ring-4 ring-green-500/30 mr-2 fill-green-500/90" />
            <span className="text-green-500">Live Session in Progress</span>
          </Badge>
        )}
      </div>
      <SessionContent title={session.title} blocks={session.blocks} theme={theme} fullName={fullName} showDate={true} created_at={session.created_at} commit_shas={session.commit_shas} />
    </div>
  )
}
