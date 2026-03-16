import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers["x-request-id"];
  req.requestId =
    typeof incomingId === "string" ? incomingId : crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};

export default requestId;
