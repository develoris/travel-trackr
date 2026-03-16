import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { UserRole } from "../modules/user/user.types.js";

const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    return next();
  };

export default authorize;
