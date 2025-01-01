"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { GithubRepo } from "@/types/github"
import { toSlug } from "@/lib/utils/slug"

export async function createProject(username: string, repo: GithubRepo) {
  const supabase = await createClient()

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Get profile data
  const { data: profile } = await supabase.from("profiles").select("id").eq("username", username).single()

  if (!profile) {
    return { error: "Profile not found" }
  }

  try {
    // Create slug from repo name
    const slug = toSlug(repo.name)

    // Validate the slug
    if (!slug || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      return { error: "Invalid project name format" }
    }

    // Create project with profile_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        github_id: repo.id,
        name: slug,
        display_name: repo.name.replace(/-/g, " ").replace(/_/g, " "),
        full_name: `${session.user.user_metadata.user_name}/${repo.name}`,
        description: repo.description,
        homepage: repo.homepage,
        owner_id: session.user.id,
        profile_id: profile.id,
      })
      .select()
      .single()

    if (projectError) throw projectError

    revalidatePath(`/${username}`)
    return { project, error: null }
  } catch (error) {
    return { 
      project: null,
      error: error instanceof Error ? error.message : "Failed to create project" 
    }
  }
} 