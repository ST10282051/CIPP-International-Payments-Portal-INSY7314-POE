import express from "express"; 
import compression from "compression";
import security from "./config/security.js";
import cors from "cors";  

import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import cardRoutes from "./routes/card.routes.js";
import swiftRoutes from "./routes/swift.routes.js"; 

const app = express();

// ---------------------------
// Apply Security Middleware
// ---------------------------
app.use(security.helmetOptions);
app.use(cors(security.corsOptions));
app.use(security.sanitize.mongoSanitize);
app.use(security.sanitize.xssClean);
app.use(security.limiter);

// ---------------------------
// Limit Content-Length for uploads
// ---------------------------
app.use((req, res, next) => {
  const maxBytes = 5 * 1024 * 1024;
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > maxBytes) {
    return res.status(413).json({ error: "Payload too large" });
  }
  next();
});

// ---------------------------
// Body parser & compression
// ---------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// ---------------------------
// Routes
// ---------------------------
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/customers/cards", cardRoutes);
app.use("/api/swift", swiftRoutes); 

// ---------------------------
// Health check & 404
// ---------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// ---------------------------
// Global Error Handler
// ---------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
// (w3Schools, n.d.).