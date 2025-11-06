import express from "express";
import Payment from "../models/payment.model.js";

const router = express.Router();

/**
 * SWIFT Webhook
 * Receives confirmation from SWIFT simulator/gateway.
 * Expects JSON: { swiftReference: string, status: "confirmed" | "failed", error?: string }
 */
router.post("/webhook", async (req, res) => {
  try {
    const { swiftReference, status, error } = req.body;
    if (!swiftReference || !status) {
      return res.status(400).json({ message: "swiftReference and status are required" });
    }

    // Find payment by swiftReference
    const payment = await Payment.findOne({ swiftReference });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Update SWIFT confirmation info
    payment.status = status === "confirmed" ? "confirmed" : "failed";
    payment.swiftStatus = status.toUpperCase();
    payment.swiftConfirmedAt = new Date();
    if (error) payment.swiftError = error;

    await payment.save();

    res.status(200).json({ message: "SWIFT status updated successfully" });
  } catch (err) {
    console.error("SWIFT webhook error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
// (SwiftOnServer, 2024).