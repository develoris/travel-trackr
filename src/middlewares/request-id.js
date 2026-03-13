import crypto from "crypto";

const requestId = (req, res, next) => {
  const incomingId = req.headers["x-request-id"];
  req.requestId = incomingId || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};

export default requestId;
