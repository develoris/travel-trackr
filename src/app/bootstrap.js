import { connectDatabase } from "../config/database.js";
import { seedMockData } from "../scripts/seed-mock-data.js";
import { startBackupCron } from "../scripts/backup-cron.js";
import { createApp } from "./create-app.js";
import { registerShutdown } from "./register-shutdown.js";

export const bootstrap = async () => {
  const isProduction = process.env.NODE_ENV === "production";
  const { mongoUrl, isInMemory } = await connectDatabase();

  if (isInMemory) {
    await seedMockData();
  }

  let stopBackupCron = null;

  if (!isInMemory && process.env.ENABLE_DB_BACKUP_CRON === "true") {
    // Cron integrato nell'app: utile in ambienti semplici o dev-server persistenti.
    stopBackupCron = startBackupCron();
  }

  const app = createApp({ mongoUrl, isProduction });
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    const modeLabel = isInMemory ? "in-memory Mongo" : "Mongo esterno";
    console.log(`Server is running on port ${PORT} (${modeLabel})`);
  });

  registerShutdown({ server, stopBackupCron });
};
