import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageCircle } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface GuestChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinAsGuest: (guestName: string) => void
}

export function GuestChatDialog({ open, onOpenChange, onJoinAsGuest }: GuestChatDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  async function handleSubmit(formData: FormData) {
    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA")
      return
    }

    const guestName = formData.get("name") as string
    if (!guestName || guestName.trim().length < 2) {
      toast.error("Please enter a valid name (at least 2 characters)")
      return
    }

    setIsLoading(true)
    try {
      // Here you might want to validate the name and captcha server-side
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      onJoinAsGuest(guestName.trim())
      onOpenChange(false)
      toast.success(`Welcome to the chat, ${guestName}!`)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Chat as Guest</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col sm:flex-row w-full items-center gap-2">
            <Input type="text" name="name" placeholder="Enter your display name" required className="grow w-full sm:w-auto" />
            <Button type="submit" disabled={isLoading || !recaptchaToken}>
              <MessageCircle className="h-5 w-5 mr-1" /> {isLoading ? "Joining..." : "Join Chat"}
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden border bg-background border-background ring-2 ring-foreground/10">
            <div className="-m-1">
              <ReCAPTCHA theme={resolvedTheme === "dark" ? "dark" : "light"} sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""} onChange={setRecaptchaToken} />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
