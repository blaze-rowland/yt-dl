import { scrapeChannels } from "./utils/scrape.ts";
import { downloadList } from "./utils/download.ts";
import { CONFIG } from "./config.ts";

async function main() {
  const { CHANNELS, MAX_VIDEOS_PER_CHANNEL } = CONFIG;

  await scrapeChannels(CHANNELS, MAX_VIDEOS_PER_CHANNEL);
  await downloadList();
}

(async () => {
  await main();
})();
