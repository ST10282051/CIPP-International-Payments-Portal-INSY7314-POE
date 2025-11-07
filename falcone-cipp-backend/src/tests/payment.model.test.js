import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Payment from "../models/payment.model.js";

// Dummy ObjectId generator
const ObjectId = mongoose.Types.ObjectId;

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
  await Payment.deleteMany();
});

describe("Payment Model", () => {
  it("creates a payment successfully with default status", async () => {
    const payment = await Payment.create({
      fromUser: new ObjectId(),
      card: new ObjectId(),
      toAccount: "123456789",
      currency: "USD",
      amount: 1000,
    });

    expect(payment.fromUser).toBeDefined();
    expect(payment.card).toBeDefined();
    expect(payment.toAccount).toBe("123456789");
    expect(payment.currency).toBe("USD");
    expect(payment.amount).toBe(1000);
    expect(payment.status).toBe("pending");
    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });

  it("allows specifying status and review metadata", async () => {
    const reviewerId = new ObjectId();
    const payment = await Payment.create({
      fromUser: new ObjectId(),
      card: new ObjectId(),
      toAccount: "987654321",
      currency: "EUR",
      amount: 500,
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    });

    expect(payment.status).toBe("approved");
    expect(payment.reviewedBy.toString()).toBe(reviewerId.toString());
    expect(payment.reviewedAt).toBeInstanceOf(Date);
  });

  it("auto-updates updatedAt on save", async () => {
    const payment = await Payment.create({
      fromUser: new ObjectId(),
      card: new ObjectId(),
      toAccount: "111222333",
      currency: "USD",
      amount: 200,
    });

    const oldUpdatedAt = payment.updatedAt;
    payment.amount = 300;
    await payment.save();

    expect(payment.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
  });

  it("fails when required fields are missing", async () => {
    await expect(Payment.create({})).rejects.toThrow();
  });

  it("enforces enum values for status", async () => {
    await expect(
      Payment.create({
        fromUser: new ObjectId(),
        card: new ObjectId(),
        toAccount: "444555666",
        currency: "USD",
        amount: 100,
        status: "invalid_status",
      })
    ).rejects.toThrow();
  });
});
