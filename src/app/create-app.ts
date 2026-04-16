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

const resolveRequiredEnv = (
  envName: string,
  isProduction: boolean,
  developmentFallback: string
): string => {
  const value = process.env[envName]?.trim();
  if (value) return value;
  if (isProduction) {
    throw new Error(`[config] Missing required environment variable: ${envName}`);
  }
  return developmentFallback;
};

const resolveSessionCookieSecure = (
  isProduction: boolean
): boolean | "auto" => {
  const rawValue = (process.env.SESSION_COOKIE_SECURE || "").trim().toLowerCase();
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  return isProduction ? "auto" : false;
};

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
  const configuredBasePath = normalizeBasePath(process.env.APP_BASE_PATH);
  const cookieSecure = resolveSessionCookieSecure(isProduction);
  const sessionSecret = resolveRequiredEnv(
    "SESSION_SECRET",
    isProduction,
    "dev-session-secret"
  );
  const corsOrigin = resolveRequiredEnv(
    "CORS_ORIGIN",
    isProduction,
    "http://localhost:5173"
  );

  // Required behind reverse proxy so req.secure and forwarded headers are handled correctly.
  app.set("trust proxy", 1);

  const resolvedSessionStore =
    sessionStore ||
    MongoStore.create({
      mongoUrl,
      ttl: 60 * 60 * 24 * 30
    });

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(requestId);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const headerPrefix = req.header("x-forwarded-prefix");
    const requestBasePath = normalizeBasePath(headerPrefix || configuredBasePath);

    const originalRedirect = res.redirect.bind(res);
    const patchedRedirect: typeof res.redirect = ((
      statusOrUrl: number | string,
      maybeUrl?: string
    ) => {
      if (typeof statusOrUrl === "number") {
        return originalRedirect(
          statusOrUrl,
          prefixBasePath(maybeUrl || "/", requestBasePath)
        );
      }
      return originalRedirect(prefixBasePath(statusOrUrl, requestBasePath));
    }) as typeof res.redirect;

    res.redirect = patchedRedirect;

    const originalSend = res.send.bind(res);
    const patchedSend: typeof res.send = ((body?: unknown) => {
      const contentType = res.getHeader("Content-Type")?.toString() || "";
      if (typeof body === "string" && contentType.includes("text/html")) {
        return originalSend(rewriteHtmlAbsoluteUrls(body, requestBasePath));
      }
      return originalSend(body as never);
    }) as typeof res.send;

    res.send = patchedSend;
    res.locals.basePath = requestBasePath;
    next();
  });

  const setCurrentPath: RequestHandler = (req, res, next) => {
    res.locals.currentPath = req.path;
    if (typeof res.locals.basePath === "undefined") {
      res.locals.basePath = configuredBasePath;
    }
    next();
  };
  app.use(setCurrentPath);

  app.use(
    session({
      name: "tt.sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: resolvedSessionStore,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
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
