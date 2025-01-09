"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getAuthUser } from "./auth"
import { ChatMessage } from "../types/chat"
import { cookies } from "next/headers"

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
  try {
    const supabase = await createServiceClient()

    // Validate inputs
    if (!sessionId || !name || !captchaToken) {
      return { error: "Missing required fields", guestUser: null }
    }

    // Validate name length and format
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return { error: "Name must be between 2 and 50 characters", guestUser: null }
    }

    // First verify the captcha token
    const captchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
    })

    const captchaData = await captchaResponse.json()
    if (!captchaData.success) {
      return { error: "Invalid captcha verification", guestUser: null }
    }

    // Verify session exists, is live, and has chat enabled
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("is_live, chat_enabled, user_id")
      .eq("id", sessionId)
      .single()

    if (sessionError) {
      console.error("Error fetching session:", sessionError)
      return { error: "Failed to verify session", guestUser: null }
    }

    if (!session) {
      return { error: "Session not found", guestUser: null }
    }

    if (!session.is_live) {
      return { error: "Session is not live", guestUser: null }
    }

    if (!session.chat_enabled) {
      return { error: "Chat is not enabled for this session", guestUser: null }
    }

    // Check if name is already taken in this session (case insensitive)
    const { data: existingUser, error: existingUserError } = await supabase
      .from("guest_chat_users")
      .select("id")
      .eq("session_id", sessionId)
      .ilike("name", trimmedName)
      .single()

    if (existingUserError && existingUserError.code !== "PGRST116") { // PGRST116 is "no rows returned"
      console.error("Error checking existing user:", existingUserError)
      return { error: "Failed to verify username availability", guestUser: null }
    }

    if (existingUser) {
      return { error: "This name is already taken in this session", guestUser: null }
    }

    // Create the guest user with a transaction to ensure atomicity
    const { data: guestUser, error: insertError } = await supabase
      .from("guest_chat_users")
      .insert({
        session_id: sessionId,
        name: trimmedName,
        captcha_verified: true,
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating guest chat user:", insertError)
      return { error: "Failed to create guest user", guestUser: null }
    }

    // Set a cookie to persist the guest user
    const cookieStore = await cookies()
    cookieStore.set(`guest_user_${sessionId}`, guestUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/"
    })

    return { error: null, guestUser }
  } catch (error) {
    console.error("Unexpected error in createGuestChatUser:", error)
    return { error: "An unexpected error occurred", guestUser: null }
  }
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

export async function getGuestChatUser(sessionId: string, guestUserId: string) {
  try {
    const supabase = await createServiceClient()

    const { data: guestUser, error } = await supabase
      .from("guest_chat_users")
      .select("*")
      .eq("id", guestUserId)
      .eq("session_id", sessionId)
      .single()

    if (error) {
      console.error("Error fetching guest user:", error)
      return { error: "Failed to fetch guest user", guestUser: null }
    }

    if (!guestUser) {
      return { error: "Guest user not found", guestUser: null }
    }

    // Update last active timestamp
    const { error: updateError } = await supabase
      .from("guest_chat_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", guestUserId)

    if (updateError) {
      console.error("Error updating guest user last active timestamp:", updateError)
    }

    return { error: null, guestUser }
  } catch (error) {
    console.error("Unexpected error in getGuestChatUser:", error)
    return { error: "An unexpected error occurred", guestUser: null }
  }
}

export async function getExistingGuestUser(sessionId: string) {
  try {
    const cookieStore = await cookies()
    const guestUserId = cookieStore.get(`guest_user_${sessionId}`)?.value

    if (!guestUserId) {
      return { error: null, guestUser: null }
    }

    return await getGuestChatUser(sessionId, guestUserId)
  } catch (error) {
    console.error("Error getting existing guest user:", error)
    return { error: "Failed to get existing guest user", guestUser: null }
  }
} 