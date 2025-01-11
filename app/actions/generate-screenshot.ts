"use server"

import { generateAndUploadScreenshot } from "@/lib/s3/screenshot"

export async function generateProjectScreenshot(username: string, slug: string, url: string) {
  try {
    const screenshotUrl = await generateAndUploadScreenshot({
      url,
      key: `screenshots/${username}/${slug}.png`,
    })
    return { url: screenshotUrl, error: null }
  } catch (error) {
    console.error("Failed to generate and upload screenshot:", error)
    return { url: null, error }
  }
} 