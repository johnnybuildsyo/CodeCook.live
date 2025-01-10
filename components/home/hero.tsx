"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Check, ChevronsRight } from "lucide-react"
import { WaitlistDialog } from "./waitlist-dialog"
import { BoltIcon } from "@heroicons/react/24/solid"

export default function Hero() {
  const [profile, setProfile] = useState<{ username: string } | null>(null)
  const [isOnWaitlist, setIsOnWaitlist] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("username").eq("id", session.user.id).single()
        setProfile(data)
      }
    })
    // Check if user is on waitlist
    const waitlistStatus = localStorage.getItem("onWaitlist")
    if (waitlistStatus === "true") {
      setIsOnWaitlist(true)
    }
  }, [])

  return (
    <section className="py-20 px-6 text-center">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl text-balance">The Publishing Platform for Live Coding</h1>
        <p className="mt-4 text-xl text-muted-foreground text-balance">
          CodeCook.live is your platform for building your projects in the open where your commits become posts. Grow your audience while you grow your skills as a developer.
        </p>
        <div className="mt-8">
          {profile ? (
            <Link href={`/${profile.username}`}>
              <Button className="bg-blue-500 hover:bg-blue-600 text-xl px-8 py-4 h-auto" size="lg">
                Go to Dashboard <ChevronsRight className="h-8 w-8 ml-1 scale-150" />
              </Button>
            </Link>
          ) : isOnWaitlist ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 text-green-500" />
                <span>You’re on the waitlist!</span>
              </div>
              <p className="text-sm text-muted-foreground">We’ll notify you when its time to start cooking!</p>
            </div>
          ) : (
            <Button className="text-xl px-12 py-4 h-auto" onClick={() => setDialogOpen(true)}>
              <BoltIcon className="h-5 w-5 mr-2 scale-[2] text-blue-500" /> Join Waitlist
            </Button>
          )}
        </div>
      </div>
      <WaitlistDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  )
}
