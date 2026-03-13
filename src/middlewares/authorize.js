const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    return next();
  };
};

export default authorize;
