import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { MongoMemoryServer } from "mongodb-memory-server";
import multer from "multer";
import CustomerRoutes from "../routes/customer.routes.js";
import Card from "../models/card.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";

// Setup Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mock auth middleware
const authMiddleware = (role = "customer") => (req, res, next) => {
  req.user = { id: new mongoose.Types.ObjectId().toString(), role };
  next();
};
jest.mock("../middleware/auth.js", () => authMiddleware("customer"));

// Use customer routes
app.use("/api/customer", CustomerRoutes);

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
  await Card.deleteMany();
  await Payment.deleteMany();
  await User.deleteMany();
});

describe("Customer Routes", () => {
  let user;

  beforeEach(async () => {
    user = await User.createUser(
      "john123",
      "customer",
      "Password123!",
      "john@example.com",
      "John",
      "Doe",
      "1234567890123",
      "+27123456789"
    );
  });

  /* -------------------- Cards -------------------- */
  it("adds a new card", async () => {
    const cardData = {
      cardNumber: "4111111111111111",
      cardHolder: "John Doe",
      expiryMonth: 12,
      expiryYear: new Date().getFullYear() + 1,
      cvv: "123",
    };
    const res = await request(app).post("/api/customer/cards").send(cardData);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Card added successfully");
    expect(res.body.card.cardHolder).toBe(cardData.cardHolder);
  });

  it("lists all customer cards", async () => {
    await new Card({ ...{ cardNumber: "4111111111111111", cardHolder: "John Doe", expiryMonth: 12, expiryYear: 2030, cvv: "123" }, userId: user._id }).save();
    const res = await request(app).get("/api/customer/cards");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cardHolder).toBe("John Doe");
  });

  it("deletes a card", async () => {
    const card = await new Card({ cardNumber: "4111111111111111", cardHolder: "John Doe", expiryMonth: 12, expiryYear: 2030, cvv: "123", userId: user._id }).save();
    const res = await request(app).delete(`/api/customer/cards/${card._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Card deleted successfully");
  });

  /* -------------------- Payments -------------------- */
  it("creates a payment with new card", async () => {
    const paymentData = {
      toAccount: "ABCDEFGH12345678",
      currency: "USD",
      amount: 100,
      newCard: {
        cardNumber: "4111111111111111",
        cardHolder: "John Doe",
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 1,
        cvv: "123",
      },
    };
    const res = await request(app).post("/api/customer/payments").send(paymentData);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.cardName).toBe("John Doe");
  });

  it("lists all payments for customer", async () => {
    const card = await new Card({ cardNumber: "4111111111111111", cardHolder: "John Doe", expiryMonth: 12, expiryYear: 2030, cvv: "123", userId: user._id }).save();
    await new Payment({ fromUser: user._id, toAccount: "ABCDEFGH12345678", currency: "USD", amount: 100, card: card._id }).save();

    const res = await request(app).get("/api/customer/payments");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].card.cardHolder).toBe("John Doe");
  });

  /* -------------------- Profile -------------------- */
  it("fetches customer profile", async () => {
    const res = await request(app).get("/api/customer/profile");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("john123");
    expect(res.body.role).toBe("customer");
  });

  it("updates customer profile", async () => {
    const res = await request(app).put("/api/customer/profile").send({ name: "Johnny", phone: "0712345678" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile updated successfully");
    expect(res.body.user.name).toBe("Johnny");
    expect(res.body.user.phone).toBe("0712345678");
  });
});
