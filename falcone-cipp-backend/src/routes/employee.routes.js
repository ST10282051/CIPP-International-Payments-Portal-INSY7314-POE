import express from "express";
import jwt from "jsonwebtoken";
import Joi from "joi";
import auth from "../middleware/auth.js";
import Roles from "../middleware/roles.js";
import Employee from "../models/employee.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import Card from "../models/card.model.js";
import { sendToSwiftQueue } from "../services/swiftQueue.js"; 

const router = express.Router();

/* -------------------- Validation Schemas -------------------- */
const registerSchema = Joi.object({
  idNumber: Joi.string().alphanum().min(6).max(20).required(),
  name: Joi.string().min(2).max(50).required(),
  surname: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("employee", "admin").default("employee"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const decisionSchema = Joi.object({
  decision: Joi.string().valid("approved", "rejected").required(),
});

const addCustomerSchema = Joi.object({
  idNumber: Joi.string().alphanum().min(6).max(20).required(),
  name: Joi.string().min(2).max(50).required(),
  surname: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/* -------------------- Register Employee/Admin -------------------- */
router.post("/register", async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { idNumber, name, surname, phone, username, email, password, role } = req.body;
    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const newEmployee = await Employee.createEmployee(
      username,
      role,
      password,
      email,
      { idNumber, name, surname, phone }
    );

    res.status(201).json({
      message: "Employee registered successfully",
      employee: {
        id: newEmployee._id,
        idNumber: newEmployee.idNumber,
        name: newEmployee.name,
        surname: newEmployee.surname,
        phone: newEmployee.phone,
        username: newEmployee.username,
        email: newEmployee.email,
        role: newEmployee.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Login Employee/Admin -------------------- */
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        idNumber: employee.idNumber,
        name: employee.name,
        surname: employee.surname,
        phone: employee.phone,
        username: employee.username,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Add Customer -------------------- */
router.post("/customers", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const { error } = addCustomerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { idNumber, name, surname, phone, username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }, { idNumber }] });
    if (exists) return res.status(400).json({ error: "Customer already exists" });

    const newCustomer = await User.createUser(
      username,
      "customer",
      password,
      email,
      name,
      surname,
      idNumber,
      phone
    );

    res.status(201).json({
      message: "Customer created successfully",
      customer: {
        id: newCustomer._id,
        idNumber: newCustomer.idNumber,
        name: newCustomer.name,
        surname: newCustomer.surname,
        phone: newCustomer.cellNumber,
        username: newCustomer.username,
        email: newCustomer.email,
        role: newCustomer.role,
      },
    });
  } catch (err) {
    console.error("Add customer error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

/* -------------------- Payment Review -------------------- */
router.get("/payments", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("fromUser", "username email role")
      .populate("card", "cardHolder cardNumber expiryMonth expiryYear")
      .exec();

    res.json(payments);
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Approve / Reject Payment (SWIFT Integrated) -------------------- */
router.post("/payments/:id/decision", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const { error } = decisionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    payment.status = req.body.decision;
    payment.reviewedBy = req.user.id;
    payment.reviewedAt = new Date();
    await payment.save();

    // If approved, queue for SWIFT
    if (req.body.decision === "approved") {
      try {
        await sendToSwiftQueue(payment._id);
        console.log(`💳 Payment ${payment._id} queued for SWIFT processing`);
      } catch (queueErr) {
        console.error("SWIFT queue error:", queueErr);
      }
    }

    res.json({
      id: payment._id,
      status: payment.status,
      message:
        payment.status === "approved"
          ? "Payment approved and sent to SWIFT queue"
          : "Payment rejected",
    });
  } catch (err) {
    console.error("Decision update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- User Management -------------------- */
router.get("/users", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const users = await User.find()
      .select("username email name surname idNumber cellNumber phone role createdAt")
      .lean();

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const paymentCount = await Payment.countDocuments({ fromUser: user._id });
        const cardCount = await Card.countDocuments({ userId: user._id });
        return { ...user, paymentCount, cardCount };
      })
    );

    res.json(usersWithCounts);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users/:userId", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select("username email name surname idNumber cellNumber phone role createdAt")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const payments = await Payment.find({ fromUser: userId })
      .populate("card", "cardHolder cardNumber expiryMonth expiryYear")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const cards = await Card.find({ userId }).select("cardHolder cardNumber expiryMonth expiryYear createdAt").lean();
    const paymentCount = await Payment.countDocuments({ fromUser: userId });
    const cardCount = await Card.countDocuments({ userId });

    res.json({ ...user, payments, cards, paymentCount, cardCount });
  } catch (err) {
    console.error("Get user details error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/users/:userId", auth, Roles(["employee", "admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const paymentCount = await Payment.countDocuments({ fromUser: userId });
    if (paymentCount > 0)
      return res.status(400).json({ error: "Cannot delete user with payment history" });

    await Card.deleteMany({ userId });
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully", username: deletedUser.username });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
// (GeeksForGeeks, 2025).