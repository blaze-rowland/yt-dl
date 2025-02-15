import { chromium } from "playwright";
import type { Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const channelVideoMap = new Map<string, string[]>();

async function extractLinks(page: Page, maxVideos: number, videoLinks: Set<string>) {
  try {
    await page.waitForSelector("#video-title-link", { timeout: 10000 });

    const newLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("#video-title-link"));
      return links
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => href && href.includes("/watch?v="))
        .map(href => href.split("/watch?v=")[1]);
    });

    for (const videoId of newLinks) {
      if (videoLinks.size >= maxVideos) break;
      videoLinks.add(videoId);
    }

    return true;
  } catch (error) {
    console.error("Error extracting links:", error);
    return false;
  }
}

async function writeVideoLog() {
  try {
    const content = Object.fromEntries(channelVideoMap);
    await writeFile("yt_videos.json", JSON.stringify(content, null, 2));
    console.log("Successfully wrote to file");
  } catch (error) {
    console.error("Error writing to file:", error);
  }
}

export async function scrapeChannels(channels: string[], maxVideos = Infinity, popular = false) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });

  try {
    const page = await context.newPage();

    for (const channel of channels) {
      console.log(`Processing channel: ${channel}`);
      const videoLinks = new Set<string>();

      try {
        const url = new URL(`https://www.youtube.com/@${channel}/videos`);
        await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 30000 });

        if (popular) {
          page.click('.style-scope.yt-chip-cloud-chip-renderer[title="Popular"]')
          console.log("Clicking Popular..")
          await page.waitForTimeout(1500 + Math.random() * 1500);
        }

        let scrollAttempts = 0;
        const maxScrollAttempts = 20;
        let prevCount = 0;

        while (videoLinks.size < maxVideos && scrollAttempts < maxScrollAttempts) {
          const success = await extractLinks(page, maxVideos, videoLinks);
          if (!success) break;

          console.log(`Found: ${videoLinks.size}/${maxVideos} videos`);

          if (videoLinks.size === prevCount) {
            scrollAttempts++;
          } else {
            scrollAttempts = 0;
          }

          prevCount = videoLinks.size;

          await page.evaluate(() => {
            window.scrollBy({
              top: window.innerHeight,
              behavior: 'smooth'
            });
          });

          await page.waitForTimeout(1500 + Math.random() * 1500);
        }

        channelVideoMap.set(channel, Array.from(videoLinks).slice(0, maxVideos));
      } catch (error) {
        console.error(`Error processing channel ${channel}:`, error);
      }
    }
  } finally {
    await browser.close();
  }

  await writeVideoLog();
}
