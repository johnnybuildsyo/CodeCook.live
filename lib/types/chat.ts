export interface ChatMessage {
  id: string
  content: string
  created_at: string
  user_id?: string
  guest_user_id?: string | null
  profile?: {
    id: string
    username: string
    name: string | null
    avatar_url: string | null
  }
  guest_chat_users?: {
    id: string
    name: string
  } | null
} 