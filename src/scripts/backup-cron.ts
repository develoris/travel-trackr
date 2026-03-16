import "dotenv/config";
import cron from "node-cron";
import { runMongoBackup } from "./backup-db.js";

const DEFAULT_CRON = "0 3 * * *";

interface StartBackupCronOptions {
  cronExpression?: string;
  runOnStartup?: boolean;
  logger?: { log: (...args: unknown[]) => void; error: (...args: unknown[]) => void };
}

export const startBackupCron = ({
  cronExpression = process.env.DB_BACKUP_CRON || DEFAULT_CRON,
  runOnStartup = process.env.DB_BACKUP_RUN_ON_STARTUP === "true",
  logger = console
}: StartBackupCronOptions = {}): (() => void) => {
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid DB_BACKUP_CRON expression: ${cronExpression}`);
  }

  const task = cron.schedule(cronExpression, async () => {
    try {
      await runMongoBackup({ logger });
    } catch (error) {
      logger.error("[backup-cron] Backup failed", error);
    }
  });

  logger.log(`[backup-cron] Scheduled with expression: ${cronExpression}`);

  if (runOnStartup) {
    void runMongoBackup({ logger }).catch((error) => {
      logger.error("[backup-cron] Startup backup failed", error);
    });
  }

  return () => task.stop();
};

if (process.argv[1] && process.argv[1].endsWith("backup-cron.js")) {
  startBackupCron();
}
