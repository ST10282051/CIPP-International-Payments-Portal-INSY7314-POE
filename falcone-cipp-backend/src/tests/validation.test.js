import express from "express";
import request from "supertest";
import Joi from "joi";
import validation from "../middleware/validation.js";

const app = express();
app.use(express.json());

// ✅ Define schema wrapped with .body (matches your middleware)
const schema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    age: Joi.number().min(18).required(),
  }),
});

// ✅ Apply middleware to a test route
app.post("/validate", validation(schema), (req, res) => {
  res.json({ success: true });
});

describe("🧩 Validation Middleware Tests", () => {
  it("✅ should pass when valid data is provided", async () => {
    const res = await request(app)
      .post("/validate")
      .send({ username: "john_doe", age: 25 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("❌ should fail when 'age' is missing", async () => {
    const res = await request(app)
      .post("/validate")
      .send({ username: "john_doe" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/"age" is required/);
  });

  it("❌ should fail when 'username' is too short", async () => {
    const res = await request(app)
      .post("/validate")
      .send({ username: "jo", age: 20 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/"username" length must be at least/);
  });

  it("❌ should fail when 'age' is below minimum", async () => {
    const res = await request(app)
      .post("/validate")
      .send({ username: "john_doe", age: 16 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/"age" must be greater than or equal to 18/);
  });

  it("⚠️ should return 500 if validation middleware throws unexpected error", async () => {
    // Mock Joi to throw an error intentionally
    const badSchema = { validate: () => { throw new Error("Unexpected crash"); } };

    const badApp = express();
    badApp.use(express.json());
    badApp.post("/validate", validation(badSchema), (req, res) => res.json({ ok: true }));

    const res = await request(badApp)
      .post("/validate")
      .send({ username: "john_doe", age: 25 });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Validation middleware failed");
  });
});
