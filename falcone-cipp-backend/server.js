import https from "https";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import morgan from "morgan";
import winston from "winston";
import connectDB from "./src/config/database.js";

// ROUTES
import authRoutes from "./src/routes/auth.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";
import cardRoutes from "./src/routes/card.routes.js";
import swiftRoutes from "./src/routes/swift.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();
const app = express();

// ---------------------------
// LOGGER
// ---------------------------
const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.File({ filename: "logs/security.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

// ---------------------------
// SECURITY MIDDLEWARE
// ---------------------------
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  })
);
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(helmet.frameguard({ action: "deny" }));
app.use(mongoSanitize());
app.use(xssClean());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------------
// RATE LIMITING
// ---------------------------
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ error: "Too many requests. Please try again later." }),
});
app.use("/api", limiter);

// ---------------------------
// CORS (including preflight)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGINS.split(",");
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---------------------------
// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customers/cards", cardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/swift", swiftRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------------------------
// HEALTH CHECK
app.get("/", (req, res) => res.send("✅ Falcone backend running"));
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", env: process.env.NODE_ENV })
);

// ---------------------------
// 404 & GLOBAL ERROR HANDLER
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ---------------------------
// HTTPS STARTUP
const PORT = process.env.PORT || 8443;
const keyPath = path.resolve(process.env.SSL_KEY_PATH);
const certPath = path.resolve(process.env.SSL_CERT_PATH);

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error("❌ SSL certificates not found. Server cannot start securely.");
  process.exit(1);
}

const sslOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  minVersion: "TLSv1.2",
  ciphers: [
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "TLS_AES_128_GCM_SHA256",
  ].join(":"),
  honorCipherOrder: true,
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`✅ HTTPS server running securely on https://localhost:${PORT}`);
});
// (GeeksForGeeks, 2025).