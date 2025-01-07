"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getAuthUser } from "./auth"
import { ChatMessage } from "@/lib/types/chat"

export async function sendChatMessage(sessionId: string, content: string) {
  try {
    // First get the authenticated user
    const { user } = await getAuthUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    const supabase = await createServiceClient()

    // Verify session status
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("is_live, chat_enabled, user_id")
      .eq("id", sessionId)
      .single()

    if (sessionError) {
      console.error("[Server] Error checking session:", sessionError)
      return { error: "Failed to check session status" }
    }

    if (!session) {
      return { error: "Session not found" }
    }

    if (!session.is_live) {
      return { error: "Session is not live" }
    }

    if (!session.chat_enabled) {
      return { error: "Chat is not enabled for this session" }
    }

    if (session.user_id !== user.id) {
      return { error: "Not authorized to send messages in this session" }
    }

    // Insert message using service role client
    const { data: message, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id, // Use auth user ID
        content,
      })
      .select(`
        *,
        profile:profiles!inner (
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error("[Server] Error inserting message:", insertError)
      return { error: "Failed to send message" }
    }

    return { message }
  } catch (error) {
    console.error("[Server] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function fetchChatMessages(sessionId: string): Promise<{ messages: ChatMessage[] | null; error: string | null }> {
  try {
    console.log("[Server] Fetching messages for session:", sessionId)
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        session_id,
        user_id,
        content,
        created_at,
        updated_at,
        is_system,
        profile:profiles (
          id,
          avatar_url,
          username,
          name
        )
      `)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Server] Error fetching messages:", error)
      return { messages: null, error: "Failed to fetch messages" }
    }

    console.log("[Server] Successfully fetched messages:", data.length)
    return { messages: data as ChatMessage[], error: null }
  } catch (error) {
    console.error("[Server] Unexpected error fetching messages:", error)
    return { messages: null, error: "An unexpected error occurred" }
  }
}

export async function subscribeToChatMessages(sessionId: string) {
  try {
    const supabase = await createServiceClient()
    
    return supabase
      .channel(`service_chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Server] Chat message event:', payload)
        }
      )
      .subscribe()
  } catch (error) {
    console.error('[Server] Error subscribing to chat messages:', error)
    return null
  }
} 