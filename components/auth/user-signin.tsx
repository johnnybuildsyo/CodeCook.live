"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import { signInWithGitHub } from "./actions"
import { LoadingAnimation } from "../ui/loading-animation"
import { useSearchParams } from "next/navigation"

export function UserSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get error from URL if present
    const urlError = searchParams?.get("error")
    if (urlError) {
      // Decode and format the error message
      const decodedError = decodeURIComponent(urlError)
        .replace(/\+/g, " ")
        .replace(/^Error:?\s*/i, "")
      setError(decodedError)
    }
  }, [searchParams])

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Sign in to CodeCook.live</CardTitle>
        <CardDescription>Continue with GitHub to sign in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-600">Error: {error}</div>}
        {isLoading ? (
          <LoadingAnimation className="w-full text-center text-sm">Connecting to GitHub</LoadingAnimation>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={async () => {
              setError(null)
              setIsLoading(true)
              try {
                const url = await signInWithGitHub()
                if (url) {
                  window.location.href = url
                } else {
                  throw new Error("Failed to get authorization URL")
                }
              } catch (error) {
                console.error("Failed to sign in:", error)
                setError("Failed to initiate GitHub sign-in. Please try again later.")
                setIsLoading(false)
              }
            }}
          >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
