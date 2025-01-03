"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/lib/supabase/database.types"
import { SessionBlock } from "@/lib/types/session"

export type SessionData = Pick<Database["public"]["Tables"]["sessions"]["Insert"], "title" | "commit_shas"> & {
  blocks: SessionBlock[]
}

export async function upsertSession(projectId: string, sessionData: SessionData, sessionId?: string) {
  const supabase = await createClient()

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error("Not authenticated")
  }

  // Get project to verify ownership/permissions
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single()

  if (!project) {
    throw new Error("Project not found")
  }

  if (project.owner_id !== session.user.id) {
    throw new Error("Not authorized to modify sessions in this project")
  }

  // Prepare session data
  const data = {
    project_id: projectId,
    user_id: session.user.id,
    ...sessionData,
    blocks: sessionData.blocks as unknown as Database["public"]["Tables"]["sessions"]["Insert"]["blocks"]
  }

  try {
    let result
    if (sessionId) {
      // Update existing session
      // First verify session ownership
      const { data: existingSession } = await supabase
        .from("sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single()

      if (!existingSession || existingSession.user_id !== session.user.id) {
        throw new Error("Not authorized to edit this session")
      }

      result = await supabase
        .from("sessions")
        .update(data)
        .eq("id", sessionId)
        .select()
        .single()
    } else {
      // Create new session
      result = await supabase
        .from("sessions")
        .insert(data)
        .select()
        .single()
    }

    if (result.error) throw result.error

    // Get project path for revalidation and redirect
    const { data: projectPath } = await supabase
      .from("projects")
      .select("name, profiles!inner(username)")
      .eq("id", projectId)
      .single()

    if (!projectPath) throw new Error("Could not find project path")

    const path = `/${projectPath.profiles.username}/${projectPath.name}`
    revalidatePath(path)
    return { success: true, path }

  } catch (error) {
    console.error("Failed to save session:", error)
    throw error
  }
}

export async function checkStaleSession(sessionId: string) {
  const supabase = await createClient()
  const STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

  const { data: session } = await supabase
    .from("sessions")
    .select("updated_at, is_live")
    .eq("id", sessionId)
    .single()

  if (session?.is_live) {
    const lastUpdate = new Date(session.updated_at).getTime()
    const now = new Date().getTime()
    
    if (now - lastUpdate > STALE_THRESHOLD) {
      await supabase
        .from("sessions")
        .update({ is_live: false })
        .eq("id", sessionId)
      
      return true // Session was stale and updated
    }
  }
  
  return false // Session was not stale
} 