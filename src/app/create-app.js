import { dirname, join } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import { userRouter } from "../modules/user/index.js";
import { travelRouter } from "../modules/travel/index.js";
import requestId from "../middlewares/request-id.js";
import { errorHandler, notFoundHandler } from "../middlewares/error-handler.js";
import { createOpenApiRouter } from "../openapi/openapi.router.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createApp = ({ mongoUrl, isProduction, sessionStore }) => {
  const app = express();
  const resolvedSessionStore = sessionStore || MongoStore.create({
    mongoUrl,
    ttl: 60 * 60 * 24 * 30
  });

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
  });
  app.use(
    session({
      name: "tt.sid",
      secret: process.env.SESSION_SECRET || "dev-session-secret",
      resave: false,
      saveUninitialized: false,
      store: resolvedSessionStore,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30
      }
    })
  );

  app.set("view engine", "ejs");
  app.set("views", join(__dirname, "../views"));

  app.use("/api-docs", createOpenApiRouter());
  app.get("/", (_req, res) => res.redirect("/users/app"));
  app.use("/users", travelRouter);
  app.use("/users", userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
