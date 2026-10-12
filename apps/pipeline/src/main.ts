import { runPipeline } from "./pipeline/run-pipeline.js";
import { logger } from "./lib/logger.js";

function parseCliArgs(): Record<string, any> {
  const args = process.argv.slice(2);
  const overrides: Record<string, any> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--db" && args[i + 1]) {
      overrides.DB_FILE = args[i + 1];
      i++;
    } else if (arg === "--export" && args[i + 1]) {
      overrides.EXPORT_DIR = args[i + 1];
      i++;
    } else if (arg === "--dry-run") {
      overrides.DRY_RUN = true;
    } else if (arg === "--skip-llm") {
      overrides.SKIP_LLM = true;
    }
  }

  return overrides;
}

async function main() {
  const overrides = parseCliArgs();
  try {
    await runPipeline(overrides);
    process.exit(0);
  } catch (err: any) {
    logger.error(`Pipeline exited with error: ${err.message}`);
    process.exit(1);
  }
}

main();
