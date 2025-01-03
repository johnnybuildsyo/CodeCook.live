"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { SessionBlock, Session } from "@/lib/types/session"
import { BoltIcon } from "@heroicons/react/24/solid"

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
  const sessionUrl = `/${username}/${projectId}/session/${session.id}`
  const startSessionUrl = `${sessionUrl}/live`
  const introSection = session.blocks.find((section: SessionBlock) => section.type === "markdown" && section.role === "intro")
  const introContent = introSection?.content || ""
  const previewContent = introContent.split("\n")[0] || "No preview available"
  const isAuthor = currentUser?.id === session.user_id

  return (
    <div className={cn("border-t py-4 lg:pr-8 grid grid-cols-1 lg:grid-cols-3 gap-4")}>
      <div className="lg:col-span-2">
        <div className={cn("font-medium", featured ? "text-2xl" : "text-lg")}>{session.title}</div>
        <div className="text-xs font-mono flex items-center space-x-2 pb-2">
          <span>{new Date(session.created_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>{session.commit_shas.length} commits</span>
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
          <Button className="bg-blue-500 text-white hover:bg-blue-600" asChild size="sm">
            <Link href={startSessionUrl}>
              <BoltIcon className="h-3 w-3" />
              Renew Session
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
