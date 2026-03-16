import "dotenv/config";
import { bootstrap } from "./app/bootstrap.js";
import { disconnectDatabase } from "./config/database.js";

bootstrap().catch(async (error) => {
  console.error("Errore durante il bootstrap:", error);
  await disconnectDatabase();
  process.exit(1);
});
