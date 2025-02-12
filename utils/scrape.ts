import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const page = await browser.newPage();

const channelVideoMap = new Map<string, string[]>();

async function extractLinks(maxVideos: number, videoLinks: Set<string>) {
  const links = await page.locator("#video-title-link").all();

  for (const link of links) {
    if (videoLinks.size >= maxVideos) break;

    const href = await link.getAttribute("href");
    if (href && href.includes("/watch?v=")) {
      const videoId = href.split("/watch?v=")[1];
      videoLinks.add(videoId);
    }
  }
}

async function writeVideoLog() {
  try {
    const content = Object.fromEntries(channelVideoMap);
    await writeFile("yt_videos.json", JSON.stringify(content, null, 2));
    console.log("Successfully Wrote to File");
  } catch (error) {
    console.error("Error Writing to File", error);
  }
}

export async function scrapeChannels(channels: string[], maxVideos = Infinity) {
  for (const channel of channels) {
    const videoLinks = new Set<string>();

    const url = new URL(`https://www.youtube.com/@${channel}/videos`);
    await page.goto(url.toString());

    await extractLinks(maxVideos, videoLinks);

    let prevCount = 0;
    while (videoLinks.size < maxVideos) {
      console.log(`Scrolling... Found: ${videoLinks.size}/${maxVideos}`);

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(2000);

      await extractLinks(maxVideos, videoLinks);

      if (videoLinks.size === prevCount) break;
      prevCount = videoLinks.size;
    }

    channelVideoMap.set(channel, Array.from(videoLinks).slice(0, maxVideos));
  }

  await writeVideoLog();
  await browser.close();
}
