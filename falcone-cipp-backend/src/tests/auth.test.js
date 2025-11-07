// src/tests/auth.test.js
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import auth from "../middleware/auth.js";
import RefreshToken from "../models/refreshToken.model.js";

// Mock RefreshToken model
jest.mock("../models/refreshToken.model.js");

const app = express();
app.get("/protected", auth, (req, res) => {
  res.json({ user: req.user });
});

describe("Auth Middleware", () => {
  const user = { id: "123", username: "john", email: "john@example.com" };
  const secret = process.env.JWT_SECRET || "testsecret";
  const jtiToken = jwt.sign({ ...user, jti: "token123" }, secret, { expiresIn: "1h" });

  beforeEach(() => {
    jest.clearAllMocks();
    RefreshToken.findOne.mockResolvedValue({ userId: "123", revoked: false });
  });

  it("blocks requests without Authorization header", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authorization header missing");
  });

  it("blocks requests with missing token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token missing");
  });

  it("blocks requests with invalid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("blocks requests with expired token", async () => {
    const expiredToken = jwt.sign({ ...user }, secret, { expiresIn: -1 });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token expired");
  });

  it("blocks requests when token binding mismatch", async () => {
    // Token was created with a different UA hash
    const uaHash = crypto.createHash("sha256").update("original-agent").digest("hex");
    const tokenWithUA = jwt.sign({ ...user, ua: uaHash }, secret, { expiresIn: "1h" });

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${tokenWithUA}`)
      .set("User-Agent", "jest-test"); // intentionally mismatch

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Token binding mismatch");
  });

  it("blocks requests if session is revoked", async () => {
    RefreshToken.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${jtiToken}`)
      .set("User-Agent", "jest-test");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Session revoked");
  });

  it("allows requests with valid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${jtiToken}`)
      .set("User-Agent", "jest-test");

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
  });

  it("defaults role to customer if not provided", async () => {
    const tokenWithoutRole = jwt.sign({ id: "456" }, secret, { expiresIn: "1h" });
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${tokenWithoutRole}`)
      .set("User-Agent", "jest-test");

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("customer");
  });
});
// (The Pi Guy Blog, n.d.).