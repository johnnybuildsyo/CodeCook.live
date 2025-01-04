import { Database } from "../supabase/database.types"

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"] & {
  profile?: {
    avatar_url: string | null
  } | null
} 