import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  toAccount: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },

  /* -------------------- Workflow Status -------------------- */
  status: {
    type: String,
    enum: [
      "pending",   // created by customer
      "approved",  // approved by employee
      "rejected",  // rejected by employee
      "queued",    // sent to SWIFT queue
      "sent",      // delivered to SWIFT
      "failed",    // failed delivery
      "confirmed", // acknowledged by SWIFT
    ],
    default: "pending",
  },

  /* -------------------- Employee Review Metadata -------------------- */
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null,
  },
  reviewedAt: { type: Date, default: null },

  /* -------------------- SWIFT Tracking Fields -------------------- */
  swiftReference: { type: String, default: null },   
  swiftStatus: { type: String, default: null },    
  swiftSentAt: { type: Date, default: null },
  swiftConfirmedAt: { type: Date, default: null },
  swiftError: { type: String, default: null },

  /* -------------------- Security & Audit -------------------- */
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update timestamps
paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Payment", paymentSchema);
// (The Pi Guy Blog, n.d.). 