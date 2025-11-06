import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_]{3,30}$/,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    match: /^[a-zA-Z]{2,50}$/,
  },
  surname: {
    type: String,
    required: true,
    trim: true,
    match: /^[a-zA-Z]{2,50}$/,
  },
  idNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^(\d{13}|\d{9})$/, // supports SA ID (13 digits) or SSN (9 digits)
  },
  cellNumber: {
    type: String,
    required: true,
    match: /^(\+?\d{10,15})$/, // allows +countrycode and up to 15 digits
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  role: {
    type: String,
    enum: ["customer", "employee", "admin"],
    default: "customer",
  },
  createdAt: { type: Date, default: Date.now },
});

/* -------------------- Static Helper to Create User -------------------- */
userSchema.statics.createUser = async function (
  username,
  role,
  password,
  email,
  name,
  surname,
  idNumber,
  cellNumber
) {
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "12", 10);
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);

  const user = new this({
    username,
    name,
    surname,
    idNumber,
    cellNumber,
    role,
    email,
    passwordHash: hash,
    salt,
  });

  return user.save();
};

/* -------------------- Instance Method to Compare Password -------------------- */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", userSchema);
// (The Pi Guy Blog, n.d.). 