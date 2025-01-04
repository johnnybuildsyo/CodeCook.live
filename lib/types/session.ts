export interface FileChange {
  filename: string
  status: string
  additions: number
  deletions: number
  oldValue: string
  newValue: string
  patch?: string
}

export interface Block {
  id: string
  type: "markdown" | "diff" | "code" | "commit-links"
  content?: string
  role?: "intro" | "implementation" | "summary"
  file?: FileChange
  isCollapsed?: boolean
  commits?: Array<{ filename: string; sha: string }>
}

export interface Session {
  id: string
  title: string
  blocks: Block[]
  commit_shas: string[]
  bluesky_post_uri?: string | null
  is_live: boolean | null
  is_archived?: boolean
  created_at: string
  updated_at: string
  project_id: string
  user_id: string
} 