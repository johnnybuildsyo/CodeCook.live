import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Session } from "@/lib/types/session"
import { ProjectView } from "@/components/projects/project-view"

interface ProjectPageProps {
  params: Promise<{
    username: string
    projectId: string
  }>
}

async function getGitHubStats(fullRepoName: string, token: string) {
  const [owner, repo] = fullRepoName.split("/")

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  })
  if (!response.ok) return null
  const data = await response.json()

  // Get commit count using the repository's default branch
  const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  })
  const linkHeader = commitsResponse.headers.get("link")
  const commitCount = linkHeader ? parseInt(linkHeader.match(/page=(\d+)>; rel="last"/)?.[1] || "0") : 0

  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    commits: commitCount,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { username, projectId } = await params
  const supabase = await createClient()

  const [
    { data: project },
    {
      data: { session },
    },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
        *,
        profiles!inner (
          name,
          username,
          avatar_url
        )
      `
      )
      .eq("name", projectId)
      .eq("profiles.username", username)
      .single(),
    supabase.auth.getSession(),
  ])

  if (!project) notFound()

  const stats = session?.provider_token && project.full_name ? await getGitHubStats(project.full_name, session.provider_token) : null

  // Get sessions
  const sessions = (await supabase
    .from("sessions")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .then(({ data }) => {
      if (!data) return []

      return data.map((session) => {
        // Handle empty or missing blocks
        if (!session.blocks || session.blocks === "[]" || session.blocks === "null") {
          return { ...session, blocks: [] }
        }

        // If blocks is already an array, use it
        if (Array.isArray(session.blocks)) {
          return { ...session, blocks: session.blocks }
        }

        // If blocks is a string, try to parse it
        if (typeof session.blocks === "string") {
          try {
            const parsedBlocks = JSON.parse(session.blocks)
            return { ...session, blocks: Array.isArray(parsedBlocks) ? parsedBlocks : [] }
          } catch (e) {
            console.error("Error parsing blocks for session", session.id, ":", e, "Raw blocks:", session.blocks)
            return { ...session, blocks: [] }
          }
        }

        // Fallback to empty blocks
        return { ...session, blocks: [] }
      })
    })) as Session[]

  return <ProjectView project={project} stats={stats} sessions={sessions} session={session} username={username} projectId={projectId} />
}
