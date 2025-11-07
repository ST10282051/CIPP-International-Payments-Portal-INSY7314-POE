// src/tests/roles.test.js
import express from "express";
import request from "supertest";
import Roles from "../middleware/roles.js";

const app = express();

// Dummy middleware to mock authentication
const mockAuth = (role) => (req, res, next) => {
  req.user = role ? { role } : null;
  next();
};

// Protected routes
app.get("/admin", mockAuth(), Roles(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

app.get("/customer", mockAuth(), Roles(["customer", "admin"]), (req, res) => {
  res.json({ message: "Welcome Customer!" });
});

describe("Roles Middleware", () => {
  it("blocks access if user is not authenticated", async () => {
    const res = await request(app).get("/admin");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not authenticated");
  });

  it("blocks access if user's role is not allowed", async () => {
    // Override mockAuth to set role 'customer'
    const appWithCustomer = express();
    appWithCustomer.get(
      "/admin",
      mockAuth("customer"),
      Roles(["admin"]),
      (req, res) => res.json({ message: "Welcome Admin!" })
    );

    const res = await request(appWithCustomer).get("/admin");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe(
      "Access denied. Role 'customer' not authorized for this resource."
    );
  });

  it("allows access if user's role is allowed", async () => {
    const appWithAdmin = express();
    appWithAdmin.get(
      "/admin",
      mockAuth("admin"),
      Roles(["admin"]),
      (req, res) => res.json({ message: "Welcome Admin!" })
    );

    const res = await request(appWithAdmin).get("/admin");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Welcome Admin!");
  });

  it("allows access if user's role matches one of multiple allowed roles", async () => {
    const appWithCustomer = express();
    appWithCustomer.get(
      "/customer",
      mockAuth("customer"),
      Roles(["customer", "admin"]),
      (req, res) => res.json({ message: "Welcome Customer!" })
    );

    const res = await request(appWithCustomer).get("/customer");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Welcome Customer!");
  });

  it("is case-insensitive for role matching", async () => {
    const appWithAdminCaps = express();
    appWithAdminCaps.get(
      "/admin",
      mockAuth("AdMiN"),
      Roles(["admin"]),
      (req, res) => res.json({ message: "Welcome Admin!" })
    );

    const res = await request(appWithAdminCaps).get("/admin");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Welcome Admin!");
  });
});
