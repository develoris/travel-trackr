import "dotenv/config";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import { userRouter } from "./modules/user/index.js";
import { travelRouter } from "./modules/travel/index.js";
import requestId from "./middlewares/request-id.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { seedMockData } from "./scripts/seed-mock-data.js";
import { startBackupCron } from "./scripts/backup-cron.js";
import { createOpenApiRouter } from "./openapi/openapi.router.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const isProduction = process.env.NODE_ENV === "production";
let isShuttingDown = false;
let stopBackupCron = null;

const bootstrap = async () => {
  const { mongoUrl, isInMemory } = await connectDatabase();

  if (isInMemory) {
    await seedMockData();
  }

  if (!isInMemory && process.env.ENABLE_DB_BACKUP_CRON === "true") {
    // Cron integrato nell'app: utile in ambienti semplici o dev-server persistenti.
    stopBackupCron = startBackupCron();
  }

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    // Utile per evidenziare la voce active in navbar/sidebar.
    res.locals.currentPath = req.path;
    next();
  });
  app.use(
    session({
      name: "tt.sid",
      secret: process.env.SESSION_SECRET || "dev-session-secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl,
        ttl: 60 * 60 * 24 * 30
      }),
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30
      }
    })
  );

  app.set("view engine", "ejs");
  app.set("views", join(__dirname, "views"));
  app.use("/api-docs", createOpenApiRouter());
  app.get("/", (_req, res) => res.redirect("/users/app"));
  app.use("/users", travelRouter);
  app.use("/users", userRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    const modeLabel = isInMemory ? "in-memory Mongo" : "Mongo esterno";
    console.log(`Server is running on port ${PORT} (${modeLabel})`);
  });

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`[shutdown] Received ${signal}`);

    await new Promise((resolve) => server.close(resolve));

    if (stopBackupCron) {
      stopBackupCron();
      stopBackupCron = null;
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

bootstrap().catch(async (error) => {
  console.error("Errore durante il bootstrap:", error);
  await disconnectDatabase();
  process.exit(1);
});