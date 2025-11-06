import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/refreshToken.model.js";

/**
 * Authentication middleware
 * Verifies JWT, checks UA binding, and attaches user data to req.user
 */
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header missing" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) return res.status(401).json({ error: "Token missing" });

    // Verify access token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return res.status(401).json({ error: "Token expired" });
      return res.status(401).json({ error: "Invalid token" });
    }

    // Verify token binding (user-agent)
    const uaHash = crypto
      .createHash("sha256")
      .update(req.headers["user-agent"] || "")
      .digest("hex");

    if (decoded.ua && decoded.ua !== uaHash) {
      return res.status(403).json({ error: "Token binding mismatch" });
    }

  
    if (decoded.jti) {
      const existing = await RefreshToken.findOne({
        userId: decoded.id,
        revoked: false,
      }).lean();
      if (!existing) return res.status(401).json({ error: "Session revoked" });
    }

    // Attach validated user info
    req.user = {
      id: decoded.id,
      role: decoded.role || "customer",
      username: decoded.username || null,
      email: decoded.email || null,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ error: "Authentication failed" });
  }
}
// (w3Schools, n.d.).