// falcone-cipp-backend/src/config/security.js
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cors from "cors";

dotenv.config();

// ---------------------------
// CORS Configuration
// ---------------------------
const origins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",");

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests (e.g., Postman)
    if (origins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy violation"), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// ---------------------------
// Rate Limiting (DDoS / brute-force)
// ---------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                 // limit each IP
  standardHeaders: true,    // return rate limit info in headers
  legacyHeaders: false,     // disable X-RateLimit-* headers
  message: { error: "Too many requests, please try again later." },
});

// ---------------------------
// Helmet Configuration
// ---------------------------
const helmetOptions = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
    },
  },
  frameguard: { action: "deny" }, // prevent Clickjacking
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // enforce HTTPS
  crossOriginEmbedderPolicy: true,
});

// ---------------------------
// Input Sanitization
// ---------------------------
const sanitize = {
  mongoSanitize: mongoSanitize(), // prevent NoSQL injection
  xssClean: xss(),                // prevent XSS
};

// ---------------------------
// Exported Security Config
// ---------------------------
export default {
  corsOptions,
  limiter,
  helmetOptions,
  sanitize,
};
// (CodezUp, 2025).