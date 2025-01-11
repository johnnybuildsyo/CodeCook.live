import Header from "@/components/layout/header"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ProjectEditForm } from "@/components/projects/project-edit-form"
import { ProjectMediaEditor } from "@/components/projects/project-media-editor"

interface ProjectEditPageProps {
  params: Promise<{
    username: string
    projectId: string
  }>
}

export default async function ProjectEditPage({ params }: ProjectEditPageProps) {
  const { username, projectId } = await params
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user || userError) {
    redirect("/signin")
  }

  const { data: project } = await supabase
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
    .single()

  if (!project) notFound()

  // Check if user is the owner
  if (user.id !== project.owner_id) {
    redirect(`/${username}/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Project</h1>
          <p className="text-muted-foreground">Update your project details and media</p>
        </div>
        <div className="space-y-8">
          <ProjectMediaEditor projectId={project.id} screenshotUrl={project.screenshot_url} logoUrl={project.logo_url} projectName={project.name} username={username} homepage={project.homepage} />
          <ProjectEditForm project={project} username={username} />
        </div>
      </main>
    </div>
  )
}
