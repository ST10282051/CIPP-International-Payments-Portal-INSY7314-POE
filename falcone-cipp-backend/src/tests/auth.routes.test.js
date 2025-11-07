import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "../routes/auth.routes.js";
import User from "../models/user.model.js";
import Employee from "../models/employee.model.js";
import RefreshToken from "../models/refreshToken.model.js";

// Mock environment variables
process.env.JWT_SECRET = "testsecret";
process.env.JWT_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_DAYS = "1";

// Setup Express app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
  await Employee.deleteMany();
  await RefreshToken.deleteMany();
});

describe("Auth Routes", () => {
  const customerData = {
    username: "john123",
    name: "John",
    surname: "Doe",
    idNumber: "1234567890123",
    cellNumber: "+27831234567",
    email: "john@example.com",
    password: "Password123!",
    role: "customer",
  };

  const employeeData = {
    username: "emp123",
    email: "emp@example.com",
    password: "Password123!",
    role: "employee",
  };

  it("registers a new customer", async () => {
    const res = await request(app).post("/api/auth/register").send(customerData);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Registration successful");
    expect(res.body.userId).toBeDefined();
    expect(res.body.role).toBe("customer");
  });

  it("prevents duplicate registration", async () => {
    await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    const res = await request(app).post("/api/auth/register").send(customerData);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/);
  });

  it("logs in a registered customer", async () => {
    await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    const res = await request(app)
      .post("/api/auth/login")
      .set("User-Agent", "jest-test-agent")
      .send({ email: customerData.email, password: customerData.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(customerData.email);
    expect(res.body.role).toBe("customer");
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken/);
  });

  it("blocks login with wrong password", async () => {
    await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: customerData.email, password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("refreshes a valid token", async () => {
    const user = await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    // Mock refresh token
    const rawToken = "test-refresh-token";
    const tokenHash = require("crypto").createHash("sha256").update(rawToken).digest("hex");
    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      userAgentHash: require("crypto")
        .createHash("sha256")
        .update("jest-agent")
        .digest("hex"),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const res = await request(app)
      .post("/api/auth/token")
      .set("User-Agent", "jest-agent")
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("logs out and revokes refresh token", async () => {
    const user = await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    const rawToken = "logout-token";
    const tokenHash = require("crypto").createHash("sha256").update(rawToken).digest("hex");
    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      userAgentHash: require("crypto")
        .createHash("sha256")
        .update("jest-agent")
        .digest("hex"),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    // Mock auth middleware
    app.use((req, res, next) => {
      req.user = { id: user._id, role: "customer" };
      next();
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refreshToken=${rawToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");

    const token = await RefreshToken.findOne({ tokenHash });
    expect(token.revoked).toBe(true);
  });

  it("fetches authenticated user data", async () => {
    const user = await User.createUser(
      customerData.username,
      customerData.role,
      customerData.password,
      customerData.email,
      customerData.name,
      customerData.surname,
      customerData.idNumber,
      customerData.cellNumber
    );

    // Mock auth middleware
    app.use((req, res, next) => {
      req.user = { id: user._id, role: "customer" };
      next();
    });

    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(customerData.email);
  });
});
