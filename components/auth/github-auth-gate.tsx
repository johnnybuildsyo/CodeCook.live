"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { signInWithGitHub } from "@/components/auth/actions"
import { LoadingAnimation } from "../ui/loading-animation"

export function GitHubAuthGate({ children }: { children?: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 bg-foreground/5 p-4 rounded-lg">
      <div className="text-muted-foreground">{children || "Please sign in with GitHub to continue"}</div>
      {isLoading && <LoadingAnimation>Connecting</LoadingAnimation>}
      <Button
        onClick={async () => {
          setIsLoading(true)
          const url = await signInWithGitHub(window.location.pathname)
          if (url) {
            window.location.href = url
          } else {
            setIsLoading(false)
          }
        }}
        className={isLoading ? "hidden" : ""}
      >
        <Github className="w-4 h-4 mr-2" />
        Connect GitHub
      </Button>
    </div>
  )
}
