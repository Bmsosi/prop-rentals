import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  try {
    const header = req.header("Authorization") || "";
    const [, token] = header.split(" ");

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.userId, role: decoded.role };

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
