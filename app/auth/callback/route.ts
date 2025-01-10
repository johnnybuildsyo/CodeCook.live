import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const redirectPath = requestUrl.searchParams.get("redirect_path")

  // Handle OAuth errors
  if (error) {
    const errorMsg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(
      new URL(`/signin?error=${errorMsg}`, requestUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/signin?error=No authorization code provided", requestUrl.origin)
    )
  }

  try {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !session) {
      console.error("Session error:", sessionError)
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(sessionError?.message || "Failed to create session")}`, requestUrl.origin)
      )
    }

    // Get GitHub user data from the session
    const githubUser = session.user.user_metadata

    if (!githubUser) {
      console.error("No GitHub user metadata found")
      return NextResponse.redirect(
        new URL("/signin?error=Failed to get GitHub user data", requestUrl.origin)
      )
    }

    // Check if user already exists in our database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.redirect(
        new URL("/signin?error=Failed to fetch user profile", requestUrl.origin)
      )
    }

    if (profile?.username) {
      // User already has a profile, redirect to their page or the specified path
      return NextResponse.redirect(
        new URL(redirectPath || `/${profile.username}`, requestUrl.origin)
      )
    }

    // No profile yet, redirect to username selection with GitHub data
    const params = new URLSearchParams({
      name: githubUser.name || githubUser.user_name,
      avatar_url: githubUser.avatar_url,
      github_username: githubUser.user_name,
    })

    // Add the redirect path to the welcome page if it exists
    if (redirectPath) {
      params.append("redirect_path", redirectPath)
    }

    return NextResponse.redirect(
      new URL(`/welcome?${params.toString()}`, requestUrl.origin)
    )
  } catch (error) {
    console.error("Unexpected error during authentication:", error)
    return NextResponse.redirect(
      new URL("/signin?error=An unexpected error occurred", requestUrl.origin)
    )
  }
} 