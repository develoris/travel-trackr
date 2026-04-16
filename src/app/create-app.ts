import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import express, { type Express, type RequestHandler } from "express";
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

const resolveViewsPath = (): string => {
  const compiledViewsPath = join(__dirname, "../views");
  if (existsSync(compiledViewsPath)) {
    return compiledViewsPath;
  }

  return join(process.cwd(), "src", "views");
};

interface CreateAppOptions {
  mongoUrl: string;
  isProduction: boolean;
  sessionStore?: session.Store;
}

const normalizeBasePath = (value?: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const shouldPrefixWithBasePath = (url: string, basePath: string): boolean => {
  if (!basePath) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.startsWith(`${basePath}/`) || url === basePath) return false;
  return true;
};

const prefixBasePath = (url: string, basePath: string): string => {
  if (!shouldPrefixWithBasePath(url, basePath)) return url;
  return `${basePath}${url}`;
};

const rewriteHtmlAbsoluteUrls = (html: string, basePath: string): string => {
  if (!basePath) return html;

  return html.replace(
    /(href|src|action)=("|')(\/[^"']*)(\2)/gi,
    (_match, attr, quoteStart, path, quoteEnd) =>
      `${attr}=${quoteStart}${prefixBasePath(path, basePath)}${quoteEnd}`
  );
};

export const createApp = ({
  mongoUrl,
  isProduction,
  sessionStore
}: CreateAppOptions): Express => {
  const app = express();
  const basePath = normalizeBasePath(process.env.APP_BASE_PATH);

  const resolvedSessionStore =
    sessionStore ||
    MongoStore.create({
      mongoUrl,
      ttl: 60 * 60 * 24 * 30
    });

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(requestId);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const originalRedirect = res.redirect.bind(res);
    const patchedRedirect: typeof res.redirect = ((
      statusOrUrl: number | string,
      maybeUrl?: string
    ) => {
      if (typeof statusOrUrl === "number") {
        return originalRedirect(
          statusOrUrl,
          prefixBasePath(maybeUrl || "/", basePath)
        );
      }
      return originalRedirect(prefixBasePath(statusOrUrl, basePath));
    }) as typeof res.redirect;

    res.redirect = patchedRedirect;

    const originalSend = res.send.bind(res);
    const patchedSend: typeof res.send = ((body?: unknown) => {
      const contentType = res.getHeader("Content-Type")?.toString() || "";
      if (typeof body === "string" && contentType.includes("text/html")) {
        return originalSend(rewriteHtmlAbsoluteUrls(body, basePath));
      }
      return originalSend(body as never);
    }) as typeof res.send;

    res.send = patchedSend;
    next();
  });

  const setCurrentPath: RequestHandler = (req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.basePath = basePath;
    next();
  };
  app.use(setCurrentPath);

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
  app.set("views", resolveViewsPath());

  app.use("/api-docs", createOpenApiRouter());
  app.get("/", (_req, res) => res.redirect("/users/app"));
  app.use("/users", travelRouter);
  app.use("/users", userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
