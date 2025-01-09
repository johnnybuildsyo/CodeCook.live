"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun, ChevronDown } from "lucide-react"
import LogoIcon from "../graphics/logo-icon"
import { useEffect, useState } from "react"
import { getAuthUser } from "@/lib/actions/auth"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types/user"
import { WaitlistDialog } from "../home/waitlist-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost"

  useEffect(() => {
    async function initAuth() {
      try {
        const { user, profile } = await getAuthUser()
        setUser(user)
        setProfile(profile)
      } catch (error) {
        console.error("Auth error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <header className="py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full h-20 border-b border-foreground/10">
      <div className="flex h-full w-full items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <LogoIcon />
          <span className="font-bold text-xl">
            CodeCook<span className="text-muted-foreground font-normal">.live</span>
          </span>
        </Link>

        {!isLoading && (
          <>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {!user && isLocalhost && (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative h-auto rounded-full p-2 gap-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={profile?.avatar_url || user.user_metadata.avatar_url} alt={profile?.name || user.user_metadata.name} />
                        <AvatarFallback>{user.user_metadata.name[0]}</AvatarFallback>
                      </Avatar>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal" asChild>
                      <Link href={`/${profile?.username}`} className="cursor-pointer">
                        <div className="flex flex-col space-y-1 pl-2">
                          <p className="text-sm font-medium leading-none">{user.user_metadata.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">@{profile?.username}</p>
                        </div>
                      </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${profile?.username}`}>My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" asChild>
                      <form
                        action={signOut}
                        onSubmit={async (e) => {
                          e.preventDefault()
                          await signOut()
                          window.location.href = "/"
                        }}
                      >
                        <button className="w-full text-left">Sign Out</button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}
      </div>
      <WaitlistDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </header>
  )
}
