import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import EmployeeRoutes from "../routes/employee.routes.js";
import Employee from "../models/employee.model.js";
import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import Card from "../models/card.model.js";

// 🧱 Mock middlewares
jest.mock("../middleware/auth.js", () => {
  const mongoose = require("mongoose");
  return (req, res, next) => {
    req.user = { id: new mongoose.Types.ObjectId().toString(), role: "employee" };
    next();
  };
});
jest.mock("../middleware/roles.js", () => (roles) => (req, res, next) => next());

// 🧱 Mock SWIFT service
jest.mock("../services/swiftQueue.js", () => ({
  sendToSwiftQueue: jest.fn().mockResolvedValue(true),
}));

const app = express();
app.use(express.json());
app.use("/api/employee", EmployeeRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Promise.all([
    Employee.deleteMany(),
    User.deleteMany(),
    Payment.deleteMany(),
    Card.deleteMany(),
  ]);
});

describe("Employee Routes", () => {
  /* -------------------- REGISTER -------------------- */
  it("should register a new employee", async () => {
    const res = await request(app).post("/api/employee/register").send({
      idNumber: "1234567890",
      name: "Jane",
      surname: "Doe",
      phone: "0712345678",
      username: "janedoe",
      email: "jane@example.com",
      password: "Pass123!",
      role: "employee",
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Employee registered successfully");
    expect(res.body.employee.email).toBe("jane@example.com");
  });

  it("should fail registration with invalid data", async () => {
    const res = await request(app).post("/api/employee/register").send({
      email: "invalidemail",
    });
    expect(res.status).toBe(400);
  });

  /* -------------------- LOGIN -------------------- */
  it("should login successfully", async () => {
    const employee = await Employee.createEmployee(
      "janedoe",
      "employee",
      "Pass123!",
      "jane@example.com",
      { idNumber: "123456", name: "Jane", surname: "Doe", phone: "0712345678" }
    );

    process.env.JWT_SECRET = "testsecret";

    const res = await request(app)
      .post("/api/employee/login")
      .send({ email: "jane@example.com", password: "Pass123!" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.token).toBeDefined();

    const decoded = jwt.verify(res.body.token, "testsecret");
    expect(decoded.id).toBe(employee._id.toString());
  });

  it("should reject invalid login", async () => {
    const res = await request(app)
      .post("/api/employee/login")
      .send({ email: "nonexistent@example.com", password: "wrong" });
    expect(res.status).toBe(400);
  });

  /* -------------------- ADD CUSTOMER -------------------- */
  it("should create a new customer", async () => {
    const res = await request(app).post("/api/employee/customers").send({
      idNumber: "CUST123",
      name: "Alice",
      surname: "Smith",
      phone: "0723456789",
      username: "alice",
      email: "alice@example.com",
      password: "Pass123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Customer created successfully");
    expect(res.body.customer.username).toBe("alice");
  });

  /* -------------------- PAYMENT REVIEW -------------------- */
  it("should list all payments", async () => {
    await Payment.create({
      fromUser: new mongoose.Types.ObjectId(),
      toAccount: "ABCDEFGH1234",
      currency: "USD",
      amount: 200,
    });
    const res = await request(app).get("/api/employee/payments");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should approve a payment and call SWIFT queue", async () => {
    const payment = await Payment.create({
      fromUser: new mongoose.Types.ObjectId(),
      toAccount: "ABCDEFGH1234",
      currency: "USD",
      amount: 100,
    });

    const res = await request(app)
      .post(`/api/employee/payments/${payment._id}/decision`)
      .send({ decision: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Payment approved");
  });

  it("should reject a payment", async () => {
    const payment = await Payment.create({
      fromUser: new mongoose.Types.ObjectId(),
      toAccount: "ABCDEFGH1234",
      currency: "USD",
      amount: 100,
    });

    const res = await request(app)
      .post(`/api/employee/payments/${payment._id}/decision`)
      .send({ decision: "rejected" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Payment rejected");
  });

  /* -------------------- USER MANAGEMENT -------------------- */
  it("should list all users", async () => {
    await User.createUser(
      "cust1",
      "customer",
      "Pass123!",
      "cust1@example.com",
      "Alice",
      "Brown",
      "123456",
      "0711111111"
    );

    const res = await request(app).get("/api/employee/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should get user details", async () => {
    const user = await User.createUser(
      "cust2",
      "customer",
      "Pass123!",
      "cust2@example.com",
      "John",
      "Smith",
      "987654",
      "0722222222"
    );
    const res = await request(app).get(`/api/employee/users/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("cust2");
  });

  it("should delete user without payments", async () => {
    const user = await User.createUser(
      "cust3",
      "customer",
      "Pass123!",
      "cust3@example.com",
      "Bob",
      "Lee",
      "456789",
      "0733333333"
    );

    const res = await request(app).delete(`/api/employee/users/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should not delete user with payment history", async () => {
    const user = await User.createUser(
      "cust4",
      "customer",
      "Pass123!",
      "cust4@example.com",
      "Kate",
      "Jones",
      "741852",
      "0744444444"
    );

    await Payment.create({ fromUser: user._id, toAccount: "ABCD123", amount: 100, currency: "USD" });

    const res = await request(app).delete(`/api/employee/users/${user._id}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Cannot delete user with payment history");
  });
});
