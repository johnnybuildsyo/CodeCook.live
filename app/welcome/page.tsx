"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LogoIcon from "@/components/graphics/logo-icon"

export default function WelcomePage() {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set initial avatar and username from GitHub
      if (session?.user) {
        setAvatarUrl(session.user.user_metadata.avatar_url)
        if (session.user.user_metadata.preferred_username) {
          setUsername(session.user.user_metadata.preferred_username.toLowerCase().replace(/[^a-z0-9_]/g, ""))
        }
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const supabase = createClient()

    // Check if username is available
    const { data: existing } = await supabase.from("profiles").select("username").eq("username", username).single()

    if (existing) {
      setError("Username already taken")
      setIsLoading(false)
      return
    }

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("Not authenticated")
      setIsLoading(false)
      return
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      name: user.user_metadata.name,
      avatar_url: avatarUrl || user.user_metadata.avatar_url,
      github_username: user.user_metadata.user_name,
    })

    if (profileError) {
      setError(profileError.message)
      setIsLoading(false)
      return
    }

    // Redirect to their new profile page
    window.location.href = `/${username}`
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 py-16">
        <div className="flex justify-center mb-8">
          <LogoIcon className="scale-150" />
        </div>
        <h1 className="text-3xl font-bold mb-16 text-center">Welcome to CodeThreads!</h1>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-2xl text-center block w-full py-4 font-extrabold">
                Choose your username
              </Label>
              <div className="flex items-center gap-2">
                <div>codethreads.live/</div>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value.toLowerCase())}
                  pattern="^[a-z0-9_]+$"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Profile..." : "Continue »"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
