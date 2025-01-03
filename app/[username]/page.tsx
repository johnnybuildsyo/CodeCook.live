import { UserProfileCard } from "@/components/users/user-profile-card"
import { ProjectList } from "@/components/projects/project-list"
import { ProjectImportContainer } from "@/components/projects/project-import-container"
import Header from "@/components/layout/header"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/database.types"

interface UserPageProps {
  params: Promise<{
    username: string
  }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get profile and projects with session counts
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      projects (
        *,
        sessions:sessions(count)
      )
    `
    )
    .eq("username", username)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">User not found</h1>
            <p className="text-muted-foreground">The user @{username} does not exist.</p>
          </div>
        </main>
      </div>
    )
  }

  // Check if current user owns this profile using ID
  const isCurrentUser = session?.user?.id === profile.id

  // Show project import only if it's the current user's profile and they have no projects
  if (isCurrentUser && profile.projects?.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ProjectImportContainer username={username} />
      </div>
    )
  }

  // Transform projects to include session count
  const projectsWithCounts =
    profile.projects?.map((project) => ({
      ...project,
      sessionCount: project.sessions?.[0]?.count ?? 0,
    })) || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <UserProfileCard
              name={profile.name}
              username={profile.username}
              avatar={profile.avatar_url}
              bio={profile.bio}
              github={profile.github_username}
              twitter={profile.twitter_username}
              isCurrentUser={isCurrentUser}
              links={
                profile.links
                  ? (profile.links as Json[]).map((link) => {
                      const typedLink = link as Record<string, string>
                      return {
                        title: typedLink.title || "",
                        url: typedLink.url || "",
                      }
                    })
                  : []
              }
            />
          </div>
          <ProjectList projects={projectsWithCounts} username={profile.username} isCurrentUser={isCurrentUser} />
        </div>
      </main>
    </div>
  )
}
