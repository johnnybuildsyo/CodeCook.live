import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

interface GenerateScreenshotParams {
  url: string
  key: string
}

export async function generateAndUploadScreenshot({ url, key }: GenerateScreenshotParams) {
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    // Create a new page
    const page = await browser.newPage()
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })

    // Navigate to URL
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })

    // Take screenshot
    const screenshot = await page.screenshot({ type: "png" })

    // Close browser
    await browser.close()

    // Upload to S3
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: screenshot,
        ContentType: "image/png",
      })
    )

    // Return the URL
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error("Screenshot generation failed:", error)
    throw error
  }
}
