import { GitHubAuthGate } from "@/components/auth/github-auth-gate"
import Header from "@/components/layout/header"
import { SessionManager } from "@/components/sessions/session-manager"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

interface LiveSessionPageProps {
  params: Promise<{
    username: string
    projectId: string
    sessionId: string
  }>
}

export default async function LiveSessionPage({ params }: LiveSessionPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/signin")
  }

  const { username, projectId, sessionId } = await params

  console.log("About to set session live. Session ID:", sessionId)

  // Set session as live
  const { error: liveError } = await supabase
    .from("sessions")
    .update({
      is_live: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)

  console.log("Update result:", { error: liveError })

  if (liveError) {
    console.error("Failed to set session as live:", liveError)
  }

  // Get session data
  const sessionData = await supabase
    .from("sessions")
    .select("*, commit_shas")
    .eq("id", sessionId)
    .single()
    .then(({ data }) => {
      console.log("Initial session fetch:", data)
      if (!data) return null

      const defaultBlocks = [
        {
          id: crypto.randomUUID(),
          type: "markdown",
          content: "",
          role: "intro",
        },
        {
          id: crypto.randomUUID(),
          type: "markdown",
          content: "",
          role: "implementation",
        },
        {
          id: crypto.randomUUID(),
          type: "markdown",
          content: "",
          role: "summary",
        },
      ]

      // Handle empty or missing blocks
      if (!data.blocks || data.blocks === "[]" || data.blocks === "null") {
        return {
          ...data,
          blocks: defaultBlocks,
        }
      }

      // If blocks is already an array, use it
      if (Array.isArray(data.blocks)) {
        return {
          ...data,
          blocks: data.blocks.length === 0 ? defaultBlocks : data.blocks,
        }
      }

      // If blocks is a string, try to parse it
      if (typeof data.blocks === "string") {
        try {
          console.log("Parsing blocks:", data.blocks)
          const parsedBlocks = JSON.parse(data.blocks)
          return {
            ...data,
            blocks: Array.isArray(parsedBlocks) && parsedBlocks.length === 0 ? defaultBlocks : parsedBlocks,
          }
        } catch (e) {
          console.error("Error parsing blocks:", e, "Raw blocks:", data.blocks)
          return { ...data, blocks: defaultBlocks }
        }
      }

      // Fallback to default blocks
      return { ...data, blocks: defaultBlocks }
    })

  if (!sessionData) {
    notFound()
  }

  // Check if user is the author
  if (sessionData.user_id !== user.id) {
    redirect(`/${username}/${projectId}/session/${sessionId}`)
  }

  // Verify the update
  const { data: verifyData } = await supabase.from("sessions").select("is_live").eq("id", sessionId).single()

  console.log("Verification query result:", verifyData)

  // Get project details
  const { data: project } = await supabase.from("projects").select("*, profiles!inner(username)").eq("name", projectId).eq("profiles.username", username).single()

  if (!project) notFound()

  // Get GitHub token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError || !session?.provider_token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <h3 className="text-2xl font-bold mb-8">Live Session</h3>
          <GitHubAuthGate />
        </main>
      </div>
    )
  }

  // Fetch commit from GitHub
  const commitSha = sessionData.commit_shas[0]
  let commit = {
    sha: "",
    message: "",
    author_name: user.user_metadata?.full_name || user.email || "Unknown",
    authored_at: new Date().toISOString(),
  }

  if (commitSha) {
    const response = await fetch(`https://api.github.com/repos/${project.full_name}/commits/${commitSha}`, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <h3 className="text-2xl font-bold mb-8">Live Session</h3>
            <GitHubAuthGate />
          </main>
        </div>
      )
    }

    const commitData = await response.json()
    commit = {
      sha: commitData.sha,
      message: commitData.commit.message,
      author_name: commitData.commit.author.name,
      authored_at: commitData.commit.author.date,
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-8 max-w-4xl 2xl:max-w-none w-full">
        <SessionManager projectId={project.id} commit={commit} fullName={project.full_name} session={sessionData} />
      </main>
    </div>
  )
}
