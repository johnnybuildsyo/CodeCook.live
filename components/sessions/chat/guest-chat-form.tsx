import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface GuestChatFormProps {
  onJoinAsGuest: (guestName: string) => void
  onCancel: () => void
}

export function GuestChatForm({ onJoinAsGuest, onCancel }: GuestChatFormProps) {
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
      await onJoinAsGuest(guestName.trim())
      toast.success(`Welcome to the chat, ${guestName}!`)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-0.5 w-full">
      <h3 className="text-lg font-semibold mb-4">Join Chat as Guest</h3>
      <form action={handleSubmit} className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col sm:flex-row w-full items-center gap-2">
          <Input type="text" name="name" placeholder="Enter your display name" required className="grow w-full sm:w-auto" />
          <Button className="flex items-center" type="submit" disabled={isLoading || !recaptchaToken}>
            <MessageCircle className="h-4 w-4" /> {isLoading ? "..." : "Join"}
          </Button>
        </div>
        <div className="rounded-lg overflow-hidden border bg-background border-background ring-2 ring-foreground/10 scale-95">
          <div className="-m-1">
            <ReCAPTCHA theme={resolvedTheme === "dark" ? "dark" : "light"} sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""} onChange={setRecaptchaToken} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-2">
          Cancel
        </Button>
      </form>
    </div>
  )
}
