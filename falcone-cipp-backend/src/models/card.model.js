import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  cardHolder: {
    type: String,
    required: [true, "Card holder name is required"],
  },
  cardNumber: {
    type: String,
    required: [true, "Card number is required"],
    match: [/^\d{16}$/, "Card number must be 16 digits"],
  },
  expiry: {
    type: String,
    required: [true, "Expiry date is required"],
    match: [/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"],
  },
  cvv: {
    type: String,
    required: [true, "CVV is required"],
    match: [/^\d{3,4}$/, "CVV must be 3 or 4 digits"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const Card = mongoose.model("Card", cardSchema);
export default Card;
