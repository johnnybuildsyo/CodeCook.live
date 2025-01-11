import Header from "@/components/layout/header"
import { SessionView } from "@/components/sessions/session-view"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ChatDrawer } from "@/components/sessions/chat/chat-drawer"

interface SessionPageProps {
  params: Promise<{
    username: string
    projectId: string
    sessionId: string
  }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { username, projectId, sessionId } = await params
  const supabase = await createClient()

  // Get session data
  const { data: sessionData } = await supabase.from("sessions").select("*").eq("id", sessionId).single()

  if (!sessionData) {
    notFound()
  }

  // Parse blocks
  const session = {
    ...sessionData,
    blocks: Array.isArray(sessionData.blocks) ? sessionData.blocks : typeof sessionData.blocks === "string" ? JSON.parse(sessionData.blocks) : [],
  }

  // Get next and previous sessions
  const [{ data: prevSession }, { data: nextSession }] = await Promise.all([
    supabase.from("sessions").select("id").eq("project_id", session.project_id).lt("created_at", session.created_at).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("sessions").select("id").eq("project_id", session.project_id).gt("created_at", session.created_at).order("created_at", { ascending: true }).limit(1).single(),
  ])

  // Get project details
  const { data: project } = await supabase.from("projects").select("full_name").eq("name", projectId).single()

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative flex">
        <main className="flex-1 transition-[margin] duration-200 ease-in-out">
          <div className="container mx-auto px-4 py-8 w-full max-w-6xl">
            <SessionView username={username} projectId={projectId} session={session} fullName={project.full_name} />
            <div className="flex justify-between mt-8">
              {prevSession ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${username}/${projectId}/session/${prevSession.id}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous Session
                  </Link>
                </Button>
              ) : (
                <div />
              )}
              {nextSession ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${username}/${projectId}/session/${nextSession.id}`}>
                    Next Session <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
        {session.chat_enabled && <ChatDrawer sessionId={session.id} />}
      </div>
    </div>
  )
}
