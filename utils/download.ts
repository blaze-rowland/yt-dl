import { runCommandsInParallel } from "./parallel.ts";
import videos from "../yt_videos.json" with { type: "json" };
import { CONFIG } from "config.ts";

export async function downloadList() {
  const { DOWNLOAD_PATH } = CONFIG;

  const commands = Object.entries(
    videos as Record<string, Array<string>>,
  ).flatMap(([_, ids]) =>
    ids.map(
      (id) =>
        `yt-dlp -P ${DOWNLOAD_PATH} https://www.youtube.com/watch?v=${id}`,
    ),
  );

  try {
    console.log("Starting parallel execution...");
    const results = await runCommandsInParallel(commands);

    results.forEach((result) => {
      console.log("\nCommand:", result.command);
      if (result.success) {
        console.log("Status: Success");
        console.log("Output:", result.stdout);
        if (result.stderr) {
          console.log("Stderr:", result.stderr);
        }
      } else {
        console.log("Status: Failed");
        console.log("Error:", result.error);
      }
    });
  } catch (error) {
    console.error("Execution failed:", error);
  }
}
