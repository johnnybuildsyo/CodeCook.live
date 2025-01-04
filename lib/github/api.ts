import { createClient } from "@/lib/supabase/client"

export async function fetchGitHubApi(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.provider_token) {
    throw new Error("No GitHub access token found")
  }

  // First attempt with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.provider_token}`,
      Accept: "application/vnd.github.v3+json",
    },
  })

  // If unauthorized, try to refresh the session and retry the request
  if (response.status === 401) {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
    
    if (error || !refreshedSession?.provider_token) {
      throw new Error("Failed to refresh GitHub token")
    }

    // Retry with new token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${refreshedSession.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
  }

  return response
} 