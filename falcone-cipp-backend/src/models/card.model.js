import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardNumber: { type: String, required: true },
  cardHolder: { type: String, required: true },
  expiryMonth: { type: Number, required: true, min: 1, max: 12 },
  expiryYear: { type: Number, required: true },
  cvv: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Mask card number for output
cardSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.cardNumber = obj.cardNumber.replace(/\d(?=\d{4})/g, "*");
  obj.cvv = undefined; // never return CVV
  return obj;
};

export default mongoose.model("Card", cardSchema);
// (The Pi Guy Blog, n.d.). 