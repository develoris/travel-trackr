import type { Server } from "http";
import { disconnectDatabase } from "../config/database.js";

interface ShutdownOptions {
  server: Server;
  stopBackupCron: (() => void) | null;
}

export const registerShutdown = ({
  server,
  stopBackupCron
}: ShutdownOptions): void => {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[shutdown] Received ${signal}`);

    await new Promise<void>((resolve) => server.close(() => resolve()));

    if (typeof stopBackupCron === "function") {
      stopBackupCron();
    }

    try {
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      console.error("Errore durante shutdown:", error);
      process.exit(1);
    }
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};
