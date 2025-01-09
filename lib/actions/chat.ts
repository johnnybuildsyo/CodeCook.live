"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getAuthUser } from "./auth"
import { ChatMessage } from "../types/chat"
import { Database } from "../supabase/database.types"

type GuestChatUser = Database["public"]["Tables"]["guest_chat_users"]["Row"]

export async function fetchChatMessages(sessionId: string) {
  const supabase = await createServiceClient()

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(
      `
      id,
      content,
      created_at,
      user_id,
      guest_user_id,
      profile:profiles (
        id,
        username,
        name,
        avatar_url
      ),
      guest_chat_users (
        id,
        name
      )
    `
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching chat messages:", error)
    return { messages: null, error }
  }

  return { messages: messages as ChatMessage[], error: null }
}

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

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      content,
      user_id: user.id,
    })

    if (error) {
      console.error("Error sending chat message:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Error sending chat message:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createGuestChatUser(sessionId: string, name: string, captchaToken: string) {
  const supabase = await createServiceClient()

  // First verify the captcha token
  const captchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
  })

  const captchaData = await captchaResponse.json()
  if (!captchaData.success) {
    return { error: "Invalid captcha", guestUser: null }
  }

  // Verify session exists and is live
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("is_live, chat_enabled")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return { error: "Session not found", guestUser: null }
  }

  if (!session.is_live) {
    return { error: "Session is not live", guestUser: null }
  }

  if (!session.chat_enabled) {
    return { error: "Chat is not enabled for this session", guestUser: null }
  }

  // Check if name is already taken in this session
  const { data: existingUser } = await supabase
    .from("guest_chat_users")
    .select("id")
    .eq("session_id", sessionId)
    .ilike("name", name)
    .single()

  if (existingUser) {
    return { error: "Name already taken in this session", guestUser: null }
  }

  // Create the guest user
  const { data: guestUser, error } = await supabase
    .from("guest_chat_users")
    .insert({
      session_id: sessionId,
      name: name.trim(),
      captcha_verified: true,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating guest chat user:", error)
    return { error: error.message, guestUser: null }
  }

  return { error: null, guestUser: guestUser as GuestChatUser }
}

export async function sendGuestChatMessage(sessionId: string, guestUserId: string, content: string) {
  const supabase = await createServiceClient()

  // Verify session status
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("is_live, chat_enabled")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return { error: "Session not found" }
  }

  if (!session.is_live) {
    return { error: "Session is not live" }
  }

  if (!session.chat_enabled) {
    return { error: "Chat is not enabled for this session" }
  }

  // Verify the guest user exists and belongs to this session
  const { data: guestUser } = await supabase
    .from("guest_chat_users")
    .select("id")
    .eq("id", guestUserId)
    .eq("session_id", sessionId)
    .single()

  if (!guestUser) {
    return { error: "Invalid guest user" }
  }

  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    content,
    guest_user_id: guestUserId,
    user_id: '00000000-0000-0000-0000-000000000000'
  })

  if (error) {
    console.error("Error sending guest chat message:", error)
    return { error }
  }

  return { error: null }
} 