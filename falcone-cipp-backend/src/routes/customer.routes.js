import express from "express";
import Joi from "joi";
import path from "path";
import fs from "fs";
import multer from "multer";
import auth from "../middleware/auth.js";
import Roles from "../middleware/roles.js";
import Payment from "../models/payment.model.js";
import Card from "../models/card.model.js";
import User from "../models/user.model.js";

const router = express.Router();

/* -------------------- Multer Setup -------------------- */

// Ensure upload folder exists
const uploadDir = path.join(process.cwd(), "uploads/profile-pictures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

//DoS vulneribility detected - export const upload = multer({ storage });
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Optional: restrict file types
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

/* -------------------- Validation Schemas -------------------- */
const cardSchema = Joi.object({
  cardNumber: Joi.string().pattern(/^[0-9]{13,19}$/).required(),
  cardHolder: Joi.string().min(3).max(50).required(),
  expiryMonth: Joi.number().min(1).max(12).required(),
  expiryYear: Joi.number().min(new Date().getFullYear()).max(2100).required(),
  cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
});

const paymentSchema = Joi.object({
  toAccount: Joi.string().pattern(/^[A-Z0-9]{8,34}$/).required(),
  currency: Joi.string().pattern(/^[A-Z]{3}$/).required(),
  amount: Joi.number().greater(0).required(),
  cardId: Joi.string().optional(),
  newCard: Joi.object({
    cardNumber: Joi.string().pattern(/^[0-9]{13,19}$/).required(),
    cardHolder: Joi.string().pattern(/^[a-zA-Z ]{2,50}$/).required(),
    expiryMonth: Joi.number().min(1).max(12).required(),
    expiryYear: Joi.number().min(new Date().getFullYear()).max(2100).required(),
    cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
  }).optional(),
});

const profileUpdateSchema = Joi.object({
  idNumber: Joi.string().alphanum().min(6).max(20).optional(),
  name: Joi.string().min(2).max(50).optional(),
  surname: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  email: Joi.string().email().optional(),
});

/* -------------------- Card Routes -------------------- */
// Add new card
router.post("/cards", auth, Roles(["customer"]), async (req, res) => {
  const { error } = cardSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const card = new Card({ ...req.body, userId: req.user.id });
    await card.save();
    res.status(201).json({ message: "Card added successfully", card });
  } catch (err) {
    console.error("Add card error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get customer's cards
router.get("/cards", auth, Roles(["customer"]), async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id }).select(
      "cardHolder cardNumber expiryMonth expiryYear"
    );
    res.json(cards);
  } catch (err) {
    console.error("Get cards error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete card
router.delete("/cards/:id", auth, Roles(["customer"]), async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error("Delete card error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Payment Routes -------------------- */
// Create a new payment
router.post("/payments", auth, Roles(["customer"]), async (req, res) => {
  try {
    const { error } = paymentSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { cardId, newCard, toAccount, currency, amount } = req.body;
    let cardUsed;

    if (cardId) {
      cardUsed = await Card.findOne({ _id: cardId, userId: req.user.id });
      if (!cardUsed) return res.status(404).json({ error: "Card not found" });
    } else if (newCard) {
      cardUsed = new Card({ ...newCard, userId: req.user.id });
      await cardUsed.save();
    } else {
      return res.status(400).json({ error: "No card provided" });
    }

    const payment = new Payment({
      fromUser: req.user.id,
      toAccount,
      currency,
      amount,
      card: cardUsed._id,
    });

    await payment.save();

    res.status(201).json({
      id: payment._id,
      status: payment.status,
      cardName: cardUsed.cardHolder,
    });
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all payments for the logged-in customer
router.get("/payments", auth, Roles(["customer"]), async (req, res) => {
  try {
    const payments = await Payment.find({ fromUser: req.user.id })
      .populate("card", "cardHolder cardNumber expiryMonth expiryYear")
      .populate("fromUser", "username email role")
      .exec();
    res.json(payments);
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------- Profile Management -------------------- */
// Get customer profile
router.get("/profile", auth, Roles(["customer"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "username email idNumber name surname phone role profilePicture createdAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update customer profile (with optional profile picture)
router.put(
  "/profile",
  auth,
  Roles(["customer"]),
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { error } = profileUpdateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const updateData = { ...req.body };
      if (req.file) {
        updateData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("username email idNumber name surname phone role profilePicture createdAt");

      if (!updatedUser) return res.status(404).json({ error: "User not found" });

      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
// (GeeksForGeeks, 2025).