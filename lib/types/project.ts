export interface Project {
  id: string
  github_id: number
  name: string
  display_name: string
  full_name: string
  description: string | null
  homepage: string | null
  screenshot_url: string | null
  logo_url: string | null
  owner_id: string
  profile_id: string
  created_at: string
  updated_at: string
  profiles: {
    name: string | null
    username: string
    avatar_url: string | null
  }
} 