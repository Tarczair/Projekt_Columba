const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Brak dostępu" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Sesja wygasła" });

    const now = Math.floor(Date.now() / 1000);
    if (decoded.lastActivity && now - decoded.lastActivity > 3600) {
      return res
        .status(401)
        .json({ error: "Sesja wygasła z powodu braku aktywności" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = {
  verifyToken,
};
