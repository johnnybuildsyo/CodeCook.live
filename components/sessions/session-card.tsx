"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Block, Session } from "@/lib/types/session"
import { BoltIcon } from "@heroicons/react/24/solid"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { X, Copy, Check, ChevronsRight } from "lucide-react"
import { LoadingAnimation } from "../ui/loading-animation"
import { BlueskyButton } from "./editor/bluesky-button"
import { BlueskyShareDialog } from "./editor/bluesky-share-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [copied, setCopied] = useState(false)
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false)
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

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${sessionUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (session.is_archived === true) {
    return null
  }

  return (
    <>
      <div className={cn("border-t-2 border-dotted pt-6 pb-4 lg:pr-8 grid grid-cols-1 lg:grid-cols-3 gap-4")}>
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
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          {isAuthor && <BlueskyButton postUri={session.bluesky_post_uri} onPublish={() => setBlueskyDialogOpen(true)} />}
          <Button asChild variant="outline" size="sm">
            <Link href={sessionUrl} className="inline-flex items-center">
              <ChevronsRight className="h-3 w-3 opacity-70" />
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
              {isArchiving ? (
                <LoadingAnimation>Archiving</LoadingAnimation>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="px-2" title="Archive Session" aria-label="Archive Session" variant="ghost" size="sm">
                      <X className="h-3 w-3 opacity-50" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Session</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to archive this session? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </div>
      <BlueskyShareDialog open={blueskyDialogOpen} onOpenChange={setBlueskyDialogOpen} title={session.title} blocks={session.blocks} projectFullName={`${username}/${projectId}`} />
    </>
  )
}
