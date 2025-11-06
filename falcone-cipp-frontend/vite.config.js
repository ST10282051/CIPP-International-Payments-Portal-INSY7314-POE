import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

const isDev = process.env.NODE_ENV !== "production";

// Resolve SSL cert paths
const keyPath = path.resolve(process.env.SSL_KEY_PATH || "./cert/localhost.key");
const certPath = path.resolve(process.env.SSL_CERT_PATH || "./cert/localhost.crt");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: isDev && fs.existsSync(keyPath) && fs.existsSync(certPath)
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : false,
  },
});
// (GeeksForGeeks, 2025).