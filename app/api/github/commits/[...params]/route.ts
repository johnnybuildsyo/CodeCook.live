import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface GitHubFile {
  filename: string
  additions: number
  deletions: number
  patch?: string
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  files?: GitHubFile[]
}

export async function GET(request: NextRequest, { params }: { params: { params: string[] } }) {
  const [owner, repo, action, ...rest] = params.params
  const fullName = `${owner}/${repo}`

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.provider_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (action === "latest") {
    // Get latest commit
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits`, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commits" }, { status: response.status })
    }

    const commits = (await response.json()) as GitHubCommit[]
    if (commits && commits.length > 0) {
      return NextResponse.json(commits[0])
    }
    return NextResponse.json(null)
  }

  if (action === "diff") {
    // Handle existing diff logic
    const sha = rest[0]
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${sha}`, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commit" }, { status: response.status })
    }

    const commit = (await response.json()) as GitHubCommit
    const files = commit.files || []

    return NextResponse.json(
      files.map((file) => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      }))
    )
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
} 