import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getUserById } from "../modules/user/user.service.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev-access-secret";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token mancante" });
  }

  const accessToken = authHeader.slice(7);
  let decoded;

  try {
    decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
  } catch (_error) {
    return res.status(401).json({ message: "Token non valido o scaduto" });
  }

  const user = await getUserById(decoded.sub);

  if (!user || !user.auth?.accessTokenHash) {
    return res.status(401).json({ message: "Sessione non valida" });
  }

  if (user.auth.accessTokenHash !== hashToken(accessToken)) {
    return res.status(401).json({ message: "Token non valido" });
  }

  req.user = user;
  return next();
};

export default authenticate;
