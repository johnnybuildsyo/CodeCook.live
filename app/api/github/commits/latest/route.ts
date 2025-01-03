import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("Checking for latest commit")
  const repo = request.nextUrl.searchParams.get("repo")
  const since = request.nextUrl.searchParams.get("since")
  
  if (!repo) {
    return new Response("Missing repo parameter", { status: 400 })
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // Only fetch commits after the since timestamp
    const url = since 
      ? `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=1`
      : `https://api.github.com/repos/${repo}/commits?per_page=1`
    
    console.log("Fetching commits since:", since || "no timestamp")
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      console.error("GitHub API error:", response.status, await response.text())
      return new Response("GitHub API error", { status: response.status })
    }

    const commits = await response.json()
    if (!commits || commits.length === 0) {
      console.log("No new commits found")
      return new Response(JSON.stringify({ commit: null }))
    }

    const latestCommit = commits[0]
    console.log("Latest commit found:", {
      sha: latestCommit.sha,
      message: latestCommit.commit.message,
      date: latestCommit.commit.author.date
    })

    return new Response(JSON.stringify({
      commit: {
        sha: latestCommit.sha,
        message: latestCommit.commit.message,
        author: {
          name: latestCommit.commit.author.name,
          date: latestCommit.commit.author.date
        }
      }
    }))
  } catch (error) {
    console.error("Error fetching latest commit:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
} 