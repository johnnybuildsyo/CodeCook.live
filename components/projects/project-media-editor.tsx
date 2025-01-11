"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LoadingAnimation } from "../ui/loading-animation"
import { ImagePlus, RefreshCw, X } from "lucide-react"
import Image from "next/image"
import { convertImageUrl } from "@/lib/utils"
import { generateProjectScreenshot } from "@/app/actions/generate-screenshot"

interface ProjectMediaEditorProps {
  projectId: string
  screenshotUrl: string | null
  logoUrl: string | null
  projectName: string
  username: string
  homepage: string | null
}

export function ProjectMediaEditor({ projectId, screenshotUrl: initialScreenshotUrl, logoUrl: initialLogoUrl, projectName, username, homepage }: ProjectMediaEditorProps) {
  const [screenshotUrl, setScreenshotUrl] = useState(initialScreenshotUrl)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false)

  const handleImageUpload = async (file: File, type: "screenshot" | "logo") => {
    if (!file) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Upload image to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${type}-${Math.random()}.${fileExt}`
      const filePath = `project-media/${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("public").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(filePath)

      // Update project
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          [type === "screenshot" ? "screenshot_url" : "logo_url"]: publicUrl,
        })
        .eq("id", projectId)

      if (updateError) throw updateError

      // Update state
      if (type === "screenshot") {
        setScreenshotUrl(publicUrl)
      } else {
        setLogoUrl(publicUrl)
      }

      toast.success(`Project ${type} updated`)
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error)
      toast.error(`Failed to upload ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveImage = async (type: "screenshot" | "logo") => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Update project
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          [type === "screenshot" ? "screenshot_url" : "logo_url"]: null,
        })
        .eq("id", projectId)

      if (updateError) throw updateError

      // Update state
      if (type === "screenshot") {
        setScreenshotUrl(null)
      } else {
        setLogoUrl(null)
      }

      toast.success(`Project ${type} removed`)
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error)
      toast.error(`Failed to remove ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingAnimation>Updating project media</LoadingAnimation>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2 col-span-2">
            <div className="font-medium flex items-center justify-between">
              <span>Screenshot</span>
              {homepage && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs pr-1 text-blue-500 hover:text-blue-600"
                  disabled={isGeneratingScreenshot}
                  onClick={async () => {
                    setIsGeneratingScreenshot(true)
                    try {
                      const { url: newScreenshotUrl, error: screenshotError } = await generateProjectScreenshot(username, projectName, homepage)
                      if (screenshotError) throw screenshotError

                      if (newScreenshotUrl) {
                        const supabase = createClient()
                        const { error: updateError } = await supabase.from("projects").update({ screenshot_url: newScreenshotUrl }).eq("id", projectId)

                        if (updateError) throw updateError

                        setScreenshotUrl(newScreenshotUrl)
                        toast.success("Screenshot generated successfully")
                      }
                    } catch (error) {
                      console.error("Failed to generate screenshot:", error)
                      toast.error("Failed to generate screenshot")
                    } finally {
                      setIsGeneratingScreenshot(false)
                    }
                  }}
                >
                  {isGeneratingScreenshot ? (
                    <LoadingAnimation className="-mb-1 relative bottom-1" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Generate Screenshot
                    </>
                  )}
                </button>
              )}
            </div>
            {screenshotUrl ? (
              <div className="relative">
                <div className="w-full aspect-video">
                  <Image fill={true} src={convertImageUrl(screenshotUrl)} alt="Project screenshot" className="object-cover rounded-lg border" />
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80" onClick={() => handleRemoveImage("screenshot")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload a screenshot</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "screenshot")} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <div className="font-medium">Logo</div>
            {logoUrl ? (
              <div className="relative w-48 h-48">
                <Image src={convertImageUrl(logoUrl)} alt="Project logo" className="rounded-lg border object-contain w-full h-full" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80" onClick={() => handleRemoveImage("logo")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center">
                  <ImagePlus className="w-6 h-6 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Upload logo</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")} />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
