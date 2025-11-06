import express from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user.model.js";
import Employee from "../models/employee.model.js";
import Card from "../models/card.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* -------------------- Validation Schemas -------------------- */

const registerSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9_\-]{3,30}$/).required(),
  name: Joi.string().pattern(/^[A-Za-z]{2,50}$/).required(),
  surname: Joi.string().pattern(/^[A-Za-z]{2,50}$/).required(),
  idNumber: Joi.string().pattern(/^(\d{13}|\d{9})$/).required(),
  cellNumber: Joi.string().pattern(/^(\+?\d{10,15})$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(/^[A-Za-z0-9!@#\$%\^&\*()_+\-=]{8,128}$/).required(),
  role: Joi.string().valid("customer", "employee", "admin").required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("customer", "employee", "admin").optional(),
});

/* -------------------- Helpers -------------------- */

// short-lived access token bound to user-agent
function createAccessToken(user, uaHash) {
  const payload = {
    id: user._id,
    role: user.role,
    username: user.username,
    email: user.email,
    ua: uaHash,
    jti: uuidv4(),
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
}

// long-lived refresh token stored hashed
async function createRefreshToken(userId, uaHash) {
  const raw = uuidv4() + "." + crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(
    Date.now() + (parseInt(process.env.REFRESH_TOKEN_DAYS || "30") * 86400000)
  );

  await RefreshToken.create({ tokenHash, userId, userAgentHash: uaHash, expiresAt });
  return raw;
}

/* -------------------- Register -------------------- */

router.post("/register", async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { username, name, surname, idNumber, cellNumber, email, password, role } = req.body;

    if (role === "admin" && !email.endsWith("@falconecipp.co.za"))
      return res.status(400).json({ error: "Admin email must be @falconecipp.co.za" });

    const existsCustomer = await User.findOne({ $or: [{ username }, { email }, { idNumber }] });
    const existsEmployee = await Employee.findOne({ $or: [{ username }, { email }, { idNumber }] });
    if (existsCustomer || existsEmployee)
      return res.status(400).json({ error: "Username, ID, or email already registered" });

    const newUser =
      role === "customer"
        ? await User.createUser(username, role, password, email, name, surname, idNumber, cellNumber)
        : await Employee.createEmployee(
            username,
            role,
            password,
            email,
            name,
            surname,
            idNumber,
            cellNumber
          );

    res.status(201).json({ message: "Registration successful", userId: newUser._id, role });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Login -------------------- */

router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let { email, password, role } = req.body;
    if (!role) role = "customer";

    const Model = role === "customer" ? User : Employee;
    const user = await Model.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const uaHash = crypto
      .createHash("sha256")
      .update(req.headers["user-agent"] || "")
      .digest("hex");

    const accessToken = createAccessToken(user, uaHash);
    const refreshTokenRaw = await createRefreshToken(user._id, uaHash);

    // Send refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshTokenRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: parseInt(process.env.REFRESH_TOKEN_DAYS || "30") * 86400000,
    });

    res.json({
      message: "Login successful",
      token: accessToken,
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        idNumber: user.idNumber,
        cellNumber: user.cellNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Token Refresh -------------------- */

router.post("/token", async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw) return res.status(401).json({ error: "Missing refresh token" });

    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const stored = await RefreshToken.findOne({ tokenHash, revoked: false });
    if (!stored) return res.status(401).json({ error: "Invalid or revoked refresh token" });
    if (Date.now() >= stored.expiresAt) return res.status(401).json({ error: "Refresh token expired" });

    const uaHash = crypto
      .createHash("sha256")
      .update(req.headers["user-agent"] || "")
      .digest("hex");
    if (stored.userAgentHash !== uaHash)
      return res.status(403).json({ error: "Refresh token binding mismatch" });

    const user = await User.findById(stored.userId) || (await Employee.findById(stored.userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    // rotate refresh token
    stored.revoked = true;
    await stored.save();
    const newRaw = await createRefreshToken(user._id, uaHash);

    res.cookie("refreshToken", newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: parseInt(process.env.REFRESH_TOKEN_DAYS || "30") * 86400000,
    });

    const newAccessToken = createAccessToken(user, uaHash);
    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Logout -------------------- */

router.post("/logout", auth, async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (raw) {
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
    }
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Get Authenticated User -------------------- */

router.get("/me", auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    const user =
      role === "customer"
        ? await User.findById(id).select("-passwordHash -salt -__v")
        : await Employee.findById(id).select("-passwordHash -salt -__v");
    if (!user) return res.status(404).json({ error: "User not found" });

    const cards =
      role === "customer" ? await Card.find({ userId: id }).select("-cvv -__v") : [];

    res.json({ ...user.toObject(), cards });
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
// (GeeksForGeeks, 2025).