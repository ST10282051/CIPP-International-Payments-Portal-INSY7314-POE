import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  Shield,
  Phone,
  FileText,
  Users,
} from "lucide-react";
import { addCustomer } from "../api/employeeAxios";
import "./AddCustomer.css";

export default function AddCustomer() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    surname: "",
    idNumber: "",
    cellNumber: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        surname: form.surname.trim(),
        idNumber: form.idNumber.trim(),
        phone: form.cellNumber.trim(), 
        email: form.email.trim(),
        password: form.password.trim(),
      };

      await addCustomer(payload);

      setSuccess("✅ Customer added successfully!");
      setForm({
        username: "",
        name: "",
        surname: "",
        idNumber: "",
        cellNumber: "",
        email: "",
        password: "",
      });
    } catch (err) {
      console.error("Add customer error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "❌ Failed to add customer"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-customer-page">
      <div className="page-header-actions">
        <h2>Add New Customer</h2>
        <button
          type="button"
          onClick={() => navigate("/employee/all-users")}
          className="btn-view-users"
        >
          <Users className="btn-icon-header" />
          View All Users
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-alert">
          <Shield />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-customer-form">
        {/* Username */}
        <div className="form-group">
          <label>Username</label>
          <div className="input-wrapper">
            <User />
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={form.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={50}
            />
          </div>
        </div>

        {/* Name */}
        <div className="form-group">
          <label>Name</label>
          <div className="input-wrapper">
            <FileText />
            <input
              type="text"
              name="name"
              placeholder="Enter first name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
        </div>

        {/* Surname */}
        <div className="form-group">
          <label>Surname</label>
          <div className="input-wrapper">
            <FileText />
            <input
              type="text"
              name="surname"
              placeholder="Enter surname"
              value={form.surname}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
        </div>

        {/* ID Number */}
        <div className="form-group">
          <label>ID Number</label>
          <div className="input-wrapper">
            <FileText />
            <input
              type="text"
              name="idNumber"
              placeholder="Enter ID number"
              value={form.idNumber}
              onChange={handleChange}
              required
              pattern="[a-zA-Z0-9]{6,20}"
              title="6-20 alphanumeric characters"
            />
          </div>
        </div>

        {/* Cell Number */}
        <div className="form-group">
          <label>Cell Number</label>
          <div className="input-wrapper">
            <Phone />
            <input
              type="text"
              name="cellNumber"
              placeholder="Enter cell number"
              value={form.cellNumber}
              onChange={handleChange}
              required
              pattern="\d{10,15}"
              title="10-15 digits, no '+' sign"
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <div className="input-wrapper">
            <Mail />
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock />
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Customer"}
        </button>
      </form>

      <button className="back-button" onClick={() => navigate("/employee")}>
        Back to Dashboard
      </button>
    </div>
  );
}
// (Code Bless You , 2025). 