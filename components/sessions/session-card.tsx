"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Block, Session } from "@/lib/types/session"
import { BoltIcon } from "@heroicons/react/24/solid"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Archive } from "lucide-react"

interface SessionCardProps {
  session: Session
  username: string
  projectId: string
  featured?: boolean
  currentUser?: {
    id: string
  }
}

export function SessionCard({ session, username, projectId, featured = false, currentUser }: SessionCardProps) {
  const [isArchiving, setIsArchiving] = useState(false)
  const sessionUrl = `/${username}/${projectId}/session/${session.id}`
  const startSessionUrl = `${sessionUrl}/live`
  const introSection = session.blocks.find((section: Block) => section.type === "markdown" && section.role === "intro")
  const introContent = introSection?.content || ""
  const previewContent = introContent.split("\n")[0] || "No preview available"
  const isAuthor = currentUser?.id === session.user_id

  const handleArchive = async () => {
    setIsArchiving(true)
    const supabase = createClient()
    await supabase.from("sessions").update({ is_archived: true }).eq("id", session.id)
    setIsArchiving(false)
  }

  if (session.is_archived === true) {
    return null
  }

  return (
    <div className={cn("border-t py-4 lg:pr-8 grid grid-cols-1 lg:grid-cols-3 gap-4")}>
      <div className="lg:col-span-2">
        <div className={cn("font-medium", featured ? "text-2xl" : "text-lg")}>{session.title}</div>
        <div className="text-xs font-mono flex items-center space-x-2 pb-2">
          <span>{new Date(session.created_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>
            {session.commit_shas.length} commit{session.commit_shas.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground line-clamp-2 mb-4">
          <ReactMarkdown>{previewContent}</ReactMarkdown>
        </div>
      </div>
      <div className="flex justify-end pb-1 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={sessionUrl} className="inline-flex items-center">
            View Session
          </Link>
        </Button>
        {isAuthor && (
          <>
            <Button className="bg-blue-500 text-white hover:bg-blue-600" asChild size="sm">
              <Link href={startSessionUrl}>
                <BoltIcon className="h-3 w-3" />
                Renew Session
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive} disabled={isArchiving}>
              <Archive className="h-3 w-3" />
              {isArchiving ? "Archiving..." : "Archive"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
