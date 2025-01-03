export interface SessionBlock {
  id: string
  type: "markdown" | "code" | "diff" | "commit-links" | "image"
  role?: "intro" | "implementation" | "summary"
  content: string
  file?: FileChange
  filename?: string
  commits?: CommitLink[]
  imageUrl?: string
  isCollapsed?: boolean
}

export type CommitLink = {
  filename: string
  sha: string
}

export interface FileChange {
  filename: string
  status: string
  additions: number
  deletions: number
  oldValue: string
  newValue: string
}

export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
  project_id: string
  user_id: string
  commit_shas: string[]
  blocks: SessionBlock[]
  is_live: boolean | null
  bluesky_post_uri?: string | null
} 