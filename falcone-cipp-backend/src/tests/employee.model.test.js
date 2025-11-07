import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import Employee from "../models/employee.model.js";

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
  await Employee.deleteMany();
});

describe("Employee Model", () => {
  it("creates an employee successfully", async () => {
    const emp = await Employee.createEmployee(
      "admin123",
      "admin",
      "password123",
      "admin@example.com"
    );

    expect(emp.username).toBe("admin123");
    expect(emp.email).toBe("admin@example.com");
    expect(emp.role).toBe("admin");
    expect(emp.passwordHash).toBeDefined();
    expect(emp.salt).toBeDefined();
  });

  it("defaults role to employee if not provided", async () => {
    const emp = await Employee.createEmployee(
      "employee123",
      undefined,
      "password123",
      "employee@example.com"
    );

    expect(emp.role).toBe("employee");
  });

  it("throws validation error for invalid username", async () => {
    await expect(
      Employee.createEmployee(
        "ab", // too short
        "employee",
        "password123",
        "user@example.com"
      )
    ).rejects.toThrow();
  });

  it("throws validation error for invalid email", async () => {
    await expect(
      Employee.createEmployee(
        "user123",
        "employee",
        "password123",
        "invalidemail"
      )
    ).rejects.toThrow();
  });

  it("compares passwords correctly", async () => {
    const emp = await Employee.createEmployee(
      "user123",
      "employee",
      "mypassword",
      "user@example.com"
    );

    const match = await emp.comparePassword("mypassword");
    const mismatch = await emp.comparePassword("wrongpassword");

    expect(match).toBe(true);
    expect(mismatch).toBe(false);
  });
});
