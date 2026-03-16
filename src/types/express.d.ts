import type { UserDocument, UserRole, WebSessionUser } from "../modules/user/user.types.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: UserDocument;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    webUser?: WebSessionUser;
    flash?: { [key: string]: string } | null;
  }
}
