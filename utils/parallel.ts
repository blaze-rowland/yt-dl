import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function runCommandsInParallel(commands: Array<string>) {
  try {
    const promises = commands.map(async (command) => {
      try {
        const { stdout, stderr } = await execAsync(command);
        return {
          command,
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        };
      } catch (error: any) {
        return {
          command,
          success: false,
          error: error.message,
        };
      }
    });

    return await Promise.all(promises);
  } catch (error: any) {
    throw new Error(`Failed to execute commands: ${error.message}`);
  }
}
