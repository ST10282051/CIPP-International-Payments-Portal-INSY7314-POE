import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, index: true }, // SHA256 hash of the raw token
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  userAgentHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  replacedByHash: { type: String, default: null }, // points to replacement token if rotated
});

// derived property to check expiration
refreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expiresAt;
});

export default mongoose.model("RefreshToken", refreshTokenSchema);
// (Polat, 2025).