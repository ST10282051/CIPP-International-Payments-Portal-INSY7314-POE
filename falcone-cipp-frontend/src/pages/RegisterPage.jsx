import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Shield,
  Phone,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import API from "../api/axios"; // Customer axios
import { registerEmployee } from "../api/employeeAxios"; // Employee/Admin axios
import "./RegisterPage.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const canSelectAdmin = email.endsWith("@falconecipp.co.za");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (role === "admin" && !canSelectAdmin) {
      setError("Admin email must end with @falconecipp.co.za");
      setLoading(false);
      return;
    }

    try {
      let res;
      const payload = {
      username,
      name,
      surname,
      idNumber,
      phone: cellNumber, 
      email,
      password,
      role,
    };


      if (role === "customer") {
        res = await API.post("/register", payload);
      } else {
        res = await registerEmployee(payload);
      }

      if (res.status === 201) {
        setSuccess("✅ Registration successful! You can now log in.");
        setUsername("");
        setName("");
        setSurname("");
        setIdNumber("");
        setCellNumber("");
        setEmail("");
        setPassword("");
        setRole("customer");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="bg-decoration">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
      </div>

      <div className="register-wrapper">
        <div className="register-brand">
          <div className="brand-icon-wrapper">
            <div className="brand-icon">
              <Shield className="shield-icon" />
            </div>
          </div>
          <h1 className="brand-title">Falcone CIPP</h1>
          <p className="brand-subtitle">Secure Registration Portal</p>
        </div>

        <div className="register-card">
          <h2 className="register-title">Create an Account</h2>

          {error && (
            <div className="error-alert">
              <AlertCircle className="error-icon" />
              <span className="error-text">{error}</span>
            </div>
          )}

          {success && (
            <div className="success-alert">
              <Shield className="success-icon" />
              <span className="success-text">{success}</span>
            </div>
          )}

          <form className="register-form" onSubmit={handleRegister}>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                placeholder="First Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <CreditCard className="input-icon" />
              <input
                type="text"
                placeholder="ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                pattern="\d{9}|\d{13}"
                required
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <Phone className="input-icon" />
              <input
                type="text"
                placeholder="Cell Number"
                value={cellNumber}
                onChange={(e) => setCellNumber(e.target.value)}
                pattern="\+?\d{10,15}"
                required
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="form-input"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-input"
            >
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
              <option value="admin" disabled={!canSelectAdmin}>
                Admin {!canSelectAdmin && "(requires @falconecipp.co.za email)"}
              </option>
            </select>

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="login-section">
            <p className="login-link">
              Already have an account?{" "}
              <a href="/" className="login-link-text">
                Login here
              </a>
            </p>
          </div>

          <div className="security-badge">
            <Shield className="security-icon" />
            <span className="security-text">Secure & Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
// (Code Bless You , 2025). 