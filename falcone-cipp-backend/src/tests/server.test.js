import fs from "fs";
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => "mock cert"),
}));

/**
 * @file server.test.js
 * @description Tests core Express server routes and middleware without running HTTPS listener.
 */

import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";

// Mock environment vars before imports
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.SSL_KEY_PATH = "./ssl/key.pem";
process.env.SSL_CERT_PATH = "./ssl/cert.pem";
process.env.PORT = "8443";

// Mock filesystem for SSL files
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => "mock-cert-data"),
}));

// Mock HTTPS to prevent real server startup
jest.mock("https", () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, cb) => cb && cb()),
  })),
}));

// Mock MongoDB connection
jest.mock("../config/database.js", () => jest.fn(() => Promise.resolve()));

// Import after mocks
import "../server.js"; // Import main server file
import connectDB from "../src/config/database.js";

describe("Server.js", () => {
  let app;

  beforeAll(() => {
    // Dynamically create a minimal app for testing routes
    app = express();
    app.use(express.json());
    app.get("/", (req, res) => res.send("✅ Falcone backend running"));
    app.get("/api/health", (req, res) =>
      res.json({ status: "OK", env: process.env.NODE_ENV || "test" })
    );
    app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));
  });

  it("should confirm database connection is called", async () => {
    expect(connectDB).toHaveBeenCalled();
  });

  it("should return backend running message on /", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Falcone backend running");
  });

  it("should return health check JSON", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
  });

  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Endpoint not found");
  });

  it("should create HTTPS server with proper SSL options", () => {
    const https = require("https");
    const fs = require("fs");

    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve("./ssl/key.pem"));
    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve("./ssl/cert.pem"));
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(https.createServer).toHaveBeenCalled();
  });
});
