"use client"

import { ChangeEvent, useRef } from "react"
import { Camera, Edit, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { convertImageUrl } from "@/lib/utils"

interface AvatarUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({ currentUrl, onUpload, size = "md" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { image_url } = await response.json()
      onUpload(image_url)
    } catch (error) {
      console.error("Avatar upload failed:", error)
    }
  }

  const sizes = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 bg-background rounded-full p-1 shadow-md border">
        <Edit className={cn("text-muted-foreground", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      </div>
      <div className={cn("group rounded-full overflow-hidden", sizes[size])}>
        {currentUrl ? (
          <Image fill={true} src={convertImageUrl(currentUrl)} alt="Avatar" className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="w-full h-full rounded-full object-cover" />
        )}

        <button
          type="button"
          className="flex items-center justify-center absolute w-full h-full inset-0 opacity-0 group-hover:opacity-90 bg-background/80 transition-opacity"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-5 w-5" />
        </button>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  )
}
