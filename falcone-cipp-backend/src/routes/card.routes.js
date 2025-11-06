import express from "express";
import Joi from "joi";
import auth from "../middleware/auth.js";
import Card from "../models/card.model.js";

const router = express.Router();

/* -------------------- Validation -------------------- */
const cardSchema = Joi.object({
  cardNumber: Joi.string().pattern(/^[0-9]{13,19}$/).required(),
  cardHolder: Joi.string().min(3).max(50).required(),
  expiryMonth: Joi.number().min(1).max(12).required(),
  expiryYear: Joi.number().min(new Date().getFullYear()).max(2100).required(),
  cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
});

/* -------------------- Routes -------------------- */

// Add new card
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Forbidden" });

  const { error } = cardSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const card = new Card({ ...req.body, userId: req.user.id });
    await card.save();
    res.status(201).json({ message: "Card added successfully", card: card.safeData() });
  } catch (err) {
    console.error("Add card error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// List all customer's cards
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Forbidden" });

  try {
    const cards = await Card.find({ userId: req.user.id });
    res.json(cards.map(c => c.safeData()));
  } catch (err) {
    console.error("Get cards error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a card
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Forbidden" });

  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!card) return res.status(404).json({ error: "Card not found" });

    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error("Delete card error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
// (GeeksForGeeks, 2025).