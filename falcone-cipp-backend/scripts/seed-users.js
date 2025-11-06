import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import db from "../src/config/database.js";

(async function () {
  try {
    await mongoose.connect(db.mongoUri, db.options);
    console.log("MongoDB connected for seeding users...");

    const users = [
      { username: "alice", role: "customer", password: "CustPass123!" },
      { username: "bob", role: "employee", password: "EmpPass123!" },
      { username: "admin", role: "admin", password: "AdminPass123!" }
    ];

    for (const u of users) {
      const exist = await User.findOne({ username: u.username });
      if (exist) {
        console.log("skip", u.username);
        continue;
      }

      await User.createUser(u.username, u.role, u.password);
      console.log("created", u.username);
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
