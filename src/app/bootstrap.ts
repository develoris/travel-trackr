import { connectDatabase } from "../config/database.js";
import { startBackupCron } from "../scripts/backup-cron.js";
import { createApp } from "./create-app.js";
import { registerShutdown } from "./register-shutdown.js";

export const bootstrap = async (): Promise<void> => {
  const isProduction = process.env.NODE_ENV === "production";
  const { mongoUrl } = await connectDatabase();

  let stopBackupCron: (() => void) | null = null;

  if (process.env.ENABLE_DB_BACKUP_CRON === "true") {
    stopBackupCron = startBackupCron();
  }

  const app = createApp({ mongoUrl, isProduction });
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (MongoDB)`);
  });

  registerShutdown({ server, stopBackupCron });
};
