import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { MongoMemoryServer } from "mongodb-memory-server";
import CardRoutes from "../routes/card.routes.js";
import Card from "../models/card.model.js";

// Setup Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mock auth middleware
const authMiddleware = (role = "customer") => (req, res, next) => {
  req.user = { id: new mongoose.Types.ObjectId().toString(), role };
  next();
};

// Override auth with our mock
jest.mock("../middleware/auth.js", () => authMiddleware("customer"));

app.use("/api/cards", CardRoutes);

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
  await Card.deleteMany();
});

describe("Card Routes", () => {
  const cardData = {
    cardNumber: "4111111111111111",
    cardHolder: "John Doe",
    expiryMonth: 12,
    expiryYear: new Date().getFullYear() + 1,
    cvv: "123",
  };

  it("adds a new card", async () => {
    const res = await request(app).post("/api/cards").send(cardData);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Card added successfully");
    expect(res.body.card.cardNumber).toBe(cardData.cardNumber.slice(-4)); // safeData masks number
  });

  it("blocks adding card with invalid data", async () => {
    const res = await request(app).post("/api/cards").send({ ...cardData, cvv: "12" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/"cvv" with value "12" fails pattern/);
  });

  it("lists all cards for a customer", async () => {
    // Add two cards
    const card1 = new Card({ ...cardData, userId: "user123" });
    const card2 = new Card({ ...cardData, cardNumber: "5555555555554444", userId: "user123" });
    await card1.save();
    await card2.save();

    // Mock user ID to match
    jest.spyOn(require("../middleware/auth.js"), "default").mockImplementation((req, res, next) => {
      req.user = { id: "user123", role: "customer" };
      next();
    });

    const res = await request(app).get("/api/cards");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].cardNumber).toBe(cardData.cardNumber.slice(-4));
  });

  it("deletes a card", async () => {
    const card = new Card({ ...cardData, userId: "user123" });
    await card.save();

    // Mock user ID to match
    jest.spyOn(require("../middleware/auth.js"), "default").mockImplementation((req, res, next) => {
      req.user = { id: "user123", role: "customer" };
      next();
    });

    const res = await request(app).delete(`/api/cards/${card._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Card deleted successfully");

    const dbCard = await Card.findById(card._id);
    expect(dbCard).toBeNull();
  });

  it("blocks access for non-customer roles", async () => {
    jest.spyOn(require("../middleware/auth.js"), "default").mockImplementation((req, res, next) => {
      req.user = { id: "user123", role: "employee" };
      next();
    });

    let res = await request(app).post("/api/cards").send(cardData);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");

    res = await request(app).get("/api/cards");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});
