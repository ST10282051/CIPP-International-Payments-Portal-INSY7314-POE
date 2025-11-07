import express from "express";
import request from "supertest";
import Joi from "joi";
import validate from "../middleware/validation.js"; // your validation middleware

const app = express();
app.use(express.json());

// Schema without extra 'body' wrapper
const sampleSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  age: Joi.number().integer().min(18).required(),
});

// Route for testing
app.post("/register", validate(sampleSchema), (req, res) => {
  res.json({ message: "Validation passed", data: req.body });
});

describe("Card Model Validation", () => {
  it("should pass valid data", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "john123", age: 25 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Validation passed");
    expect(res.body.data).toEqual({ username: "john123", age: 25 });
  });

  it("should fail when required field is missing", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "john123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/"age" is required/);
  });

  it("should fail when type is invalid", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "john123", age: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/"age" must be a number/);
  });

  it("should strip unknown keys", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "john123", age: 25, extra: "remove me" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ username: "john123", age: 25 });
  });
});
