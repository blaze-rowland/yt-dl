import { scrapeChannels } from "./utils/scrape.ts";
import { downloadList } from "./utils/download.ts";
import { CONFIG } from "./config.ts";
import { exec } from "child_process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).options({
  popular: { type: 'boolean', default: false, describe: 'Download most popular videos' },
}).parseSync();

const { popular } = argv;

async function main() {
  const { CHANNELS, MAX_VIDEOS_PER_CHANNEL } = CONFIG;

  await scrapeChannels(CHANNELS, MAX_VIDEOS_PER_CHANNEL, popular);
  await downloadList();

  if (CONFIG.OUTPUT_PATH) {
    try {
      const { stdout, stderr } = exec(`mv ${CONFIG.DOWNLOAD_PATH}/* ${CONFIG.OUTPUT_PATH}`);
      return { success: true, stdout, stderr }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

(async () => {
  await main();
})();
