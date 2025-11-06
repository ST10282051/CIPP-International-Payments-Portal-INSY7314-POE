import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employeeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_\-]{3,30}$/, // allow letters, numbers, underscore, dash
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // basic email regex
  },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  role: {
    type: String,
    enum: ["employee", "admin"],
    required: true,
    default: "employee",
  },
  createdAt: { type: Date, default: Date.now },
});

// --- Static helper to create a new employee/admin ---
employeeSchema.statics.createEmployee = async function (username, role, password, email) {
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "12", 10);
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);

  const employee = new this({
    username,
    role,
    email,
    passwordHash: hash,
    salt,
  });

  return employee.save();
};

// --- Instance method to compare password ---
employeeSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("Employee", employeeSchema);
// (The Pi Guy Blog, n.d.). 