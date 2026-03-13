import "dotenv/config";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import { userRouter } from "./modules/user/index.js";
import requestId from "./middlewares/request-id.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travel-trackr";

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(requestId);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.get("/", (_req, res) => res.redirect("/users/app"));
app.use("/users", userRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});