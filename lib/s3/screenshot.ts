import puppeteer from "puppeteer"
import { uploadToS3 } from "./utils"

interface GenerateScreenshotParams {
  url: string
  key: string
}

/**
 * Generates a screenshot of a poll and uploads it to S3.
 * @param {GenerateScreenshotParams} params - The parameters for screenshot generation.
 * @returns {Promise<string>} The URL of the uploaded screenshot.
 */
export async function generateAndUploadScreenshot({ url, key }: GenerateScreenshotParams): Promise<string> {
  console.log("Starting screenshot generation:", { url, key })

  try {
    const timeout = 10000
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--no-zygote", "--single-process"],
      timeout,
    })

    const page = await browser.newPage()
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1,
    })

    console.log("Navigating to URL: " + url)
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout,
    })
    console.log("Page loaded")

    await page.waitForSelector("body", { timeout })

    const screenshot = await page.screenshot({
      type: "png",
    })
    await browser.close()

    console.log(`Uploading ${key} to S3: ${process.env.S3_BUCKET_NAME}`)
    const imageUrl = await uploadToS3({
      bucketName: process.env.S3_BUCKET_NAME!,
      key,
      body: screenshot as Buffer,
      contentType: "image/png",
    })

    console.log("Upload successful:", imageUrl)
    return imageUrl
  } catch (error) {
    console.error("Screenshot generation failed:", {
      url,
      key,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error(`Failed to generate screenshot: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
