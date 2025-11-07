import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/user.model.js";

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
});

describe("User Model", () => {
  it("creates a user successfully", async () => {
    const user = await User.createUser(
      "john123",
      "customer",
      "password123",
      "john@example.com",
      "John",
      "Doe",
      "1234567890123",
      "+27821234567"
    );

    expect(user.username).toBe("john123");
    expect(user.role).toBe("customer");
    expect(user.email).toBe("john@example.com");
    expect(user.name).toBe("John");
    expect(user.surname).toBe("Doe");
    expect(user.idNumber).toBe("1234567890123");
    expect(user.cellNumber).toBe("+27821234567");
    expect(user.passwordHash).toBeDefined();
    expect(user.salt).toBeDefined();
  });

  it("throws validation error for invalid username", async () => {
    await expect(
      User.createUser(
        "jo", // too short
        "customer",
        "password123",
        "john@example.com",
        "John",
        "Doe",
        "1234567890123",
        "+27821234567"
      )
    ).rejects.toThrow();
  });

  it("throws validation error for invalid email", async () => {
    await expect(
      User.createUser(
        "john123",
        "customer",
        "password123",
        "invalidemail",
        "John",
        "Doe",
        "1234567890123",
        "+27821234567"
      )
    ).rejects.toThrow();
  });

  it("compares passwords correctly", async () => {
    const user = await User.createUser(
      "john123",
      "customer",
      "password123",
      "john@example.com",
      "John",
      "Doe",
      "1234567890123",
      "+27821234567"
    );

    const isMatch = await user.comparePassword("password123");
    const isMismatch = await user.comparePassword("wrongpass");

    expect(isMatch).toBe(true);
    expect(isMismatch).toBe(false);
  });

  it("defaults role to customer if not provided", async () => {
    const user = await User.createUser(
      "jane123",
      undefined, // role omitted
      "password123",
      "jane@example.com",
      "Jane",
      "Smith",
      "1234567890123",
      "+27821234568"
    );

    expect(user.role).toBe("customer");
  });
});
