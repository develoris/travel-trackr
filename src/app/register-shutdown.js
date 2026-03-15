import { disconnectDatabase } from "../config/database.js";

export const registerShutdown = ({ server, stopBackupCron }) => {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`[shutdown] Received ${signal}`);

    await new Promise((resolve) => server.close(resolve));

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
