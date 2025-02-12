import { runCommandsInParallel } from "./parallel.ts";
import videos from "../yt_videos.json" with { type: "json" };

export async function downloadList() {
  const commands = Object.entries(videos).flatMap(([_, ids]) =>
    ids.map(
      (id) => `yt-dlp -P ./videos/ https://www.youtube.com/watch?v=${id}`,
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
